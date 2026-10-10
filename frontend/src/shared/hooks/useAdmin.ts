import { useUser } from './useUser';

export const useAdmin = () => {
  const { userRole } = useUser();

  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN';

  return {
    isAdmin,
    canAccessAdminPanel: isAdmin,
    canManageUsers: isAdmin,
    canViewReports: isAdmin,
    canApproveLoans: isAdmin || userRole === 'LOAN_OFFICER',
  };
};

export default useAdmin;
