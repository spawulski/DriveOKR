// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import LoginPage from './components/auth/LoginPage';
import LandingPage from './components/LandingPage/LandingPage';
import AuthCallback from './components/auth/AuthCallback';
import Dashboard from './components/Dashboard/Dashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading === true) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading authentication status...</div>
      </div>
    );
  }

  const token = localStorage.getItem('token');
  if (!user && !token) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Add PublicRoute to prevent authenticated users from accessing login
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  if (user || token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <LandingPage />  {/* Change this from LoginPage to LandingPage */}
              </PublicRoute>
            } 
          />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;