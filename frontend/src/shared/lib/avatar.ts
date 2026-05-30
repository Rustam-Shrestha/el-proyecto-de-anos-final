import { env } from "@shared/lib/env";

const getBackendOrigin = () => {
  try {
    return new URL(env.VITE_API_BASE_URL).origin;
  } catch {
    return "";
  }
};

export const resolveAvatarUrl = (avatarUrl?: string | null) => {
  if (!avatarUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(avatarUrl)) {
    return avatarUrl;
  }

  const origin = getBackendOrigin();
  const normalizedPath = avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`;
  return origin ? `${origin}${normalizedPath}` : normalizedPath;
};