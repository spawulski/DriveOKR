// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { navigateTo } from '../utils/navigation';

// Sign-in providers served by the backend at /api/auth/<provider>.
const AUTH_PROVIDERS = ['github', 'google'];

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
  const [loading, setLoading] = useState(true); // Explicitly start as true
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const verifyToken = async () => {
      console.log('AuthProvider - Verifying token');
      const token = localStorage.getItem('token');
      console.log('AuthProvider - Token exists:', !!token);
      
      if (!token) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      try {
        console.log('AuthProvider - Making verify request');
        const response = await axios.get('http://localhost:4000/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('AuthProvider - Verify response:', response.data);
        if (mounted) {
          setUser(response.data.user);
        }
      } catch (err) {
        console.error('AuthProvider - Token verification failed:', err);
        localStorage.removeItem('token');
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    verifyToken();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, []);

  const value = {
    user,
    loading,
    error,
    login: (provider = 'github') => {
      if (!AUTH_PROVIDERS.includes(provider)) {
        throw new Error(`Unknown sign-in provider: ${provider}`);
      }
      navigateTo(`http://localhost:4000/api/auth/${provider}`);
    },
    logout: () => {
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