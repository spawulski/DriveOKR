// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/auth/LoginPage';
import AuthCallback from './components/auth/AuthCallback';
import Dashboard from './components/Dashboard/Dashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  console.log('ProtectedRoute - user:', user);
  console.log('ProtectedRoute - loading:', loading);
  
  // Always show loading state when loading is true
  if (loading === true) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading authentication status...</div>
      </div>
    );
  }

  // Check for valid token in localStorage even if no user
  const token = localStorage.getItem('token');
  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Add PublicRoute to prevent authenticated users from accessing login
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  if (user || token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default App;