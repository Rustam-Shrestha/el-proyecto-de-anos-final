export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    register: '/auth/register',
    verifyOtp: '/auth/verify-otp',
  },
  loans: {
    create: '/loans',
    getAll: '/loans',
    getById: (id: string | number) => `/loans/${id}`,
    approve: (id: string | number) => `/loans/${id}/approve`,
    reject: (id: string | number) => `/loans/${id}/reject`,
    update: (id: string | number) => `/loans/${id}`,
  },
  kyc: {
    submit: '/kyc/submit',
    getStatus: '/kyc/status',
    uploadDocument: '/kyc/upload-document',
    verifyFace: '/kyc/verify-face',
  },
  users: {
    getAll: '/users',
    getById: (id: string | number) => `/users/${id}`,
    create: '/users',
    updateRole: (id: string | number) => `/users/${id}/role`,
    delete: (id: string | number) => `/users/${id}`,
  },
} as const;

export default API_ENDPOINTS;
