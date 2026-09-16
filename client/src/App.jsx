import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
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
          {/* Any unknown route redirects to the dashboard (which itself
              redirects to /login if the user isn't authenticated) */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;