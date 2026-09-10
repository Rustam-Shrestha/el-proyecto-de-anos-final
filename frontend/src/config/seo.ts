export const SITE_URL = "https://finguard.io";

export const PAGE_TITLES: Record<string, string> = {
  "/": "AI Loan Risk Prediction | FinGuard",
  "/apply": "Apply for a Loan | FinGuard",
  "/docs": "API Documentation | FinGuard",
  "/dashboard": "Lender Dashboard | FinGuard",
  "/pricing": "Pricing | FinGuard",
  "/about": "About FinGuard",
  "/contact": "Contact FinGuard Support",
  "/terms": "Terms of Service | FinGuard",
  "/privacy": "Privacy Policy | FinGuard",
  "/404": "404 — Page Not Found | FinGuard",
  "/401": "401 — Unauthorized | FinGuard",
  "/login": "Sign In | FinGuard",
  "/register": "Create Account | FinGuard",
};

export const META_DESCRIPTIONS: Record<string, string> = {
  "/": "AI-powered loan default risk prediction. FinGuard helps lenders approve confidently. Get started free.",
  "/apply": "Apply for a loan in 5 minutes. FinGuard's AI analyzes your financial profile and gives instant decision.",
  "/docs": "API documentation for FinGuard loan risk model. Integrate default risk prediction into your platform.",
  "/dashboard": "Lender dashboard. Manage loan applications, track default risk, view analytics. FinGuard.",
  "/pricing": "Affordable loan risk prediction pricing. Pay per prediction or unlimited tier. No hidden fees.",
  "/about": "About FinGuard. We build AI for smarter lending. Founded on Home Credit data science, now in production.",
  "/contact": "Contact FinGuard support. Email, chat, or phone. We're here to help integrate default risk prediction.",
  "/terms": "Terms of Service. Legal agreement governing FinGuard platform use. Read before account creation.",
  "/privacy": "Privacy Policy. How FinGuard protects your data. GDPR-compliant, no data selling, audit trail.",
  "/404": "Page not found. Return to FinGuard homepage or explore our API documentation.",
  "/401": "Please log in to access this page. FinGuard requires authentication for dashboard access.",
  "/login": "Sign in to FinGuard. Secure access to your lender dashboard and loan risk predictions.",
  "/register": "Create your FinGuard account. Start predicting loan default risk in minutes.",
};

export function canonicalUrl(path: string): string {
  const clean = path.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  if (clean === "/") return SITE_URL;
  return `${SITE_URL}${clean}`;
}

export const INTERNAL_LINKS = {
  home: ["/apply", "/docs", "/pricing", "/about"],
  apply: ["/docs", "/contact", "/"],
  docs: ["/apply", "/pricing", "/"],
  footer: ["/about", "/contact", "/pricing", "/terms", "/privacy", "/docs"],
};
