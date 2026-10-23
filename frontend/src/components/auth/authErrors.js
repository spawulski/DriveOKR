// frontend/src/components/auth/authErrors.js
// Messages for the backend's `auth_error` codes. Only known codes map to text;
// the raw query value is never displayed.
const AUTH_ERROR_MESSAGES = {
  google_cancelled: 'Google sign-in was cancelled.',
  google_unavailable: 'Google sign-in is not available right now. Please use GitHub.',
  google_email_unverified: 'Your Google account needs a verified email address to sign in.',
  google_state_invalid: 'Your sign-in session expired or was invalid. Please try again.',
  google_account_unavailable: 'Google sign-in is temporarily unavailable. Please contact an administrator.',
  google_failed: 'Google sign-in failed. Please try again.',
  github_failed: 'GitHub sign-in failed. Please try again.',
};

export const authErrorMessage = (code) =>
  Object.hasOwn(AUTH_ERROR_MESSAGES, code) ? AUTH_ERROR_MESSAGES[code] : 'Sign-in failed. Please try again.';
