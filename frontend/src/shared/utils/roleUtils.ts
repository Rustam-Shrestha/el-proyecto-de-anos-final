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

export type RoleKind = "superadmin" | "admin" | "reviewer" | "user";

/** Canonical UI grouping. company_admin->admin, customer->user, supercontroller->superadmin. */
export const roleKind = (role?: RoleLike): RoleKind => {
  const raw = normalizeRole(role).replace(/[\s-]+/g, "_");
  if (raw === "superadmin" || raw === "supercontroller" || raw === "super_admin") return "superadmin";
  if (raw === "admin" || raw === "company_admin" || raw === "tenantadmin" || raw === "tenant_admin") return "admin";
  if (raw === "reviewer" || raw === "validator" || raw === "loanapprover" || raw === "loan_approver" || raw === "employee") return "reviewer";
  return "user";
};

/** Explicit human label — every logged-in account shows who it is. */
export const roleLabel = (role?: RoleLike): string => {
  switch (roleKind(role)) {
    case "superadmin": return "Super Admin";
    case "admin": return "Company Admin";
    case "reviewer": return "Reviewer";
    default: return "Customer";
  }
};
