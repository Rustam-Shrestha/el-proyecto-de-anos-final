import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { env } from "@shared/lib/env";

/**
 * Customer loan application — MD Part 12 (`/:slug/apply`).
 * Collects the PAN number + loan fields and POSTs to `/:slug/apply`
 * with the stored Bearer token. Requires completed KYC (backend gates
 * on an APPROVED KycApplication for the caller's tenant).
 */
const apiRoot = (env.VITE_API_BASE_URL || "").replace(/\/api\/v1\/?$/, "") || "http://localhost:4000";
// PAN is collected as typed (any reasonable format: 5-15 letters/digits).
const PAN_RE = /^[A-Z0-9]{5,15}$/;

const CustomerApplyPage: React.FC = () => {
  const { slug = "" } = useParams<{ slug: string }>();

  const [pan, setPan] = useState("");
  const [amount, setAmount] = useState("200000");
  const [tenure, setTenure] = useState("36");
  const [purpose, setPurpose] = useState("PERSONAL");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ id?: number; status?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    const panClean = pan.toUpperCase().replace(/[\s-]+/g, "");
    if (!PAN_RE.test(panClean)) {
      setError("Enter a valid PAN (5–15 letters/digits, any format).");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const { data } = await axios.post(
        `${apiRoot}/${slug}/apply`,
        {
          pan_number: pan.toUpperCase().replace(/[\s-]+/g, ""),
          amount_requested: Number(amount),
          tenure_months: Number(tenure),
          purpose,
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      );
      const payload = data?.data ?? data;
      setResult({ id: payload?.id ?? payload?.application?.id, status: payload?.status ?? payload?.application?.status });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err as Error)?.message ??
        "Application failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "3rem auto", padding: 24 }}>
      <h1>Apply for a Loan — {slug.toUpperCase()}</h1>
      {result ? (
        <div style={{ border: "1px solid #16a34a", padding: 16 }}>
          <h3 style={{ color: "#16a34a" }}>Application submitted</h3>
          <p>Application ID: {result.id}</p>
          <p>Status: {result.status}</p>
          <p>
            <Link to="/dashboard/portfolio">View portfolio</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {error && <div style={{ color: "red" }}>{error}</div>}
          <label>PAN Number</label>
          <input value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} placeholder="AAAPK5055K" maxLength={10} />
          <label>Amount Requested</label>
          <input type="number" min={1000} value={amount} onChange={(e) => setAmount(e.target.value)} />
          <label>Tenure (months)</label>
          <input type="number" min={1} max={360} value={tenure} onChange={(e) => setTenure(e.target.value)} />
          <label>Purpose</label>
          <select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
            <option value="PERSONAL">Personal</option>
            <option value="HOME">Home</option>
            <option value="BUSINESS">Business</option>
            <option value="EDUCATION">Education</option>
            <option value="VEHICLE">Vehicle</option>
          </select>
          <button disabled={loading} type="submit">
            {loading ? "Submitting…" : "Submit Application"}
          </button>
        </form>
      )}
      <p style={{ marginTop: 12 }}>
        <Link to={`/${slug}/customer/login`}>Customer login</Link>
      </p>
    </div>
  );
};

export default CustomerApplyPage;
