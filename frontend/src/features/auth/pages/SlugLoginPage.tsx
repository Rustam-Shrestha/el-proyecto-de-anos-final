import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { env } from "@shared/lib/env";
import { useAppDispatch } from "@hooks/reduxHooks";
import { setTokens, setUser } from "@store/slices/authSlice";

/**
 * Multi-tenant staff login — MD Part 12 (`/:slug/login`, e.g. `/hdfc/login`).
 * POSTs to the compat route `POST /:slug/login` mounted at the API root
 * (NOT under /api/v1) and stores the JWT + tenant slug for later calls.
 */
const BRANDING: Record<string, { name: string; color: string }> = {
  hdfc: { name: "HDFC Bank", color: "#004481" },
  bajaj: { name: "Bajaj Finserv", color: "#0033a0" },
  tata: { name: "Tata Capital", color: "#7b1e1e" },
};

const apiRoot = (env.VITE_API_BASE_URL || "").replace(/\/api\/v1\/?$/, "") || "http://localhost:4000";

const SlugLoginPage: React.FC = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const brand = BRANDING[slug.toLowerCase()] ?? { name: slug.toUpperCase(), color: "#1f2937" };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${apiRoot}/${slug}/login`, { email, password });
      const payload = data?.data ?? data;
      const access = payload?.access_token ?? payload?.token;
      const refresh = payload?.refresh_token ?? payload?.refreshToken;
      if (access) localStorage.setItem("accessToken", access);
      if (refresh) localStorage.setItem("refreshToken", refresh);
      localStorage.setItem("tenantSlug", slug);
      if (payload?.user) localStorage.setItem("slugUser", JSON.stringify(payload.user));
      // Unify with the standard session: redux drives RoleProtectedRoute,
      // Navbar badge and the company emblem (same as auth/index.tsx).
      if (access) {
        dispatch(setTokens({ accessToken: access, refreshToken: refresh ?? "" }));
      }
      if (payload?.user) {
        dispatch(setUser({ ...payload.user, tenantSlug: slug }));
      }
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err as Error)?.message ??
        "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "4rem auto", padding: 24, borderTop: `4px solid ${brand.color}` }}>
      <h1 style={{ color: brand.color }}>{brand.name} — Staff Login</h1>
      <p style={{ color: "#6b7280" }}>Sign in to the {slug} workspace.</p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {error && <div style={{ color: "red" }}>{error}</div>}
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        <button disabled={loading} type="submit" style={{ background: brand.color, color: "#fff", padding: 8 }}>
          {loading ? "Signing in…" : "Login"}
        </button>
      </form>
      <p style={{ marginTop: 12 }}>
        <Link to={`/${slug}/customer/login`}>Customer login</Link> · <Link to="/login">Superadmin login</Link>
      </p>
    </div>
  );
};

export default SlugLoginPage;
