import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';
import AppShell from './components/layout/AppShell.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import OrgSettingsPage from './pages/organization/OrgSettingsPage.jsx';
import ContractListPage from './pages/contracts/ContractListPage.jsx';
import ContractDetailPage from './pages/contracts/ContractDetailPage.jsx';
import ContractBuilderPage from './pages/contracts/ContractBuilderPage.jsx';
import ApprovalInboxPage from './pages/approvals/ApprovalInboxPage.jsx';
import ObligationsPage from './pages/obligations/ObligationsPage.jsx';
import ComplianceDashboardPage from './pages/compliance/ComplianceDashboardPage.jsx';
import NotificationHistoryPage from './pages/notifications/NotificationHistoryPage.jsx';
import ProfilePage from './pages/profile/ProfilePage.jsx';
import ChatPage from './pages/chat/ChatPage.jsx';
import DashboardPage from './pages/dashboard/DashboardPage.jsx';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
      />
      <Route
        path="/forgot-password"
        element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPasswordPage />}
      />
      <Route
        path="/reset-password"
        element={isAuthenticated ? <Navigate to="/" replace /> : <ResetPasswordPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="home" element={<Navigate to="/" replace />} />
        <Route path="settings" element={<OrgSettingsPage />} />
        <Route path="contracts" element={<ContractListPage />} />
        <Route path="contracts/new" element={<ContractBuilderPage />} />
        <Route path="contracts/:id" element={<ContractDetailPage />} />
        <Route path="approvals" element={<ApprovalInboxPage />} />
        <Route path="compliance" element={<ComplianceDashboardPage />} />
        <Route path="obligations" element={<ObligationsPage />} />
        <Route path="notifications" element={<NotificationHistoryPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
