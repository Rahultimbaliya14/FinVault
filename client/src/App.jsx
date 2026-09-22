import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import CreditCards from './pages/CreditCards';
import Commitments from './pages/Commitments';
import Lending from './pages/Lending';
import Dues from './pages/Dues';
import Reports from './pages/Reports';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/Admindashboard';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import { getAdminToken } from './api/adminClient';

const AdminRootRoute = () => {
  return getAdminToken() ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/admin/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounts"
            element={
              <ProtectedRoute>
                <Accounts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cards"
            element={
              <ProtectedRoute>
                <CreditCards />
              </ProtectedRoute>
            }
          />
          <Route
            path="/commitments"
            element={
              <ProtectedRoute>
                <Commitments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lending"
            element={
              <ProtectedRoute>
                <Lending />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dues"
            element={
              <ProtectedRoute>
                <Dues />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />

          {/* Admin Portal - completely separate from the customer app.
              No sidebar link anywhere; reachable only by typing the URL
              directly, and guarded by its own token/route guard. */}
          <Route path="/admin" element={<AdminRootRoute />} />
          <Route
            path="/admin/login"
            element={
              getAdminToken() ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />

          {/* Any unknown route redirects to the dashboard (which itself
              redirects to /login if the user isn't authenticated) */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;