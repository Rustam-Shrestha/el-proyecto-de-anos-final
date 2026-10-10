import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout as logoutAction, selectUser, selectAccessToken, selectIsAuthenticated, selectIsLoading } from '@/store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const accessToken = useAppSelector(selectAccessToken);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectIsLoading);

  const logout = () => {
    dispatch(logoutAction());
  };

  return {
    user,
    token: accessToken,
    accessToken,
    isAuthenticated,
    loading,
    logout,
  };
};

export default useAuth;
