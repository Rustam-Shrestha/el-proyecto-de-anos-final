import { useEffect, type PropsWithChildren } from "react";
import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { store } from "@app/store";
import { queryClient } from "@app/queryClient";
import { useAppSelector } from "@hooks/reduxHooks";
import { selectDarkMode, selectThemeColor } from "@store/slices/uiSlice";
import { applyThemeToDocument } from "@shared/lib/theme";

const ThemeBootstrap = () => {
  const darkMode = useAppSelector(selectDarkMode);
  const themeColor = useAppSelector(selectThemeColor);

  useEffect(() => {
    applyThemeToDocument(themeColor, darkMode);
  }, [darkMode, themeColor]);

  return null;
};

export const AppProviders = ({ children }: PropsWithChildren) => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeBootstrap />
        {children}
      </QueryClientProvider>
    </Provider>
  );
};
