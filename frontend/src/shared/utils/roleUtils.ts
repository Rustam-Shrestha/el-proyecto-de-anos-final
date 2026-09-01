type RoleLike = string | string[] | { name?: string } | { role?: string } | null | undefined;

export const normalizeRole = (role?: RoleLike): string => {
  if (Array.isArray(role)) return role[0]?.trim().toLowerCase() ?? "";
  if (typeof role === "string") return role.trim().toLowerCase();
  if (role && typeof role === "object") {
    const nestedRole = "name" in role ? role.name : "role" in role ? role.role : undefined;
    return normalizeRole(nestedRole);
  }
  return "";
};
