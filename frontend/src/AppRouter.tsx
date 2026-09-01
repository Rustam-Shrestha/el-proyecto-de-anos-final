import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/shared/NavBar';
import ROUTES from './config/routes';
import * as Pages from './pages';
import ProtectedRoute from './components/ProtectedRoute';
import UnauthorizedPage from './pages/UnauthorizedPage';

const AppRouter: React.FC = () => (
  <BrowserRouter>
    <NavBar />
    <div style={{ padding: 16 }}>
      <Routes>
        <Route path="/" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />

        <Route path={ROUTES.AUTH.LOGIN} element={<Pages.LoginPage />} />
        <Route path={ROUTES.AUTH.REGISTER} element={<Pages.RegisterPage />} />
        <Route path={ROUTES.AUTH.FORGOT} element={<Pages.ForgotPasswordPage />} />
        <Route path="/auth/reset-password/:token" element={<Pages.ResetPasswordPage />} />
        <Route path="/auth/verify-email/:token" element={<Pages.VerifyEmailPage />} />

        <Route path={ROUTES.DASHBOARD} element={<div>Dashboard (placeholder)</div>} />
        <Route path={ROUTES.CHAT.INDEX} element={<Pages.ChatPage />} />

        <Route path={ROUTES.PROFILE.VIEW} element={<Pages.ProfilePage />} />
        <Route path={ROUTES.PROFILE.EDIT} element={<Pages.EditProfilePage />} />
        <Route path={ROUTES.PROFILE.CHANGE_PASSWORD} element={<Pages.ChangePasswordPage />} />

        <Route path={ROUTES.KYC.STATUS} element={<Pages.KycStatusPage />} />
        <Route path={ROUTES.KYC.SUBMIT} element={<Pages.SubmitKycPage />} />
        <Route path={ROUTES.KYC.LIST} element={<Pages.KycListPage />} />
        <Route path="/admin/kyc/:id" element={<Pages.KycDetailPage />} />

        <Route path={ROUTES.DOCUMENTS.LIST} element={<Pages.DocumentManagementPage />} />
        <Route path="/documents/:id" element={<Pages.DocumentDetailPage />} />
        <Route path={ROUTES.DOCUMENTS.ADMIN} element={<Pages.DocumentStatsPage />} />

        <Route
          path={ROUTES.ADMIN.DASHBOARD}
          element={<ProtectedRoute requiredRoles={["ADMIN"]}><Pages.AdminDashboardPage /></ProtectedRoute>}
        />
        <Route
          path={ROUTES.ADMIN.USERS}
          element={<ProtectedRoute requiredRoles={["ADMIN"]}><Pages.UserListAdminPage /></ProtectedRoute>}
        />
        <Route path="/admin/users/:id" element={<ProtectedRoute requiredRoles={["ADMIN"]}><div>User detail (placeholder)</div></ProtectedRoute>} />
        <Route
          path={ROUTES.ADMIN.AUDIT}
          element={<ProtectedRoute requiredRoles={["ADMIN"]}><Pages.AuditLogsPage /></ProtectedRoute>}
        />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route path="/portfolio/documents/upload" element={<ProtectedRoute><Pages.FinancialDocumentUpload /></ProtectedRoute>} />
        <Route path="/portfolio/documents" element={<ProtectedRoute><Pages.DocumentStatusList /></ProtectedRoute>} />
        <Route
          path="/admin/portfolio/documents"
          element={<ProtectedRoute requiredRoles={["ADMIN", "REVIEWER"]}><Pages.AdminDocumentVerification /></ProtectedRoute>}
        />

        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
    </div>
  </BrowserRouter>
);

export default AppRouter;
