export const applyThemeToDocument = (color: string, isDark: boolean) => {
  const root = document.documentElement;
  const body = document.body;

  root.classList.toggle("dark", isDark);

  const themeVars = isDark
    ? {
        "--theme-primary": color,
        "--bg-color": "#10211a",
        "--surface-color": "#18251f",
        "--surface-muted": "#203027",
        "--text-color": "#e5efe8",
        "--border-color": "#314238",
        "--green-icon": "#8bc89a",
        "--green-background": "#d7f0dd",
        "--green-footer": "#203027",
      }
    : {
        "--theme-primary": color,
        "--bg-color": "#eef5ef",
        "--surface-color": "#ffffff",
        "--surface-muted": "#f4f8f5",
        "--text-color": "#1f2937",
        "--border-color": "#dbe5dc",
        "--green-icon": "#3c8743",
        "--green-background": "#006039",
        "--green-footer": "#e2ede3",
      };

  Object.entries(themeVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  body.style.backgroundColor = themeVars["--bg-color"];
  body.style.color = themeVars["--text-color"];
};
