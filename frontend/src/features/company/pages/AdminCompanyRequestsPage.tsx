import { useEffect, useState } from "react";
import { companyApi } from "@features/company/api/companyApi";
import { Button } from "@shared/components/Button";

export default function AdminCompanyRequestsPage(){
  const [reqs,setReqs]=useState<any[]>([]);
  const [filter,setFilter]=useState("PENDING");
  const [reason,setReason]=useState<Record<string,string>>({});
  const load=()=> companyApi.allRequests(filter).then(setReqs).catch(()=> setReqs([]));
  useEffect(()=>{ load(); },[filter]);
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-semibold">Company Verification Queue (PAN mandatory)</h1>
      <div className="flex gap-2">
        {["PENDING","APPROVED","REJECTED"].map(s=>(
          <Button key={s} variant={filter===s ? "primary" : "secondary"} size="sm" onClick={()=> setFilter(s)}>{s}</Button>
        ))}
        <Button size="sm" variant="ghost" onClick={load}>Refresh</Button>
      </div>
      <div className="grid gap-3">
        {reqs.map(r=>(
          <div key={r.id} className="rounded border bg-white p-4">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{r.companyName} <span className="text-xs text-gray-500">({r.slug})</span></p>
                <p className="text-xs">PAN: <span className="font-mono font-semibold">{r.panNumber}</span> • Type: {r.companyType} • By: {r.requestedBy}</p>
                <p className="text-xs text-gray-500">{r.address}</p>
              </div>
              <span className={`h-fit rounded px-2 py-1 text-xs ${r.status==="PENDING"?"bg-amber-100 text-amber-700":r.status==="APPROVED"?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>{r.status}</span>
            </div>
            {r.status==="PENDING" && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={async()=>{ await companyApi.approve(r.id); load(); }}>Approve (verify PAN)</Button>
                <input placeholder="Rejection reason" value={reason[r.id]||""} onChange={e=> setReason({...reason,[r.id]:e.target.value})} className="flex-1 rounded border px-2 py-1 text-sm" />
                <Button size="sm" variant="secondary" onClick={async()=>{ if(!reason[r.id]) return alert("Provide reason"); await companyApi.reject(r.id, reason[r.id]); load(); }}>Reject</Button>
              </div>
            )}
          </div>
        ))}
        {reqs.length===0 && <p className="text-sm text-gray-500">No requests.</p>}
      </div>
    </div>
  );
}
