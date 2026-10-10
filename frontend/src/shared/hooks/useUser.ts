import { useAppSelector } from '@/store/hooks';

export const useUser = () => {
  const user = useAppSelector((state) => state.auth.user);

  return {
    user,
    userId: user?.id || '',
    userRole: user?.role || 'CUSTOMER',
    tenantId: user?.tenantId || null,
    email: user?.email || '',
  };
};

export default useUser;
