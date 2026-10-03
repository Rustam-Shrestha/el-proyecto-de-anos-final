export const applyThemeToDocument = (color: string) => {
  const root = document.documentElement;
  const body = document.body;
  root.classList.remove("dark");
  const themeVars: Record<string, string> = {
    "--theme-primary": color,
    "--primary": "#15803D",
    "--primary-hover": "#166534",
    "--primary-active": "#14532D",
    "--primary-soft": "#DCFCE7",
    "--text-primary": "#0F172A",
    "--text-secondary": "#334155",
    "--text-muted": "#64748B",
    "--text-subtle": "#94A3B8",
    "--bg-color": "#F8FAFC",
    "--surface-color": "#FFFFFF",
    "--surface-muted": "#F1F5F9",
    "--border-color": "#E2E8F0",
    "--border-strong": "#CBD5E1",
    "--success": "#16A34A",
    "--success-soft": "#DCFCE7",
    "--warning": "#D97706",
    "--warning-soft": "#FEF3C7",
    "--danger": "#DC2626",
    "--danger-soft": "#FEE2E2",
    "--info": "#0284C7",
    "--info-soft": "#E0F2FE",
    "--text-color": "#0F172A",
    "--green-icon": "#15803D",
    "--green-background": "#15803D",
    "--green-footer": "#DCFCE7",
    "--green-border": "#b8d2bb",
    "--green-table-border": "#15803D",
    "--yellow-status": "#FEF3C7",
    "--yellow-background-card": "#FEF3C7",
    "--yellow-in-progress": "#D97706",
    "--gray-column-text": "#64748B",
    "--gray-logo-header": "#929292",
    "--gray-nav-items": "#334155",
    "--red": "#DC2626",
    "--white": "#ffffff",
  };
  Object.entries(themeVars).forEach(([k, v]) => root.style.setProperty(k, v));
  body.style.backgroundColor = themeVars["--bg-color"];
  body.style.color = themeVars["--text-primary"];
};
