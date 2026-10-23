// backend/src/config/oauth.js
// OAuth URLs are derived only from server configuration, never from the request.

const trustedOrigin = (name, value, fallback) => {
  const raw = value || fallback;
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`${name} must be an absolute http(s) URL`);
  }
  const bare = url.pathname.replace(/\/+$/, '') === '' && !url.search && !url.hash && !url.username && !url.password;
  if (!['http:', 'https:'].includes(url.protocol) || !bare) {
    throw new Error(`${name} must be an http(s) origin without path, query or credentials`);
  }
  return url.origin;
};

// docker-compose.yml ships `your_google_client_*` placeholders; treat them as unset.
const configured = value => Boolean(value) && !/^your_/.test(value);

const loadAuthConfig = (env = process.env) => {
  const frontendUrl = trustedOrigin('FRONTEND_URL', env.FRONTEND_URL, 'http://localhost:3000');
  const backendUrl = trustedOrigin('BACKEND_URL', env.BACKEND_URL, 'http://localhost:4000');
  return {
    frontendUrl,
    backendUrl,
    jwtSecret: env.JWT_SECRET,
    github: {
      clientID: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      callbackURL: `${backendUrl}/api/auth/github/callback`,
    },
    google: {
      enabled: configured(env.GOOGLE_CLIENT_ID) && configured(env.GOOGLE_CLIENT_SECRET),
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${backendUrl}/api/auth/google/callback`,
    },
  };
};

module.exports = { loadAuthConfig };
