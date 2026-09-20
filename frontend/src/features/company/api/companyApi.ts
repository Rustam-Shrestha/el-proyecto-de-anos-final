import { apiClient } from "@shared/lib/apiClient";

export const companyApi = {
  listPublic: (search?: string) => apiClient.get("/company/tenants", { params: search ? { search } : {} }).then(r => r.data.data),
  request: (payload: any) => apiClient.post("/company/requests", payload).then(r => r.data.data),
  myRequests: () => apiClient.get("/company/requests/my").then(r => r.data.data),
  allRequests: (status?: string) => apiClient.get("/company/requests", { params: status ? { status } : {} }).then(r => r.data.data),
  approve: (id: string) => apiClient.post(`/company/requests/${id}/approve`).then(r => r.data.data),
  reject: (id: string, reason: string) => apiClient.post(`/company/requests/${id}/reject`, { reason }).then(r => r.data.data),
  join: (tenantId: number) => apiClient.post("/company/join", { tenantId }).then(r => r.data.data),
  invite: (email: string, role?: string) => apiClient.post("/company/invites", { email, role }).then(r => r.data.data),
  acceptInvite: (token: string) => apiClient.post("/company/invites/accept", { token }).then(r => r.data.data),
  meTenant: () => apiClient.get("/company/me").then(r => r.data.data),
};
