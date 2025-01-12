// frontend/src/config/okta.js
const oktaConfig = {
  issuer: import.meta.env.VITE_OKTA_ISSUER,
  clientId: import.meta.env.VITE_OKTA_CLIENT_ID,
  redirectUri: `${import.meta.env.VITE_OKTA_BASE_URL}/login/callback`,
  scopes: ['openid', 'profile', 'email'],
  pkce: true,
  responseType: ['code'],
  tokenManager: {
    storage: 'localStorage',
    autoRenew: true
  },
  restoreOriginalUri: async (oktaAuth, originalUri) => {
    window.location.href = originalUri || '/dashboard';
  },
  postLogoutRedirectUri: `${import.meta.env.VITE_OKTA_BASE_URL}`,
  devMode: process.env.NODE_ENV !== 'production' // Enable additional logging
};

// Add debug logging
console.log('OKTA Config:', {
  issuer: oktaConfig.issuer,
  redirectUri: oktaConfig.redirectUri,
  responseType: oktaConfig.responseType,
  scopes: oktaConfig.scopes
});

export default oktaConfig;