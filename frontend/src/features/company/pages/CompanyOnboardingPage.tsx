import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@shared/lib/apiClient";
import { companyApi } from "@features/company/api/companyApi";
import { Button } from "@shared/components/Button";
import { useAuth } from "@store/hooks";

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export default function CompanyOnboardingPage() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"choice" | "create" | "join">("choice");
  const [tenants, setTenants] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [createForm, setCreateForm] = useState({ companyName: "", slug: "", panNumber: "", companyType: "PRIVATE", address: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [myReqs, setMyReqs] = useState<any[]>([]);
  const tenantId = (userData as any)?.tenantId;

  useEffect(() => {
    if (tenantId && tenantId !== 1) {
      // already has company, go dashboard
      // navigate("/dashboard");
    }
    companyApi.myRequests().then(setMyReqs).catch(()=>{});
  }, [tenantId]);

  useEffect(() => {
    if (mode !== "join") return;
    const t = setTimeout(() => {
      companyApi.listPublic(search).then(d => {
        const uniq = Array.from(new Map(d.map((x:any)=>[x.id,x])).values());
        setTenants(uniq);
      }).catch(()=> setTenants([]));
    }, 300);
    return () => clearTimeout(t);
  }, [mode, search]);
  const [joiningId, setJoiningId] = useState<number|null>(null);

  const handleCreate = async () => {
    setError(null);
    if (!PAN_REGEX.test(createForm.panNumber.toUpperCase())) { setError("Invalid PAN format. Expected ABCDE1234F"); return; }
    try {
      await companyApi.request({ ...createForm, panNumber: createForm.panNumber.toUpperCase() });
      setSuccess("Company request submitted. Admin will review (PAN verification). You'll be notified on approval.");
      setMode("choice");
      const reqs = await companyApi.myRequests();
      setMyReqs(reqs);
    } catch (e: any) { setError(e.response?.data?.message || e.message); }
  };

  const handleJoin = async (id: number) => {
    setError(null); setJoiningId(id);
    try {
      const res: any = await companyApi.join(id);
      if (res?.accessToken) {
        localStorage.setItem("accessToken", res.accessToken);
        localStorage.setItem("refreshToken", res.refreshToken);
        if (res.user) localStorage.setItem("user", JSON.stringify(res.user));
        localStorage.setItem("userData", JSON.stringify(res.user));
      }
      setSuccess(`Joined ${res.tenant?.name || "company"}! Company emblem active. Redirecting...`);
      setTimeout(()=> window.location.href = "/dashboard", 800);
    } catch (e: any) { setError(e.response?.data?.message || e.message); }
    finally{ setJoiningId(null); }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Company Setup</h1>
      <p className="mt-1 text-sm text-gray-500">PAN card is mandatory. You must create or join a company before accessing FinGuard. Only reviewer/admin of a company can manage members.</p>
      {myReqs.length > 0 && (
        <div className="mt-4 rounded border bg-amber-50 p-3 text-sm">
          <p className="font-semibold">Your requests:</p>
          {myReqs.map(r => (
            <div key={r.id} className="flex justify-between border-t py-1 text-xs">
              <span>{r.companyName} ({r.slug}) PAN:{r.panNumber}</span>
              <span className={r.status==="PENDING" ? "text-amber-600" : r.status==="APPROVED" ? "text-green-600" : "text-red-600"}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
      {error && <div className="mt-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</div>}
      {success && <div className="mt-3 rounded bg-green-50 p-2 text-sm text-green-600">{success}</div>}

      {mode === "choice" && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border p-5">
            <h3 className="font-semibold">Create Company</h3>
            <p className="mt-1 text-xs text-gray-500">Requires PAN verification. Admin approval needed.</p>
            <Button className="mt-4 w-full" onClick={()=> setMode("create")}>Create with PAN</Button>
          </div>
          <div className="rounded-xl border p-5">
            <h3 className="font-semibold">Join Existing Company</h3>
            <p className="mt-1 text-xs text-gray-500">Search public list or use email invite link.</p>
            <Button variant="secondary" className="mt-4 w-full" onClick={()=> setMode("join")}>Browse Companies</Button>
          </div>
        </div>
      )}

      {mode === "create" && (
        <div className="mt-6 rounded-xl border bg-white p-5">
          <h3 className="font-semibold">Create Company (PAN mandatory)</h3>
          <div className="mt-3 grid gap-3">
            <input placeholder="Company Name" value={createForm.companyName} onChange={e=> setCreateForm({...createForm, companyName:e.target.value})} className="rounded border px-3 py-2 text-sm" />
            <input placeholder="slug (e.g. my-company)" value={createForm.slug} onChange={e=> setCreateForm({...createForm, slug:e.target.value.toLowerCase()})} className="rounded border px-3 py-2 text-sm" />
            <input placeholder="PAN (ABCDE1234F)" value={createForm.panNumber} onChange={e=> setCreateForm({...createForm, panNumber:e.target.value.toUpperCase()})} className="rounded border px-3 py-2 text-sm uppercase" />
            <input placeholder="Address" value={createForm.address} onChange={e=> setCreateForm({...createForm, address:e.target.value})} className="rounded border px-3 py-2 text-sm" />
            <select value={createForm.companyType} onChange={e=> setCreateForm({...createForm, companyType:e.target.value})} className="rounded border px-3 py-2 text-sm">
              <option>PRIVATE</option><option>PUBLIC</option><option>LLP</option><option>OTHER</option>
            </select>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleCreate}>Submit for Approval</Button>
            <Button variant="ghost" onClick={()=> setMode("choice")}>Back</Button>
          </div>
        </div>
      )}

      {mode === "join" && (
        <div className="mt-6 rounded-xl border bg-white p-5">
          <h3 className="font-semibold">Join Company</h3>
          <input placeholder="Search companies..." value={search} onChange={e=> setSearch(e.target.value)} className="mt-3 w-full rounded border px-3 py-2 text-sm" />
          <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
            {tenants.map(t => (
              <div key={t.id} className="flex items-center justify-between rounded border p-3">
                <div className="flex items-center gap-2">
                  <img src={t.logoUrl || "/images/logo512.png"} alt={t.name} className="h-8 w-8 rounded object-cover border" />
                  <div><p className="text-sm font-medium">{t.name}</p><p className="text-xs text-gray-500">{t.slug} • {t.companyType}</p></div>
                </div>
                <Button size="sm" disabled={joiningId===t.id} onClick={()=> handleJoin(t.id)}>{joiningId===t.id ? "Joining..." : "Join"}</Button>
              </div>
            ))}
            {tenants.length===0 && <p className="text-sm text-gray-500">No companies found. Try email invite.</p>}
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-500">Have an invite link? Paste token here:</p>
            <InviteBox />
          </div>
          <Button variant="ghost" className="mt-3" onClick={()=> setMode("choice")}>Back</Button>
        </div>
      )}
    </div>
  );
}

function InviteBox(){
  const [token, setToken] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const handle = async ()=>{
    try {
      const res:any = await companyApi.acceptInvite(token.trim());
      if (res?.accessToken){ localStorage.setItem("accessToken", res.accessToken); localStorage.setItem("refreshToken", res.refreshToken); if(res.user) localStorage.setItem("userData", JSON.stringify(res.user)); }
      setMsg("Joined via invite! Reloading..."); setTimeout(()=> window.location.href="/dashboard", 1000);
    } catch(e:any){ setMsg(e.response?.data?.message || e.message); }
  };
  return (
    <div className="mt-2 flex gap-2">
      <input value={token} onChange={e=> setToken(e.target.value)} placeholder="Invite token" className="flex-1 rounded border px-3 py-2 text-sm" />
      <Button size="sm" onClick={handle}>Accept Invite</Button>
      {msg && <span className="text-xs">{msg}</span>}
    </div>
  );
}
