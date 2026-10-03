import { useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, CheckCircle2, Landmark } from "lucide-react";
import { env } from "@shared/lib/env";

/**
 * Customer loan application - `/:slug/apply`.
 *
 * Stage-2 of the two-stage flow: identity is already verified once by the
 * platform, so this form only picks the loan terms. PAN/KYC documents are never
 * re-entered here.
 */
const apiRoot = (env.VITE_API_BASE_URL || "").replace(/\/api\/v1\/?$/, "") || "http://localhost:4000";

const PURPOSES = [
  { value: "PERSONAL", label: "Personal" },
  { value: "HOME", label: "Home" },
  { value: "BUSINESS", label: "Business" },
  { value: "EDUCATION", label: "Education" },
  { value: "VEHICLE", label: "Vehicle" },
];

type ApplyResult = { id: string; status: string; estimatedEmi?: number };

const CustomerApplyPage = () => {
  const { slug = "" } = useParams<{ slug: string }>();

  const [amount, setAmount] = useState("200000");
  const [tenure, setTenure] = useState("36");
  const [purpose, setPurpose] = useState("PERSONAL");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ApplyResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!amount || Number(amount) <= 0) {
      setError("Enter the amount you want to borrow.");
      return;
    }
    if (!tenure || Number(tenure) <= 0) {
      setError("Enter a tenure in months.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const { data } = await axios.post(
        `${apiRoot}/${slug}/apply`,
        {
          amount_requested: Number(amount),
          tenure_months: Number(tenure),
          purpose,
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      );
      const payload = data?.data ?? data;
      setResult({
        id: String(payload?.application_id ?? payload?.id ?? ""),
        status: String(payload?.application_status ?? payload?.status ?? "submitted"),
        estimatedEmi: payload?.estimated_emi,
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message ??
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as Error)?.message ??
        "Application failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D]";

  return (
    <div className="min-h-screen bg-[#f7f9fb] px-4 py-10">
      <div className="mx-auto w-full max-w-lg">
        <Link
          to="/dashboard/lenders"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#15803D]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to lenders
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-1 flex items-center gap-2">
            <Landmark className="h-5 w-5 text-[#15803D]" />
            <h1 className="text-lg font-bold text-slate-800">
              Apply to {slug.toUpperCase()}
            </h1>
          </div>
          <p className="mb-5 text-xs text-slate-500">
            Your identity is already verified, so there are no documents to upload again. Just pick
            your loan terms.
          </p>

          {result ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-semibold">Application submitted</span>
              </div>
              <dl className="mt-3 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <dt>Application ID</dt>
                  <dd className="font-mono">{result.id || "N/A"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Status</dt>
                  <dd className="uppercase">{result.status}</dd>
                </div>
                {result.estimatedEmi ? (
                  <div className="flex justify-between">
                    <dt>Estimated EMI</dt>
                    <dd>{result.estimatedEmi.toLocaleString("en-IN")}</dd>
                  </div>
                ) : null}
              </dl>
              <p className="mt-3 text-xs text-slate-500">
                {slug.toUpperCase()} will review your income and employment details. Track it from
                your dashboard.
              </p>
              <Link
                to="/dashboard/loans/status"
                className="mt-4 inline-block rounded-lg bg-[#15803D] px-4 py-2 text-xs font-medium text-white hover:bg-[#166534]"
              >
                View my loans
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {error}
                </p>
              )}

              <div>
                <label htmlFor="amount" className="mb-1 block text-xs font-medium text-slate-600">
                  Amount requested
                </label>
                <input
                  id="amount"
                  type="number"
                  min={1000}
                  step={1000}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="tenure" className="mb-1 block text-xs font-medium text-slate-600">
                  Tenure (months)
                </label>
                <input
                  id="tenure"
                  type="number"
                  min={1}
                  max={360}
                  value={tenure}
                  onChange={(e) => setTenure(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="purpose" className="mb-1 block text-xs font-medium text-slate-600">
                  Purpose
                </label>
                <select
                  id="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className={inputClass}
                >
                  {PURPOSES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#15803D] py-2.5 text-sm font-medium text-white hover:bg-[#166534] disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit application"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerApplyPage;
