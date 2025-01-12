// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const verifyToken = async (token) => {
    try {
      const response = await axios.get('http://localhost:4000/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
    } catch (err) {
      console.error('Token verification failed:', err);
      localStorage.removeItem('token');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Add a function to handle setting user after OKTA login
  const handleOktaLoginSuccess = (userData) => {
    setUser(userData);
    setLoading(false);
  };

  useEffect(() => {
    const handleAuthChange = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        await verifyToken(token);
      } else {
        setLoading(false);
      }
    };

    // Listen for auth changes
    window.addEventListener('okta-auth-status-change', handleAuthChange);
    
    // Initial check
    handleAuthChange();

    return () => {
      window.removeEventListener('okta-auth-status-change', handleAuthChange);
    };
  }, []);

  const value = {
    user,
    setUser, // Add this
    loading,
    error,
    loginWithGithub: () => {
      window.location.href = 'http://localhost:4000/api/auth/github';
    },
    logout: async () => {
      localStorage.removeItem('token');
      setUser(null);
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};