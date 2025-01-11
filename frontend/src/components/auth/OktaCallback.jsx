// frontend/src/components/auth/OktaCallback.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOktaAuth } from '@okta/okta-react';
import axios from 'axios';

const OktaCallback = () => {
  const navigate = useNavigate();
  const { oktaAuth, authState } = useOktaAuth();

  useEffect(() => {
    const handleCallback = async () => {
      if (authState?.isAuthenticated) {
        try {
          const userInfo = await oktaAuth.getUser();
          const response = await axios.post('http://localhost:4000/api/auth/okta/callback', {
            oktaId: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name
          });

          localStorage.setItem('token', response.data.token);
          navigate('/dashboard');
        } catch (error) {
          console.error('Authentication error:', error);
          navigate('/');
        }
      }
    };

    handleCallback();
  }, [authState, oktaAuth, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl">Processing login...</div>
    </div>
  );
};

export default OktaCallback;