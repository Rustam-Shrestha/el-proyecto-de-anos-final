export const ROUTES = {
  HOME: '/',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT: '/auth/forgot-password',
    RESET: (token = ':token') => `/auth/reset-password/${token}`,
    VERIFY: (token = ':token') => `/auth/verify-email/${token}`,
    CHANGE_PASSWORD: '/auth/change-password',
  },
  DASHBOARD: '/dashboard',
  PROFILE: {
    VIEW: '/profile',
    EDIT: '/profile/edit',
    CHANGE_PASSWORD: '/profile/change-password',
  },
  KYC: {
    STATUS: '/kyc',
    SUBMIT: '/kyc/submit',
    LIST: '/admin/kyc',
    DETAIL: (id = ':id') => `/admin/kyc/${id}`,
  },
  DOCUMENTS: {
    LIST: '/documents',
    DETAIL: (id = ':id') => `/documents/${id}`,
    ADMIN: '/admin/documents',
  },
  CHAT: {
    INDEX: '/chat',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    USER_DETAIL: (id = ':id') => `/admin/users/${id}`,
    AUDIT: '/admin/audit',
  },
};

export default ROUTES;
