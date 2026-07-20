import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import AppShell from './components/layout/AppShell.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import OrgSettingsPage from './pages/organization/OrgSettingsPage.jsx';

function DashboardPage() {
  return (
    <div>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 600, color: '#1B2430' }}>
        Welcome to CLM Platform
      </h2>
      <p style={{ color: '#5B6472', marginTop: 8 }}>Select a module from the sidebar to get started.</p>
    </div>
  );
}

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
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="settings" element={<OrgSettingsPage />} />
        <Route path="contracts" element={<DashboardPage />} />
        <Route path="approvals" element={<DashboardPage />} />
        <Route path="compliance" element={<DashboardPage />} />
        <Route path="obligations" element={<DashboardPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
