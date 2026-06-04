export const applyThemeToDocument = (color: string, isDark: boolean) => {
  const root = document.documentElement;
  const body = document.body;

  root.classList.toggle("dark", isDark);

  const themeVars = isDark
    ? {
        "--theme-primary": color,
        "--bg-color": "#0d1f18",
        "--surface-color": "#16241d",
        "--surface-muted": "#1e2e25",
        "--text-color": "#e8f2eb",
        "--border-color": "#2d3d34",
        "--green-icon": "#7bc28a",
        "--green-background": "#1a3d26",
        "--green-footer": "#1e2e25",
        "--green-border": "#3a5a42",
        "--green-table-border": "#2d4a36",
        "--yellow-status": "#d4a530",
        "--yellow-background-card": "#3d3520",
        "--yellow-in-progress": "#d4a530",
        "--gray-column-text": "#9aaa9f",
        "--gray-logo-header": "#8a9a8f",
        "--gray-nav-items": "#7a8a7f",
        "--red": "#e74c3c",
        "--white": "#ffffff",
      }
    : {
        "--theme-primary": color,
        "--bg-color": "#f0f7f2",
        "--surface-color": "#ffffff",
        "--surface-muted": "#f4f8f5",
        "--text-color": "#1f2937",
        "--border-color": "#dbe5dc",
        "--green-icon": "#3c8743",
        "--green-background": "#006039",
        "--green-footer": "#e2ede3",
        "--green-border": "#b8d2bb",
        "--green-table-border": "#0f6b18",
        "--yellow-status": "#fde282",
        "--yellow-background-card": "#fceecb",
        "--yellow-in-progress": "#fde282",
        "--gray-column-text": "#7b7b7b",
        "--gray-logo-header": "#929292",
        "--gray-nav-items": "#6e6e6e",
        "--red": "#f44336",
        "--white": "#ffffff",
      };

  Object.entries(themeVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  body.style.backgroundColor = themeVars["--bg-color"];
  body.style.color = themeVars["--text-color"];
};
