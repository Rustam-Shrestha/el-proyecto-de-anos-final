import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { AppDispatch, RootState } from "./store";
import {
  logout,
  selectAccessToken,
  selectError,
  selectIsAuthenticated,
  selectIsLoading,
  selectRefreshToken,
  selectUser,
  selectUserData,
  setError,
  setLoading,
  setTokens,
  setUser,
  setUserData,
} from "./slices/authSlice";
import {
  addNotification,
  removeNotification,
  selectIsSidebarOpen,
  selectNotifications,
  selectTheme,
  setTheme,
  toggleSidebar,
} from "./slices/uiSlice";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useAuth = () => {
  const dispatch = useAppDispatch();

  const user = useAppSelector(selectUser);
  const userData = useAppSelector(selectUserData);
  const accessToken = useAppSelector(selectAccessToken);
  const refreshToken = useAppSelector(selectRefreshToken);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectError);

  return {
    user,
    userData,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    error,
    setLoading: (loading: boolean) => dispatch(setLoading(loading)),
    setUser: (nextUser: NonNullable<typeof user>) => dispatch(setUser(nextUser)),
    setUserData: (nextUserData: NonNullable<typeof userData>) => dispatch(setUserData(nextUserData)),
    setTokens: (tokens: { accessToken: string; refreshToken: string }) =>
      dispatch(setTokens(tokens)),
    setError: (nextError: string | null) => dispatch(setError(nextError)),
    logout: () => dispatch(logout()),
  };
};

export const useUI = () => {
  const dispatch = useAppDispatch();

  return {
    isSidebarOpen: useAppSelector(selectIsSidebarOpen),
    theme: useAppSelector(selectTheme),
    notifications: useAppSelector(selectNotifications),
    toggleSidebar: () => dispatch(toggleSidebar()),
    setTheme: (nextTheme: "light" | "dark") => dispatch(setTheme(nextTheme)),
    addNotification: (notification: Parameters<typeof addNotification>[0]) =>
      dispatch(addNotification(notification)),
    removeNotification: (id: string) => dispatch(removeNotification(id)),
  };
};