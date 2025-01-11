// frontend/src/config/okta.js
const oktaConfig = {
  issuer: import.meta.env.VITE_OKTA_ISSUER,
  clientId: import.meta.env.VITE_OKTA_CLIENT_ID,
  redirectUri: `${import.meta.env.VITE_OKTA_BASE_URL}/login/callback`,
  scopes: ['openid', 'profile', 'email'],
  pkce: true
};

export default oktaConfig;