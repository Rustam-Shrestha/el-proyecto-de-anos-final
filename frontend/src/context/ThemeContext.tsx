// @ts-nocheck
/**
 * @deprecated This ThemeContext is superseded by Redux Toolkit (uiSlice).
 *
 * For new code, prefer:
 *   - useUI()  from 'hooks/useUI'  → themeColor, updateTheme
 *
 * Kept temporarily for backward compatibility with features not yet migrated.
 */
// ThemeContext.js
import { createContext, useContext, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeColor, setThemeColor] = useState("142.1 76.2% 36.3%"); // Default color

  const updateTheme = (color) => {
    setThemeColor(color);
    document.documentElement.style.setProperty("--theme-primary", color);
  };

  return (
    <ThemeContext.Provider value={{ themeColor, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
