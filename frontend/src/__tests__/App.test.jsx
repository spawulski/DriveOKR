import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import App from '../App';
import { navigateTo } from '../utils/navigation';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));
// jsdom cannot perform the full-page redirect to the backend OAuth routes.
vi.mock('../utils/navigation', () => ({ navigateTo: vi.fn() }));
// Exercise the real router, route guards, AuthProvider, landing and callback.
// Dashboard internals make unrelated API requests and are covered separately.
vi.mock('../components/Dashboard/Dashboard', () => ({
  default: () => <h1>Dashboard route</h1>,
}));
vi.mock('../components/admin/AdminDashboard', () => ({
  default: () => <h1>Admin route</h1>,
}));

function visit(path) {
  window.history.replaceState({}, '', path);
  return render(<App />);
}

function authenticate(user = { id: 'routing-user', isAdmin: false }) {
  localStorage.setItem('token', 'routing-test-token');
  axios.get.mockResolvedValue({ data: { user } });
}

describe('App routing with the real auth provider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    vi.restoreAllMocks();
  });

  it('renders the public landing and GitHub login action without verifying a missing token', async () => {
    visit('/');
    expect(await screen.findByRole('heading', { name: 'Drive success with better OKR management' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Get started with GitHub' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Learn more/ })).toHaveAttribute('href', '#features');
    expect(axios.get).not.toHaveBeenCalled();
  });

  it.each([
    ['Get started with GitHub', 'http://localhost:4000/api/auth/github'],
    ['Sign in with Google', 'http://localhost:4000/api/auth/google'],
  ])('"%s" starts that provider\'s backend OAuth flow', async (name, url) => {
    visit('/');
    fireEvent.click(await screen.findByRole('button', { name }));
    expect(navigateTo).toHaveBeenCalledTimes(1);
    expect(navigateTo).toHaveBeenCalledWith(url);
  });

  it.each([
    ['google_cancelled', 'Google sign-in was cancelled.'],
    ['google_unavailable', 'Google sign-in is not available right now. Please use GitHub.'],
    ['google_email_unverified', 'Your Google account needs a verified email address to sign in.'],
    ['google_state_invalid', 'Your sign-in session expired or was invalid. Please try again.'],
    ['google_account_unavailable', 'Google sign-in is temporarily unavailable. Please contact an administrator.'],
    ['google_failed', 'Google sign-in failed. Please try again.'],
    ['github_failed', 'GitHub sign-in failed. Please try again.'],
  ])('shows a sign-in error for %s on the landing page', async (code, message) => {
    visit(`/?auth_error=${code}`);
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument();
  });

  it('shows a generic message and never echoes unknown error values', async () => {
    visit('/?auth_error=%3Cscript%3Eevil%3C%2Fscript%3E');
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Sign-in failed. Please try again.');
    expect(alert).not.toHaveTextContent('evil');
  });

  it('shows no alert on a normal landing visit', async () => {
    visit('/');
    await screen.findByRole('button', { name: 'Sign in with Google' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('returns callback errors to the landing page with a message instead of a missing /login route', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    visit('/auth/callback?error=google_failed');
    expect(await screen.findByRole('alert')).toHaveTextContent('Google sign-in failed. Please try again.');
    expect(window.location.pathname).toBe('/');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('returns a callback without a token to the landing page with a message', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    visit('/auth/callback');
    expect(await screen.findByRole('alert')).toHaveTextContent('Sign-in failed. Please try again.');
    expect(window.location.pathname).toBe('/');
  });

  it.each(['/dashboard', '/admin', '/admin/users'])(
    'redirects anonymous visitors from %s to the landing page',
    async (path) => {
      visit(path);
      expect(await screen.findByRole('button', { name: 'Get started with GitHub' })).toBeInTheDocument();
      expect(window.location.pathname).toBe('/');
      expect(screen.queryByRole('heading', { name: /^(Dashboard|Admin) route$/ })).not.toBeInTheDocument();
    },
  );

  it('redirects signed-in visitors from the landing page to their dashboard', async () => {
    authenticate();
    visit('/');
    expect(await screen.findByRole('heading', { name: 'Dashboard route' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/dashboard');
    expect(axios.get).toHaveBeenCalledWith('http://localhost:4000/api/auth/verify', {
      headers: { Authorization: 'Bearer routing-test-token' },
    });
    expect(screen.queryByRole('button', { name: 'Get started with GitHub' })).not.toBeInTheDocument();
  });

  it('waits for token verification before rendering the protected dashboard', async () => {
    localStorage.setItem('token', 'routing-test-token');
    let resolveVerification;
    axios.get.mockReturnValue(new Promise((resolve) => { resolveVerification = resolve; }));
    visit('/dashboard');
    expect(screen.getByText('Loading authentication status...')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Dashboard route' })).not.toBeInTheDocument();
    resolveVerification({ data: { user: { id: 'routing-user', isAdmin: false } } });
    expect(await screen.findByRole('heading', { name: 'Dashboard route' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/dashboard');
  });

  it('redirects non-admin users away from nested admin routes', async () => {
    authenticate();
    visit('/admin/users');
    expect(await screen.findByRole('heading', { name: 'Dashboard route' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/dashboard');
    expect(screen.queryByRole('heading', { name: 'Admin route' })).not.toBeInTheDocument();
  });

  it('allows verified administrators into nested admin routes', async () => {
    authenticate({ id: 'routing-admin', isAdmin: true });
    visit('/admin/users');
    expect(await screen.findByRole('heading', { name: 'Admin route' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/admin/users');
  });

  it('stores an OAuth callback token and navigates to the protected dashboard', async () => {
    axios.get.mockResolvedValue({ data: { user: { id: 'callback-user', isAdmin: false } } });
    expect(localStorage.getItem('token')).toBeNull();
    visit('/auth/callback?token=callback-test-token');
    expect(await screen.findByRole('heading', { name: 'Dashboard route' })).toBeInTheDocument();
    await waitFor(() => expect(window.location.pathname).toBe('/dashboard'));
    expect(localStorage.getItem('token')).toBe('callback-test-token');
    expect(axios.get).toHaveBeenCalledWith('http://localhost:4000/api/auth/verify', {
      headers: { Authorization: 'Bearer callback-test-token' },
    });
  });

  it('removes an expired token and redirects to the landing page when verification rejects', async () => {
    const verificationError = new Error('Token expired');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('token', 'expired-test-token');
    axios.get.mockRejectedValue(verificationError);
    visit('/dashboard');
    expect(await screen.findByRole('button', { name: 'Get started with GitHub' })).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
    expect(window.location.pathname).toBe('/');
    expect(screen.queryByRole('heading', { name: 'Dashboard route' })).not.toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith('http://localhost:4000/api/auth/verify', {
      headers: { Authorization: 'Bearer expired-test-token' },
    });
    expect(consoleError).toHaveBeenCalledWith('AuthProvider - Token verification failed:', verificationError);
  });
});
