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

          // Send user info to your backend
          const response = await axios.post('http://localhost:4000/api/auth/okta/callback', {
            oktaId: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name || userInfo.preferred_username
          });

          console.log('Backend response:', response.data);

          // Store the token and update user state
          localStorage.setItem('token', response.data.token);
          setUser(response.data.user);

          // Navigate to dashboard
          navigate('/dashboard');
        } catch (error) {
          console.error('Authentication error:', error);
          navigate('/');
        }
      }
    };

    handleAuthentication();
  }, [authState, oktaAuth, navigate, setUser]);

  return (
    <LoginCallback 
      loadingElement={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl">Processing OKTA login...</div>
        </div>
      }
    />
  );
};

export default OktaLoginCallback;