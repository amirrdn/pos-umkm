import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleAuthButton } from './GoogleAuthButton';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../store/useAuthStore', () => ({
  useAuthStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector({ login: vi.fn() });
    }
    return { login: vi.fn() };
  }),
}));

describe('GoogleAuthButton component', () => {
  beforeEach(() => {
    window.google = {
      accounts: {
        id: {
          initialize: vi.fn(),
          prompt: vi.fn(),
        },
      },
    };
  });

  afterEach(() => {
    window.google = undefined;
  });

  it('renders sign-in text when mode is login', async () => {
    await act(async () => {
      render(<GoogleAuthButton mode="login" />);
    });
    expect(screen.getByText('Masuk dengan Google')).toBeInTheDocument();
  });

  it('renders sign-up text when mode is register', async () => {
    await act(async () => {
      render(<GoogleAuthButton mode="register" />);
    });
    expect(screen.getByText('Daftar dengan Google')).toBeInTheDocument();
  });
});
