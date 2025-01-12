// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Security } from '@okta/okta-react';
import { OktaAuth } from '@okta/okta-auth-js';
import oktaConfig from './config/okta';
import LandingPage from './components/LandingPage/LandingPage';
import AuthCallback from './components/auth/AuthCallback';
import Dashboard from './components/Dashboard/Dashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginCallback } from '@okta/okta-react';
import OktaLoginCallback from './components/auth/OktaLoginCallback';


const oktaAuth = new OktaAuth(oktaConfig);

// Your existing route protection components
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

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  if (user || token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const restoreOriginalUri = async (_oktaAuth, originalUri) => {
    // Let the callback component handle the redirect
    return;
  };

  return (
    <Router>
      <Security 
        oktaAuth={oktaAuth} 
        restoreOriginalUri={restoreOriginalUri}
      >
        <AuthProvider>
          <Routes>
            <Route 
              path="/" 
              element={
                <PublicRoute>
                  <LandingPage />
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
            {/* Single OKTA callback route using LoginCallback */}
            <Route path="/login/callback" element={<OktaLoginCallback />} />
          </Routes>
        </AuthProvider>
      </Security>
    </Router>
  );
}

export default App;