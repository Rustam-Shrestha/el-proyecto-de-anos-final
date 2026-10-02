import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { companyApi } from "@features/company/api/companyApi";
import { Button } from "@shared/components/Button";
import { apiErrorMessage } from "@shared/utils/apiError";
import { roleKind, roleLabel } from "@shared/utils/roleUtils";
import { useAuth } from "@store/hooks";

const saveSession = (res: any) => {
  if (res?.accessToken) {
    localStorage.setItem("accessToken", res.accessToken);
    localStorage.setItem("refreshToken", res.refreshToken);
    if (res.user) {
      localStorage.setItem("user", JSON.stringify(res.user));
      localStorage.setItem("userData", JSON.stringify(res.user));
    }
  }
};

const reloadToDashboard = () => setTimeout(() => { window.location.href = "/dashboard"; }, 900);

export default function CompanyOnboardingPage() {
  const { userData } = useAuth();
  const [mode, setMode] = useState<"choice" | "create" | "join">("choice");
  const [tenants, setTenants] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [createForm, setCreateForm] = useState({ companyName: "", slug: "", panNumber: "", companyType: "PRIVATE", address: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [myReqs, setMyReqs] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [codeFor, setCodeFor] = useState<number | null>(null);
  const [code, setCode] = useState("");

  const meTenantQuery = useQuery({ queryKey: ["company", "me"], queryFn: () => companyApi.meTenant(), staleTime: 30 * 1000, retry: false });
  const myTenant = (meTenantQuery.data as any) || null;
  const inCompany = Boolean(myTenant && myTenant.slug && myTenant.slug !== "default");

  useEffect(() => {
    companyApi.myRequests().then(setMyReqs).catch(() => {});
  }, []);

  useEffect(() => {
    if (mode !== "join") return;
    const t = setTimeout(() => {
      companyApi.listPublic(search).then(d => {
        const uniq = Array.from(new Map(d.map((x: any) => [x.id, x])).values());
        setTenants(uniq);
      }).catch(() => setTenants([]));
    }, 300);
    return () => clearTimeout(t);
  }, [mode, search]);

  const handleCreate = async () => {
    setError(null); setSuccess(null);
    const pan = createForm.panNumber.toUpperCase().replace(/[\s-]+/g, "");
    if (!/^[A-Z0-9]{5,15}$/.test(pan)) { setError("Enter a valid PAN (5–15 letters/digits, any format)."); return; }
    try {
      await companyApi.request({ ...createForm, panNumber: pan });
      setSuccess("Company request submitted. The FinGuard team will review it. You'll be notified on approval.");
      setMode("choice");
      companyApi.myRequests().then(setMyReqs).catch(() => {});
    } catch (e) { setError(apiErrorMessage(e, "Could not submit the company request.")); }
  };

  const afterMembership = (res: any, fallbackName: string) => {
    saveSession(res);
    if (res?.alreadyMember) setSuccess(`You are already a member of ${res.tenant?.name || fallbackName}. Session refreshed — redirecting...`);
    else setSuccess(`Joined ${res.tenant?.name || fallbackName}! Redirecting to your workspace...`);
    reloadToDashboard();
  };

  const handleJoin = async (t: any) => {
    setError(null); setSuccess(null); setBusyId(t.id);
    try {
      const res: any = t.joinMode === "open"
        ? await companyApi.join(t.id)
        : await companyApi.requestJoin(t.id);
      if (res?.codeSent) {
        setCodeFor(t.id);
        setSuccess(`Invitation code for ${t.name} was emailed to ${res.email}. Enter it below to join.`);
      } else {
        afterMembership(res, t.name);
      }
    } catch (e) { setError(apiErrorMessage(e, "Could not join this company.")); }
    finally { setBusyId(null); }
  };

  const handleCode = async (tenantId?: number) => {
    setError(null); setSuccess(null);
    if (!/^\d{6}$/.test(code.trim())) { setError("Enter the 6-digit code from your email."); return; }
    try {
      const res: any = await companyApi.acceptCode(code.trim(), tenantId);
      setCode(""); setCodeFor(null);
      afterMembership(res, "company");
    } catch (e) { setError(apiErrorMessage(e, "That code did not work.")); }
  };

  const handleLeave = async () => {
    setError(null); setSuccess(null);
    if (!window.confirm(`Leave ${myTenant.name}? You will return to Company Setup.`)) return;
    try {
      const res: any = await companyApi.leave();
      saveSession(res);
      setSuccess(`Left ${myTenant.name}. Reloading...`);
      setTimeout(() => window.location.reload(), 900);
    } catch (e) { setError(apiErrorMessage(e, "Could not leave the company.")); }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Company Setup</h1>
      <p className="mt-1 text-sm text-gray-500">
        Signed in as <span className="font-medium text-gray-700">{(userData as any)?.email}</span>
        {" "}(<span className="font-medium text-gray-700">{roleLabel((userData as any)?.role)}</span>).
        Join a company to access FinGuard.
      </p>

      {inCompany && (
        <div className="mt-4 rounded-xl border bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={myTenant.logoUrl || "/images/logo512.png"} alt={myTenant.name} className="h-10 w-10 rounded object-cover border bg-white" />
              <div>
                <p className="font-semibold text-green-900">{myTenant.name}</p>
                <p className="text-xs text-green-700">slug: {myTenant.slug} • you are a member ({roleLabel((userData as any)?.role)})</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleLeave}>Leave</Button>
          </div>
          {(roleKind((userData as any)?.role) === "admin") && <InviteMemberForm />}
        </div>
      )}

      {myReqs.length > 0 && (
        <div className="mt-4 rounded border bg-amber-50 p-3 text-sm">
          <p className="font-semibold">Your company requests:</p>
          {myReqs.map(r => (
            <div key={r.id} className="flex justify-between border-t py-1 text-xs">
              <span>{r.companyName} ({r.slug}) PAN:{r.panNumber}</span>
              <span className={r.status === "PENDING" ? "text-amber-600" : r.status === "APPROVED" ? "text-green-600" : "text-red-600"}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
      {error && <div className="mt-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</div>}
      {success && <div className="mt-3 rounded bg-green-50 p-2 text-sm text-green-600">{success}</div>}

      {!inCompany && mode === "choice" && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border p-5">
            <h3 className="font-semibold">Create Company</h3>
            <p className="mt-1 text-xs text-gray-500">PAN required (any format). Needs FinGuard team approval.</p>
            <Button className="mt-4 w-full" onClick={() => setMode("create")}>Create with PAN</Button>
          </div>
          <div className="rounded-xl border p-5">
            <h3 className="font-semibold">Join Existing Company</h3>
            <p className="mt-1 text-xs text-gray-500">Open companies join instantly; private ones email you a code.</p>
            <Button variant="secondary" className="mt-4 w-full" onClick={() => setMode("join")}>Browse Companies</Button>
          </div>
        </div>
      )}

      {!inCompany && mode === "create" && (
        <div className="mt-6 rounded-xl border bg-white p-5">
          <h3 className="font-semibold">Create Company (PAN required, any format)</h3>
          <div className="mt-3 grid gap-3">
            <input placeholder="Company Name" value={createForm.companyName} onChange={e => setCreateForm({ ...createForm, companyName: e.target.value })} className="rounded border px-3 py-2 text-sm" />
            <input placeholder="slug (e.g. my-company)" value={createForm.slug} onChange={e => setCreateForm({ ...createForm, slug: e.target.value.toLowerCase() })} className="rounded border px-3 py-2 text-sm" />
            <input placeholder="PAN (any format, e.g. ABCDE1234F)" value={createForm.panNumber} onChange={e => setCreateForm({ ...createForm, panNumber: e.target.value.toUpperCase() })} className="rounded border px-3 py-2 text-sm uppercase" />
            <input placeholder="Address" value={createForm.address} onChange={e => setCreateForm({ ...createForm, address: e.target.value })} className="rounded border px-3 py-2 text-sm" />
            <select value={createForm.companyType} onChange={e => setCreateForm({ ...createForm, companyType: e.target.value })} className="rounded border px-3 py-2 text-sm">
              <option>PRIVATE</option><option>PUBLIC</option><option>LLP</option><option>OTHER</option>
            </select>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleCreate}>Submit for Approval</Button>
            <Button variant="ghost" onClick={() => setMode("choice")}>Back</Button>
          </div>
        </div>
      )}

      {!inCompany && mode === "join" && (
        <div className="mt-6 rounded-xl border bg-white p-5">
          <h3 className="font-semibold">Join Company</h3>
          <input placeholder="Search companies..." value={search} onChange={e => setSearch(e.target.value)} className="mt-3 w-full rounded border px-3 py-2 text-sm" />
          <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
            {tenants.map(t => (
              <div key={t.id} className="rounded border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={t.logoUrl || "/images/logo512.png"} alt={t.name} className="h-8 w-8 rounded object-cover border" />
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.slug} • {t.companyType} • {t.joinMode === "open" ? "Open join" : "Invitation code"}</p>
                    </div>
                  </div>
                  <Button size="sm" disabled={busyId === t.id} onClick={() => handleJoin(t)}>
                    {busyId === t.id ? "Working..." : t.joinMode === "open" ? "Join" : "Email me code"}
                  </Button>
                </div>
                {codeFor === t.id && (
                  <div className="mt-2 flex gap-2">
                    <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code from email" className="flex-1 rounded border px-3 py-2 text-sm tracking-widest" inputMode="numeric" />
                    <Button size="sm" onClick={() => handleCode(t.id)}>Join with code</Button>
                  </div>
                )}
              </div>
            ))}
            {tenants.length === 0 && <p className="text-sm text-gray-500">No companies found. Try an invite code below.</p>}
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-500">Have an invite link or code? Enter it here:</p>
            <InviteBox />
          </div>
          <Button variant="ghost" className="mt-3" onClick={() => setMode("choice")}>Back</Button>
        </div>
      )}
    </div>
  );
}

function InviteMemberForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("USER");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    setMsg(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setMsg("Enter a valid email address."); return; }
    setBusy(true);
    try {
      await companyApi.invite(email.trim(), role);
      setMsg(`Invitation code emailed to ${email.trim()} (from rustamshrestha619@gmail.com).`);
      setEmail("");
    } catch (e) { setMsg(apiErrorMessage(e, "Could not send the invite.")); }
    finally { setBusy(false); }
  };
  return (
    <div className="mt-3 rounded-lg border bg-white p-3">
      <p className="text-sm font-semibold">Invite member by email</p>
      <p className="text-xs text-gray-500">They get a 6-digit invitation code for this company by email.</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="member@email.com" className="flex-1 rounded border px-3 py-2 text-sm" />
        <select value={role} onChange={e => setRole(e.target.value)} className="rounded border px-3 py-2 text-sm">
          <option value="USER">Customer</option>
          <option value="REVIEWER">Reviewer</option>
          <option value="ADMIN">Company Admin</option>
        </select>
        <Button size="sm" disabled={busy} onClick={handle}>{busy ? "Sending..." : "Send invite"}</Button>
      </div>
      {msg && <p className="mt-2 text-xs text-gray-700">{msg}</p>}
    </div>
  );
}

function InviteBox() {
  const [token, setToken] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const handle = async () => {
    const v = token.trim();
    if (!v) { setMsg("Paste an invite link/token or 6-digit code."); return; }
    try {
      let inviteToken = v;
      const m = v.match(/[?&]token=([^&]+)/);
      if (m) inviteToken = decodeURIComponent(m[1]);
      const res: any = /^\d{6}$/.test(v)
        ? await companyApi.acceptCode(v)
        : await companyApi.acceptInvite(inviteToken);
      saveSession(res);
      setMsg("Joined! Reloading...");
      setTimeout(() => { window.location.href = "/dashboard"; }, 1000);
    } catch (e) { setMsg(apiErrorMessage(e, "That invite did not work.")); }
  };
  return (
    <div className="mt-2 flex gap-2">
      <input value={token} onChange={e => setToken(e.target.value)} placeholder="Invite link, token, or 6-digit code" className="flex-1 rounded border px-3 py-2 text-sm" />
      <Button size="sm" onClick={handle}>Accept Invite</Button>
      {msg && <span className="text-xs">{msg}</span>}
    </div>
  );
}
