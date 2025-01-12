// frontend/src/components/auth/OktaLoginCallback.jsx
import { useEffect } from 'react';
import { LoginCallback } from '@okta/okta-react';
import { useOktaAuth } from '@okta/okta-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const OktaLoginCallback = () => {
  const { oktaAuth, authState } = useOktaAuth();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const handleAuthentication = async () => {
      if (authState?.isAuthenticated) {
        try {
          const userInfo = await oktaAuth.getUser();
          console.log('OKTA user info:', userInfo);
    
          const response = await axios({
            method: 'post',
            url: 'http://localhost:4000/api/auth/okta/callback',
            data: {
              oktaId: userInfo.sub,
              email: userInfo.email,
              name: userInfo.name || userInfo.preferred_username
            },
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            withCredentials: true
          });
    
          console.log('Backend response:', response.data);
    
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            setUser(response.data.user);
            navigate('/dashboard');
          } else {
            throw new Error('No token received from backend');
          }
        } catch (error) {
          console.error('Full error object:', error);
          console.error('Authentication error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            config: error.config
          });
          
          navigate('/?error=auth_failed');
        }
      }
    };

    handleAuthentication();
  }, [authState, oktaAuth, navigate, setUser]);

  return (
    <LoginCallback 
      loadingElement={
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center">
            <div className="text-xl mb-4">Processing OKTA login...</div>
            <div className="text-sm text-gray-600">
              Completing authentication and setting up your account...
            </div>
          </div>
        </div>
      }
    />
  );
};

export default OktaLoginCallback;