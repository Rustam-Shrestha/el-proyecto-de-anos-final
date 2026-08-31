import React from 'react';
import { Link } from 'react-router-dom';
import ROUTES from '../../config/routes';
import useAuth from '../../hooks/useAuth';

const getDisplayName = (user: Record<string, unknown> | null | undefined): string => {
  const candidate =
    (user?.fullName as string | undefined) ||
    (user?.name as string | undefined) ||
    (user?.firstName as string | undefined) ||
    (user?.email as string | undefined)?.split('@')[0] ||
    'User';

  return candidate.trim() || 'User';
};

const getInitials = (name: string): string => {
  const clean = name.trim();
  if (!clean) return 'U';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const NavBar: React.FC = () => {
  const { user, logout } = useAuth();
  const displayName = getDisplayName(user as Record<string, unknown> | null | undefined);
  const initials = getInitials(displayName);

  return (
    <nav style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #eee', alignItems: 'center' }}>
      <Link to={ROUTES.HOME}>Home</Link>
      {user ? (
        <>
          <Link to={ROUTES.DASHBOARD}>Dashboard</Link>
          <Link to={ROUTES.PROFILE.VIEW}>Profile</Link>
          <Link to={ROUTES.KYC.STATUS}>KYC</Link>
          <Link to={ROUTES.DOCUMENTS.LIST}>Documents</Link>
          {(user.role === 'ADMIN' || user.role === 'REVIEWER') && (<Link to={ROUTES.ADMIN.DASHBOARD}>Admin</Link>)}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginLeft: 'auto', fontWeight: 600 }}>
            <span style={{ display: 'inline-flex', width: 28, height: 28, borderRadius: '50%', background: '#0f172a', color: 'white', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
              {initials}
            </span>
            {displayName}
          </span>
          <button onClick={() => logout()}>Logout</button>
        </>
      ) : (
        <>
          <Link to={ROUTES.AUTH.LOGIN}>Login</Link>
          <Link to={ROUTES.AUTH.REGISTER}>Register</Link>
        </>
      )}
    </nav>
  );
};

export default NavBar;
