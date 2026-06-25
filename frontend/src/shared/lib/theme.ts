export const applyThemeToDocument = (color: string) => {
  const root = document.documentElement;
  const body = document.body;

  root.classList.remove("dark");

  const themeVars = {
    "--theme-primary": color,
    "--bg-color": "#ffffff",
    "--surface-color": "#ffffff",
    "--surface-muted": "#f9fafb",
    "--text-color": "#030712",
    "--border-color": "#e5e7eb",
    "--green-icon": "#3c8743",
    "--green-background": "#006039",
    "--green-footer": "#f0fdf4",
    "--green-border": "#b8d2bb",
    "--green-table-border": "#0f6b18",
    "--yellow-status": "#fde282",
    "--yellow-background-card": "#fceecb",
    "--yellow-in-progress": "#fde282",
    "--gray-column-text": "#6b7280",
    "--gray-logo-header": "#929292",
    "--gray-nav-items": "#6b7280",
    "--red": "#dc2626",
    "--white": "#ffffff",
  };

  Object.entries(themeVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  body.style.backgroundColor = themeVars["--bg-color"];
  body.style.color = themeVars["--text-color"];
};
