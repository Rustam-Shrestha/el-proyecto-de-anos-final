export const normalizeRole = (role?: string | string[] | null): string => {
  if (Array.isArray(role)) return role[0]?.trim().toLowerCase() ?? "";
  if (typeof role !== "string") return "";
  return role.trim().toLowerCase();
};
