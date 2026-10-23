// frontend/src/components/auth/AuthCallback.jsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const error = params.get('error');
    
    if (error) {
      console.error('Auth error:', error);
      navigate(`/?auth_error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    if (token) {
      localStorage.setItem('token', token);
      navigate('/dashboard');
    } else {
      console.error('No token received');
      navigate('/?auth_error=no_token', { replace: true });
    }
  }, [navigate, location]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl">Completing authentication...</div>
    </div>
  );
};

export default AuthCallback;