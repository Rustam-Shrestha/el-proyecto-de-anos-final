/**
 * Canonical role model for FinGuard.
 *
 * Platform owner : SUPERADMIN  (row in public.supercontroller; full platform access)
 * Company owner  : ADMIN       (tenant admin; manages own company only)
 * Staff reviewer : REVIEWER    (reviews KYC/loans in own company)
 * End customer   : USER        (applies, views own data)
 *
 * MD-compat aliases accepted everywhere and normalized:
 *   company_admin -> ADMIN, customer -> USER,
 *   reviewer/validator/loan_approver -> REVIEWER,
 *   superadmin/supercontroller -> SUPERADMIN
 */

/** Normalize any role spelling to its canonical uppercase form. */
export function normalizeRoleName(role: unknown): string {
  const raw = String(role ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  switch (raw) {
    case "superadmin":
    case "supercontroller":
    case "super_admin":
      return "SUPERADMIN";
    case "admin":
    case "company_admin":
    case "tenantadmin":
    case "tenant_admin":
      return "ADMIN";
    case "reviewer":
    case "validator":
    case "loanapprover":
    case "loan_approver":
    case "employee":
      return "REVIEWER";
    case "user":
    case "customer":
      return "USER";
    default:
      return String(role ?? "").trim().toUpperCase() || "USER";
  }
}

/** Short UI grouping: superadmin | admin | reviewer | user */
export function roleKind(role: unknown): "superadmin" | "admin" | "reviewer" | "user" {
  switch (normalizeRoleName(role)) {
    case "SUPERADMIN": return "superadmin";
    case "ADMIN": return "admin";
    case "REVIEWER": return "reviewer";
    default: return "user";
  }
}

/** Human-readable label shown in the navbar (makes every account's role explicit). */
export function roleLabel(role: unknown): string {
  switch (normalizeRoleName(role)) {
    case "SUPERADMIN": return "Super Admin";
    case "ADMIN": return "Company Admin";
    case "REVIEWER": return "Reviewer";
    default: return "Customer";
  }
}

export const isSuperAdminRole = (role: unknown): boolean => normalizeRoleName(role) === "SUPERADMIN";
export const isTenantStaffRole = (role: unknown): boolean => {
  const r = normalizeRoleName(role);
  return r === "ADMIN" || r === "REVIEWER";
};

/**
 * PAN numbers are collected as typed by the user (any reasonable format).
 * Normalized for storage: uppercased, spaces/hyphens removed.
 * Accepted: 5-15 letters/digits (covers ABCDE1234F and any local format).
 */
export function normalizePan(input: unknown): string {
  const pan = String(input ?? "").toUpperCase().replace(/[\s-]+/g, "").trim();
  if (!/^[A-Z0-9]{5,15}$/.test(pan)) {
    throw new Error("Enter a valid PAN (5-15 letters/digits, e.g. ABCDE1234F)");
  }
  return pan;
}
