import { useTenantFeatures, useToggleFeature } from '../api/supercontrollerApi';

const LABELS: Record<string, { title: string; desc: string }> = {
  feature_ml_scoring: { title: 'ML Scoring', desc: 'Enable AI risk scoring for loan applications' },
  feature_audit_logs: { title: 'Audit Logs', desc: 'Persist and expose audit trail' },
  feature_api_access: { title: 'API Access', desc: 'Allow tenant API keys and external integrations' },
  feature_custom_workflows: { title: 'Custom Workflows', desc: 'Enable tenant-specific approval workflows' },
};

export function FeatureTogglePanel({ tenantId, tenantName }: { tenantId: number; tenantName: string }) {
  const { data: toggles, isLoading } = useTenantFeatures(tenantId);
  const toggleMut = useToggleFeature();

  return (
    <div className="bg-white rounded-xl border border-[#eceef2] p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800">Feature toggles — {tenantName}</h3>
      <p className="text-xs text-slate-500 mb-4">Supercontroller can enable/disable features per tenant</p>
      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : (
        <div className="space-y-3">
          {(toggles ?? []).map(ft => {
            const meta = LABELS[ft.featureName] ?? { title: ft.featureName, desc: '' };
            return (
              <label key={ft.featureName} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-[#f8fafc] hover:bg-white transition cursor-pointer">
                <div className="pr-4">
                  <p className="text-sm font-semibold text-slate-800">{meta.title}</p>
                  <p className="text-xs text-slate-500">{meta.desc}</p>
                </div>
                <input type="checkbox" className="toggle toggle-success" checked={ft.isEnabled} disabled={toggleMut.isPending} onChange={e => toggleMut.mutate({ tenantId, featureName: ft.featureName, isEnabled: e.target.checked })} />
              </label>
            );
          })}
          {!toggles?.length && <p className="text-xs text-slate-400">No toggles configured</p>}
        </div>
      )}
    </div>
  );
}
