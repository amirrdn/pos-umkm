import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi, resendVerificationApi, type LoginErrorCode } from '../api/authApi';
import { isApiError } from '../api/types';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { Lock, Mail, RefreshCw, ShoppingBag, AlertCircle, Sun, Moon, Clock3 } from 'lucide-react';
import { GoogleAuthButton } from './GoogleAuthButton';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { theme, toggleTheme } = useThemeStore();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<LoginErrorCode | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  const handleResendVerification = async () => {
    if (!email) {
      setResendMsg('Ketik email kamu dulu ya di kolom bawah.');
      return;
    }
    setResendLoading(true);
    setResendMsg(null);
    try {
      const data = await resendVerificationApi(email);
      setResendMsg(data.message || 'Sip, email konfirmasi sudah dikirim ulang!');
    } catch (err: unknown) {
      setResendMsg(err instanceof Error ? err.message : 'Duh, gagal ngirim ulang email. Coba lagi nanti ya.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setErrorCode(null);
    setResendMsg(null);

    if (!email || !password) {
      setErrorMsg('Ups, email dan password harus diisi ya.');
      setLoading(false);
      return;
    }

    try {
      const data = await loginApi({ email, password });
      login(data.data.token, data.data.user);
      navigate('/pos');
    } catch (err: unknown) {
      console.error('Login Error:', err);
      if (isApiError(err) && err.code) {
        setErrorCode(err.code as LoginErrorCode);
      }
      setErrorMsg(err instanceof Error ? err.message : 'Gagal nyambung ke sistem. Coba lagi sebentar ya.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          type="button"
          className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition-colors"
          title={theme === 'light' ? 'Ganti Mode Gelap' : 'Ganti Mode Terang'}
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5 text-slate-600" />
          ) : (
            <Sun className="h-5 w-5 text-amber-400" />
          )}
        </button>
      </div>

      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-6 md:p-8">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-md mb-4">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
            Masuk ke Kasir
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-2">
            Pakai email yang kamu daftarkan ya
          </p>
        </div>

        {errorCode === 'EMAIL_NOT_VERIFIED' && errorMsg && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 mb-6 text-amber-900 dark:text-amber-200">
            <div className="flex gap-3">
              <Mail className="h-6 w-6 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="space-y-2">
                <p className="font-bold text-base">Email belum dikonfirmasi</p>
                <p className="text-sm">{errorMsg}</p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:underline disabled:opacity-60"
                >
                  <RefreshCw className={`h-4 w-4 ${resendLoading ? 'animate-spin' : ''}`} />
                  {resendLoading ? 'Mengirim ulang...' : 'Kirim ulang email konfirmasi'}
                </button>
              </div>
            </div>
          </div>
        )}

        {errorCode === 'APPROVAL_PENDING' && errorMsg && (
          <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/50 rounded-xl p-4 mb-6 text-sky-900 dark:text-sky-200">
            <div className="flex gap-3">
              <Clock3 className="h-6 w-6 shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
              <div>
                <p className="font-bold text-base mb-1">Menunggu Persetujuan</p>
                <p className="text-sm">{errorMsg}</p>
              </div>
            </div>
          </div>
        )}

        {errorMsg && errorCode !== 'EMAIL_NOT_VERIFIED' && errorCode !== 'APPROVAL_PENDING' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4 flex gap-3 text-red-800 dark:text-red-200 mb-6">
            <AlertCircle className="h-6 w-6 text-red-600 shrink-0" />
            <div>
              {errorCode === 'INVALID_CREDENTIALS' && (
                <p className="font-bold text-base mb-1 text-red-900 dark:text-red-100">Ups, Gagal Masuk</p>
              )}
              <p className="text-sm">{errorMsg}</p>
            </div>
          </div>
        )}

        {resendMsg && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-4 text-green-800 dark:text-green-200 text-sm font-medium mb-6">
            {resendMsg}
          </div>
        )}

        <GoogleAuthButton mode="login" />

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
          <span className="text-sm text-slate-500 font-medium">atau pakai email</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="password"
                placeholder="Masukkan password kamu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-60"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-base shadow-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                Masuk...
              </>
            ) : (
              'Masuk ke Kasir'
            )}
          </button>
        </form>

        <div className="mt-8 flex justify-between items-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-6">
          <button
            onClick={() => navigate('/')}
            className="font-bold hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
          >
            ← Beranda
          </button>
          <button
            onClick={() => navigate('/register')}
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Daftar Toko Baru
          </button>
        </div>
      </div>
    </div>
  );
};
