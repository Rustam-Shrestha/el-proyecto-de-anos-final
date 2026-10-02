import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { normalizeRole, roleKind } from '@shared/utils/roleUtils';

/**
 * Legacy hook kept for pages outside the live router. Uses the same
 * kind-aware matching as RoleProtectedRoute (role aliases like
 * company_admin/customer work; the platform owner always passes) so there
 * is exactly one role-check semantic in the app.
 */
const useProtectedRoute = (requiredRoles?: string[]) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (requiredRoles && requiredRoles.length > 0) {
      const current = normalizeRole(user.role);
      const kind = roleKind(user.role);
      const allowedRoles = requiredRoles.map((role) => normalizeRole(role));
      const allowedKinds = requiredRoles.map((role) => roleKind(role));
      const isSuper = kind === 'superadmin';
      if (!isSuper && !allowedRoles.includes(current) && !allowedKinds.includes(kind)) {
        navigate('/unauthorized');
      }
    }
  }, [user, requiredRoles, navigate]);
};

export default useProtectedRoute;
