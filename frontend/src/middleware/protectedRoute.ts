import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const useProtectedRoute = (requiredRoles?: string[]) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      navigate('/unauthorized');
    }
  }, [user, requiredRoles, navigate]);
};

export default useProtectedRoute;
