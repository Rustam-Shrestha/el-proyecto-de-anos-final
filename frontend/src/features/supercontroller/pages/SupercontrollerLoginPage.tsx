import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@shared/lib/apiClient';
import { useAppDispatch } from '@hooks/reduxHooks';
import { setTokens, setUser } from '@store/slices/authSlice';

export default function SupercontrollerLoginPage() {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('santosh.787402@smc.tu.edu.np');
  const [password, setPassword] = useState('SuperAdmin@123!');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault(); setErr(null); setLoading(true);
    try {
      const res = await apiClient.post('/supercontroller/login', { email, password });
      const { accessToken, refreshToken, user } = res.data.data;
      // RoleProtectedRoute + apiClient both read the redux auth slice, so the
      // platform owner has to be seeded there too (not just localStorage) or
      // every superadmin route bounces back to /login.
      dispatch(setTokens({ accessToken, refreshToken }));
      dispatch(setUser({
        id: String(user?.id ?? ''),
        email: user?.email ?? email,
        name: user?.email ?? email,
        role: 'Supercontroller',
        isSuperUser: true,
        permissions: user?.permissions ?? [],
      }));
      localStorage.setItem('userRole', 'Supercontroller');
      nav('/supercontroller');
    } catch (e: unknown) { setErr((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Login failed'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="bg-white rounded-xl border border-[#eceef2] p-6 w-full max-w-sm shadow-sm">
        <h1 className="text-lg font-bold text-slate-800">SuperController Login</h1>
        <p className="text-xs text-slate-500 mb-4">Platform admin — manages all tenants</p>
        <div className="space-y-3">
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          {err && <p className="text-xs text-red-600">{err}</p>}
          <button type="submit" disabled={loading} className="w-full py-2 rounded-lg bg-[#15803D] text-white text-sm font-medium disabled:opacity-50">{loading ? 'Signing in…' : 'Sign in'}</button>
          <p className="text-[11px] text-slate-400">Demo: santosh.787402@smc.tu.edu.np / SuperAdmin@123!</p>
        </div>
      </form>
    </div>
  );
}
