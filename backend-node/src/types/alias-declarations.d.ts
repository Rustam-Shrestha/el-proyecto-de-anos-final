// Explicit module declarations for commonly used path-alias imports
// These make the editor/tsserver accept named imports from '@/...'

declare module '@/config/database' {
  export const prisma: any;
}

declare module '@/config/logger' {
  export const logger: any;
}

declare module '@/utils/apiResponse' {
  export const apiResponse: any;
}

declare module '@/utils/AppError' {
  export class AppError extends Error {
    constructor(message?: string, statusCode?: number, details?: any);
  }
}

declare module '@/services/authService' {
  export const authService: any;
}

declare module '@/services/tokenService' {
  export const tokenService: any;
}

declare module '@/services/auditService' {
  export const auditService: any;
}

declare module '@/services/mailService' {
  export const mailService: any;
}

declare module '@/middleware/auth' {
  export const authenticate: any;
}

declare module '@/middleware/requestValidation' {
  export const validate: any;
}

declare module '@/middleware/rbac' {
  export const authorize: any;
}

declare module '@/routes/authSchemas' {
  export const registerSchema: any;
  export const loginSchema: any;
  export const verifyEmailSchema: any;
  export const forgotPasswordSchema: any;
  export const resetPasswordSchema: any;
  export const changePasswordSchema: any;
  export const refreshTokenSchema: any;
}

declare module '@/controllers/authController' {
  export const register: any;
  export const login: any;
  export const logout: any;
  export const refreshAccessToken: any;
  export const verifyEmail: any;
  export const forgotPassword: any;
  export const resetPassword: any;
  export const changePassword: any;
}

declare module '@/routes/kycSchemas' {
  export const submitKycSchema: any;
  export const getKycStatusSchema: any;
  export const listKycApplicationsSchema: any;
  export const getKycByIdSchema: any;
  export const approveKycSchema: any;
  export const rejectKycSchema: any;
  export const requestResubmitSchema: any;
}

declare module '@/controllers/kycController' {
  export const submitKyc: any;
  export const getKycStatus: any;
  export const listKycApplications: any;
  export const getKycById: any;
  export const approveKyc: any;
  export const rejectKyc: any;
  export const requestResubmit: any;
  export const requestKycResubmit: any;
}

declare module '@/middleware/upload' {
  export const uploadMiddleware: any;
}

declare module '@/middleware/avatarUpload' {
  export const avatarUpload: any;
}

declare module '@/routes/documentSchemas' {
  export const uploadDocumentSchema: any;
  export const getDocumentSchema: any;
  export const getDocumentVersionsSchema: any;
  export const deleteDocumentSchema: any;
  export const replaceDocumentSchema: any;
}

declare module '@/controllers/documentController' {
  export const uploadDocument: any;
  export const getDocument: any;
  export const getDocumentVersions: any;
  export const deleteDocument: any;
  export const replaceDocument: any;
}

declare module '@/controllers/userController' {
  export const getMe: any;
  export const updateMe: any;
  export const uploadAvatar: any;
  export const deleteAvatar: any;
  export const listUsers: any;
  export const getUser: any;
  export const changeUserRole: any;
  export const deleteUser: any;
}
