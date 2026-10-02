import { prisma } from "@/config/database";

export class PermissionResolver {
  private dependencyMap = new Map<string, string[]>([
    ["loans.approve", ["loans.read", "users.read"]],
    ["loans.reject", ["loans.read", "users.read"]],
    ["users.write", ["users.read"]],
    ["loans.write", ["loans.read"]],
    ["admin.access", ["users.read"]],
  ]);

  async resolvePermissions(roleIds: number[]): Promise<string[]> {
    const roles = await prisma.roleDefinition.findMany({
      where: { id: { in: roleIds } },
      include: { permissions: { include: { permission: true } } },
    });
    const permissions = new Set<string>();
    for (const role of roles) {
      for (const rp of role.permissions) permissions.add(rp.permission.name);
    }
    const resolved = new Set<string>();
    const queue = Array.from(permissions);
    while (queue.length > 0) {
      const perm = queue.shift()!;
      if (!resolved.has(perm)) {
        resolved.add(perm);
        const deps = this.dependencyMap.get(perm) || [];
        queue.push(...deps);
      }
    }
    return Array.from(resolved);
  }

  // fallback for legacy string roles (no DB) - map role names to permissions
  resolveForRoleName(roleName: string): string[] {
    const map: Record<string, string[]> = {
      ADMIN: ["admin.access", "users.read", "users.write", "loans.read", "loans.write", "loans.approve", "loans.reject"],
      REVIEWER: ["loans.read", "loans.approve", "loans.reject", "users.read"],
      USER: ["loans.read", "loans.write", "users.read"],
    };
    const direct = map[roleName.toUpperCase()] || ["users.read"];
    const resolved = new Set<string>(direct);
    const queue = [...direct];
    while (queue.length) {
      const p = queue.shift()!;
      for (const d of this.dependencyMap.get(p) || []) {
        if (!resolved.has(d)) {
          resolved.add(d);
          queue.push(d);
        }
      }
    }
    return Array.from(resolved);
  }

  hasPermission(permissions: string[], required: string): boolean {
    return permissions.includes(required);
  }
  hasAnyPermission(permissions: string[], required: string[]): boolean {
    return required.some((p) => permissions.includes(p));
  }
}

export const permissionResolver = new PermissionResolver();
