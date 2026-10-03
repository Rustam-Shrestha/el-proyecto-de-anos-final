import { useEffect, useState } from "react";

export function useTenant(): string | null {
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);

  useEffect(() => {
    const host = window.location.hostname;
    const match = host.match(/^([a-z0-9-]+)\.localhost/);
    if (match) {
      setTenantSlug(match[1]);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const q = params.get("tenant");
    if (q) {
      setTenantSlug(q);
      return;
    }
    // fallback stored preference
    const stored = localStorage.getItem("tenantSlug");
    if (stored) setTenantSlug(stored);
    else setTenantSlug("default");
  }, []);

  return tenantSlug;
}
