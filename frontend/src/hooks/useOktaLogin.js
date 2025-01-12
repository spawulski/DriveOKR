// frontend/src/hooks/useOktaLogin.js
import { useOktaAuth } from '@okta/okta-react';

export const useOktaLogin = () => {
  const { oktaAuth } = useOktaAuth();

  const loginWithOkta = async () => {
    try {
      console.log('Starting OKTA login...');
      await oktaAuth.signInWithRedirect();
    } catch (error) {
      console.error('OKTA login error:', error);
      throw error;
    }
  };

  return { loginWithOkta };
};