import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import ROUTES from "./routePaths";

// Layouts
// import AdminLayout from "../components/layout/AdminLayout";
import UserLayout from "../components/layout/UserLayout";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import RoleBasedRoute from "../components/layout/RoleBasedRoute";

// Auth Pages
import LoginPage from "../pages/auth/LoginPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";

// Admin Pages
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import DocumentsPage from "../pages/admin/DocumentsPage";
import UploadDocumentPage from "../pages/admin/UploadDocumentPage";
import CategoriesPage from "../pages/admin/CategoriesPage";
import UsersPage from "../pages/admin/UsersPage";
import CreateUserPage from "../pages/admin/CreateUserPage";
import ViewUserPage from "../pages/admin/ViewUserPage";
import EditUserPage from "../pages/admin/EditUserPage";
import QASessionsPage from "../pages/admin/QASessionsPage";
import AIValidationPage from "../pages/admin/AIValidationPage";
import DocumentDetailsPage from "../pages/admin/DocumentDetailsPage";
import AILogsPage from "../pages/admin/AILogsPage";
import ProfilePage from "../pages/admin/ProfilePage";
import SettingsPage from "../pages/admin/SettingsPage";

// User Pages
import UserDocumentsPage from "../pages/user/UserDocumentsPage";
import AskDocsPage from "../pages/user/AskDocsPage";
import UserHistoryPage from "../pages/user/UserHistoryPage";
import UserSettingsPage from "../pages/user/UserSettingsPage";

// Common Pages
import NotFoundPage from "../pages/common/NotFoundPage";
import UnauthorizedPage from "../pages/common/UnauthorizedPage";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <Box sx={{ width: '100%', height: '100%' }}>
                <Outlet />
              </Box>
            </RoleBasedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="documents/:id" element={<DocumentDetailsPage />} />
          <Route path="upload" element={<UploadDocumentPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/create" element={<CreateUserPage />} />
          <Route path="users/:id/view" element={<ViewUserPage />} />
          <Route path="users/:id/edit" element={<EditUserPage />} />
          <Route path="history" element={<QASessionsPage />} />
          <Route path="ai-validation" element={<AIValidationPage />} />
          <Route path="logs" element={<AILogsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* User Routes */}
        <Route
          path="/user"
          element={
            <ProtectedRoute>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.USER_DOCUMENTS} replace />} />
          <Route path="documents" element={<UserDocumentsPage />} />
          <Route path="ask" element={<AskDocsPage />} />
          <Route path="history" element={<UserHistoryPage />} />
          <Route path="settings" element={<UserSettingsPage />} />
        </Route>

        {/* Root redirect */}
        <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
