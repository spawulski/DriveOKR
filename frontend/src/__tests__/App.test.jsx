import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import App from '../App';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));
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
