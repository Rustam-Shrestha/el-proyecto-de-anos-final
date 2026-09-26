import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { env } from "@shared/lib/env";

/**
 * Multi-tenant customer login — MD Part 12 (`/:slug/customer/login`).
 * Phone + OTP (MVP: any 6-digit OTP accepted, see backend slugCompatRoutes).
 */
const apiRoot = (env.VITE_API_BASE_URL || "").replace(/\/api\/v1\/?$/, "") || "http://localhost:4000";

const SlugCustomerLoginPage: React.FC = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${apiRoot}/${slug}/customer/login`, { phone, otp });
      const payload = data?.data ?? data;
      const access = payload?.access_token ?? payload?.token;
      if (access) localStorage.setItem("accessToken", access);
      localStorage.setItem("tenantSlug", slug);
      if (payload?.user) localStorage.setItem("slugUser", JSON.stringify(payload.user));
      navigate(`/${slug}/apply`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err as Error)?.message ??
        "Customer login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "4rem auto", padding: 24 }}>
      <h1>{slug.toUpperCase()} — Customer Login</h1>
      <p style={{ color: "#6b7280" }}>Enter your phone number and the 6-digit OTP.</p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {error && <div style={{ color: "red" }}>{error}</div>}
        <label>Phone</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+919876543210" autoComplete="tel" />
        <label>OTP</label>
        <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" inputMode="numeric" />
        <button disabled={loading} type="submit">
          {loading ? "Verifying…" : "Login"}
        </button>
      </form>
      <p style={{ marginTop: 12 }}>
        New here? <Link to={`/${slug}/apply`}>Apply for a loan</Link> · <Link to={`/${slug}/login`}>Staff login</Link>
      </p>
    </div>
  );
};

export default SlugCustomerLoginPage;
