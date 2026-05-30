# Backend Node Change Dossier

Date: 2026-05-30

Scope: `backend-node/` and the cross-cutting `.github` instruction-system refresh. `backend-fastapi/` has no code changes in this window.

## Executive Inventory

| File | Change Type | What Changed |
|---|---|---|
| `backend-node/src/app.ts` | Update | Served `/uploads` statically so uploaded avatars and other files are reachable from the browser. |
| `backend-node/src/middleware/avatarUpload.ts` | Add | Added a dedicated Multer upload pipeline for avatar files. |
| `backend-node/src/controllers/userController.ts` | Update | Added avatar upload/delete endpoints, file cleanup helpers, and audit logging. |
| `backend-node/src/routes/userRoutes.ts` | Update | Registered `/me/avatar` PATCH/DELETE routes and wired upload middleware. |
| `backend-node/src/services/userService.ts` | Update | Extended profile reads/writes to include profile fields and avatar URL persistence. |
| `backend-node/src/types/alias-declarations.d.ts` | Update | Added module declarations for the avatar upload middleware and expanded user controller typings. |
| `.github/copilot-instructions.md` | Update | Replaced the monolith with a lean router. |
| `.github/instructions/*.md` | Add | Split instruction content into concern-specific files. |

## What This Release Achieved

The backend now supports first-class user avatar lifecycle management. The browser can upload an avatar, the server stores it under `uploads/avatars`, user profile reads now return profile/avatar fields, and deleting or replacing an avatar removes stale files from disk. This is backed by audit events so user profile changes stay traceable.

The repository instruction system was also restructured so future Copilot prompts load only the relevant slice of guidance instead of a monolithic file.

## Detailed Changes

### `backend-node/src/app.ts`

Why:
- Uploaded assets needed to be reachable over HTTP.
- Avatar URLs are persisted as `/uploads/...` paths and must resolve in the browser.

What changed:
```ts
import path from "path";

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
```

Outcome:
- Anything saved under `uploads/` is now served by Express.
- The avatar URLs returned by the API can be rendered directly by the frontend.

### `backend-node/src/middleware/avatarUpload.ts` (new)

Why:
- Avatar upload rules belong in a dedicated upload middleware instead of controller code.

What changed:
```ts
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { logger } from '@/config/logger';

const avatarUploadDir = path.join(process.cwd(), 'uploads', 'avatars');

fs.mkdirSync(avatarUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarUploadDir);
  },
  filename: (req, file, cb) => {
    if (!req.user) {
      return cb(new Error('User not authenticated'));
    }

    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${req.user.id}_avatar_${Date.now()}${ext}`);
  },
});

const fileFilter = (_req: unknown, file: { mimetype: string }, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error(`File type ${file.mimetype} is not allowed for avatars`));
};

export const avatarUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

logger.info(`📁 Avatar upload configured at: ${avatarUploadDir}`);
```

Outcome:
- The upload location is predictable and created automatically.
- The server rejects unsupported avatar MIME types.
- Avatar files are capped at 5 MB.

### `backend-node/src/controllers/userController.ts`

Why:
- Avatar upload/delete is a user-facing action that needs orchestration across storage, database, and audit logs.
- Old avatar files must be removed when replaced or deleted.

What changed:
```ts
import fs from 'fs/promises';
import path from 'path';

const isUploadPath = (value?: string | null) => Boolean(value && value.startsWith('/uploads/'));

const resolveUploadFilePath = (value: string) => path.join(process.cwd(), value.replace(/^\//, ''));

const deleteUploadIfPresent = async (value?: string | null): Promise<void> => {
  if (!isUploadPath(value)) {
    return;
  }

  try {
    await fs.unlink(resolveUploadFilePath(value as string));
  } catch {
    // Missing files are fine; the database record is authoritative.
  }
};
```

```ts
export const uploadAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const file = req.file as { filename: string } | undefined;

    if (!file) {
      res.status(400).json(apiResponse.error('Avatar file is required', 400));
      return;
    }

    const currentProfile = await userService.getUserProfile(req.user.id);
    const previousAvatarUrl = currentProfile.avatarUrl;
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    const updated = await userService.updateProfileAvatar(req.user.id, avatarUrl);

    if (previousAvatarUrl && previousAvatarUrl !== avatarUrl) {
      await deleteUploadIfPresent(previousAvatarUrl);
    }

    await auditService.log({
      userId: req.user.id,
      action: 'UPDATE_AVATAR',
      metadata: { avatarUrl },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Avatar updated', updated));
  } catch (error) {
    const file = req.file as { filename: string } | undefined;
    if (file) {
      await deleteUploadIfPresent(`/uploads/avatars/${file.filename}`);
    }
    next(error);
  }
};
```

```ts
export const deleteAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const currentProfile = await userService.getUserProfile(req.user.id);
    const previousAvatarUrl = currentProfile.avatarUrl;
    const updated = await userService.removeProfileAvatar(req.user.id);

    await deleteUploadIfPresent(previousAvatarUrl);

    await auditService.log({
      userId: req.user.id,
      action: 'DELETE_AVATAR',
      metadata: { previousAvatarUrl },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Avatar removed', updated));
  } catch (error) {
    next(error);
  }
};
```

Outcome:
- Avatar uploads are validated, persisted, auditable, and cleaned up if something fails.
- Replace/delete behavior no longer leaves orphaned files behind.

### `backend-node/src/routes/userRoutes.ts`

Why:
- The controller needed public route wiring and the upload middleware in the correct order.

What changed:
```ts
import { avatarUpload } from '@/middleware/avatarUpload';
import {
  getMe,
  updateMe,
  uploadAvatar,
  deleteAvatar,
  listUsers,
  getUser,
  changeUserRole,
  deleteUser,
} from '@/controllers/userController';
```

```ts
userRouter.patch('/me', authenticate, validate(updateUserSchema), updateMe);

userRouter.patch('/me/avatar', authenticate, avatarUpload.single('avatar'), uploadAvatar);

userRouter.delete('/me/avatar', authenticate, deleteAvatar);
```

Outcome:
- The avatar endpoints are now part of the public API surface.
- Upload validation happens before controller logic.

### `backend-node/src/services/userService.ts`

Why:
- Profile reads and writes needed to include profile fields and avatar state.
- Avatar operations should be reflected in the database, not just in uploaded files.

What changed:
```ts
type UserProfileFields = {
  fullName?: string | null;
  phone?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
};

type UserWithProfile = Pick<User, 'id' | 'email' | 'role' | 'isVerified' | 'isDeleted' | 'createdAt' | 'updatedAt'> & {
  profile?: UserProfileFields | null;
};
```

```ts
const profileSelect = {
  fullName: true,
  phone: true,
  address: true,
  avatarUrl: true,
} as const;

const mapUserProfile = (user: UserWithProfile): Omit<UserDetail, 'isDeleted'> => ({
  id: user.id,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  fullName: user.profile?.fullName ?? null,
  phone: user.profile?.phone ?? null,
  address: user.profile?.address ?? null,
  avatarUrl: user.profile?.avatarUrl ?? null,
});
```

```ts
async getUserProfile(userId: string): Promise<Omit<UserDetail, 'isDeleted'>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
      profile: {
        select: profileSelect,
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return mapUserProfile(user);
}
```

```ts
if (data.email) {
  await prisma.user.update({
    where: { id: userId },
    data: { email: data.email },
  });
}

const profileData = {
  fullName: data.fullName,
  phone: data.phone,
  address: data.address,
};

const hasProfileUpdates = Object.values(profileData).some((value) => value !== undefined);

if (hasProfileUpdates) {
  await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      fullName: data.fullName,
      phone: data.phone,
      address: data.address,
    },
    update: {
      ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.address !== undefined ? { address: data.address } : {}),
    },
  });
}
```

```ts
async updateProfileAvatar(userId: string, avatarUrl: string): Promise<UserDetail> {
  await prisma.profile.upsert({
    where: { userId },
    create: { userId, avatarUrl },
    update: { avatarUrl },
  });
  ...
}

async removeProfileAvatar(userId: string): Promise<UserDetail> {
  await prisma.profile.upsert({
    where: { userId },
    create: { userId, avatarUrl: null },
    update: { avatarUrl: null },
  });
  ...
}
```

Outcome:
- The user profile now carries `fullName`, `phone`, `address`, and `avatarUrl`.
- Email updates remain separate from profile updates.
- Avatar state is persisted in the profile row and returned to the API consumer.

### `backend-node/src/types/alias-declarations.d.ts`

Why:
- The new middleware and controller exports needed type declarations for the alias-based import system.

What changed:
```ts
declare module '@/middleware/avatarUpload' {
  export const avatarUpload: any;
}
```

```ts
declare module '@/controllers/userController' {
  export const getMe: any;
  export const updateMe: any;
  export const uploadAvatar: any;
  export const deleteAvatar: any;
  export const listUsers: any;
  export const getUser: any;
  export const changeUserRole: any;
  export const deleteUser: any;
}
```

Outcome:
- TypeScript can resolve the new alias modules cleanly.

## Evolution Narrative

The backend user profile flow evolved from a plain profile fetch/update surface into a richer profile system that includes avatar management and consistent profile enrichment. Before this change, the API could update user information but had no lifecycle for avatar files. After this change, the backend now:

1. Accepts avatar uploads through a dedicated upload middleware.
2. Stores files in a deterministic directory under `uploads/avatars`.
3. Returns avatar URLs as part of the profile payload.
4. Deletes replaced or removed avatar files from disk.
5. Audits both avatar updates and deletes.

The instruction system also moved from a single monolith to a router plus per-concern files, which makes future Copilot prompts smaller and more targeted.

## Intern Guide

If you are new to this backend, learn it in this order:

1. Start with `src/routes/userRoutes.ts` to see the public API shape.
2. Read `src/controllers/userController.ts` to understand request orchestration.
3. Read `src/services/userService.ts` to see how user data and profile rows are persisted.
4. Read `src/middleware/avatarUpload.ts` to understand the file upload pipeline.
5. Read `src/app.ts` to see how `/uploads` and `/api/v1` are mounted.

Mental model:
- Routes wire middleware order.
- Controllers own request/response orchestration.
- Services own database logic.
- Middleware owns cross-cutting concerns like auth, validation, and file handling.

When adding a new user-facing endpoint, follow the same pattern: validate at the route layer, keep the controller thin, move persistence into the service, and log notable actions with `auditService`.
