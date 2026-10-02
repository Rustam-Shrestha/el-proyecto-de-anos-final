import { prisma } from "@/config/database";
import { permissionResolver } from "./permissionResolver";

export const roleService = {
  async getPermissionsForUser(userId: string, roleName: string): Promise<string[]> {
    // try DB roleDefinitions first via tenant-aware? fallback to roleName map
    try {
      const roleDef = await prisma.roleDefinition.findFirst({ where: { name: roleName } });
      if (roleDef) {
        return await permissionResolver.resolvePermissions([roleDef.id]);
      }
    } catch { /* ignore */ }
    return permissionResolver.resolveForRoleName(roleName);
  },
  async listRoles() {
    return prisma.roleDefinition.findMany({ include: { permissions: { include: { permission: true } } } });
  },
};
