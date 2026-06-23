import { useState, useEffect, useCallback } from 'react';
import { googleLoginApi } from '../api/authApi';
import { isApiError } from '../api/types';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleConfig) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleConfig {
  client_id: string;
  callback: (response: { credential: string }) => void;
  auto_select?: boolean;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function loadGoogleSdk(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        resolve();
      } else {
        reject(new Error('Google SDK gagal dimuat.'));
      }
    };
    script.onerror = () => reject(new Error('Google SDK gagal dimuat.'));
    document.head.appendChild(script);
  });
}

function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleGoogleLogin = useCallback(async () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('GOOGLE_CLIENT_ID belum dikonfigurasi.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await loadGoogleSdk();

      window.google!.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const result = await googleLoginApi({ idToken: response.credential });
            login(result.data.user);
            navigate('/pos');
          } catch (err: unknown) {
            const message = isApiError(err)
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Login Google gagal.';
            setError(message);
          } finally {
            setLoading(false);
          }
        },
      });

      window.google!.accounts.id.prompt();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login Google gagal.';
      setError(message);
      setLoading(false);
    }
  }, [login, navigate]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;

    loadGoogleSdk()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        // SDK gagal dimuat, user tetap bisa pakai email/password
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { handleGoogleLogin, loading, error, ready: ready || !GOOGLE_CLIENT_ID };
}

export function GoogleAuthButton({ mode = 'login' }: { mode?: 'login' | 'register' }) {
  const { handleGoogleLogin, loading, error, ready } = useGoogleAuth();

  if (!ready) return null;

  return (
    <div>
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="cursor-pointer w-full py-3.5 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {loading
          ? 'Menghubungkan...'
          : mode === 'login'
            ? 'Masuk dengan Google'
            : 'Daftar dengan Google'}
      </button>
      {error && (
        <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 text-center">{error}</p>
      )}
    </div>
  );
}
