// frontend/src/components/auth/AuthCallback.jsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    console.log('AuthCallback mounted');
    console.log('Current location:', location);
    
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    console.log('Received token:', token);
    
    if (token) {
      console.log('Storing token and redirecting to dashboard');
      localStorage.setItem('token', token);
      navigate('/dashboard', { replace: true });
    } else {
      console.log('No token found, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [navigate, location]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl">Completing authentication...</div>
    </div>
  );
};

export default AuthCallback;