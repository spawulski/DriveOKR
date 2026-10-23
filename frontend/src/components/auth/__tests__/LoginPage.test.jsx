import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '../LoginPage';
import { AuthProvider } from '../../../contexts/AuthContext';
import { navigateTo } from '../../../utils/navigation';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));
// jsdom cannot perform the full-page redirect to the backend OAuth routes.
vi.mock('../../../utils/navigation', () => ({ navigateTo: vi.fn() }));

// LoginPage is not routed by App; render it directly with the real AuthProvider
// so its handlers exercise the real context `login`.
describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['Sign in with GitHub', 'http://localhost:4000/api/auth/github'],
    ['Sign in with Google', 'http://localhost:4000/api/auth/google'],
  ])('"%s" starts that provider\'s backend OAuth flow', async (name, url) => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('button', { name }));
    expect(navigateTo).toHaveBeenCalledTimes(1);
    expect(navigateTo).toHaveBeenCalledWith(url);
  });
});
