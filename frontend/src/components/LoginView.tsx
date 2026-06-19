import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { API_BASE_URL } from '../config';
import { Lock, Mail, RefreshCw, ShoppingBag, AlertCircle, Sun, Moon, Clock3 } from 'lucide-react';

type LoginErrorCode =
  | 'EMAIL_NOT_VERIFIED'
  | 'APPROVAL_PENDING'
  | 'ACCOUNT_REJECTED'
  | 'ACCOUNT_DISABLED'
  | 'INVALID_CREDENTIALS';

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
      setResendMsg('Isi email terlebih dahulu.');
      return;
    }
    setResendLoading(true);
    setResendMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengirim ulang email.');
      setResendMsg(data.message || 'Email verifikasi telah dikirim ulang.');
    } catch (err: any) {
      setResendMsg(err.message || 'Gagal mengirim ulang email verifikasi.');
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
      setErrorMsg('Email dan password wajib diisi.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const code = data.code as LoginErrorCode | undefined;
        if (code) setErrorCode(code);
        throw new Error(data.message || 'Gagal masuk sistem. Periksa kembali email dan password Anda.');
      }

      login(data.data.token, data.data.user);

      navigate('/pos');

    } catch (err: any) {
      console.error('Login Error:', err);
      setErrorMsg(err.message || 'Koneksi ke server gagal. Pastikan backend aktif.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-sans overflow-hidden transition-colors duration-150 relative">

      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          type="button"
          className="cursor-pointer p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-355 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 transition-all duration-150 active:scale-95 shadow-sm"
          title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
        >
          {theme === 'light' ? (
            <Moon className="h-4.5 w-4.5 text-slate-600" />
          ) : (
            <Sun className="h-4.5 w-4.5 text-amber-400" />
          )}
        </button>
      </div>

      {/* Background Decorator Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-100/40 dark:bg-indigo-950/10 blur-3xl z-0 transition-colors duration-150"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-100/40 dark:bg-emerald-950/10 blur-3xl z-0 transition-colors duration-150"></div>

      {/* LOGIN CARD */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl dark:shadow-2xl p-8 relative z-10 mx-4 transition-colors duration-150">

        {/* LOGO & TITLE */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-3.5 rounded-2xl text-white shadow-lg shadow-indigo-200 dark:shadow-none mb-4">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight transition-colors duration-150">Selamat Datang</h1>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1.5 font-medium transition-colors duration-150">Sistem POS & Kasir Pintar</p>
        </div>

        {/* ERROR / INFO ALERTS */}
        {errorCode === 'EMAIL_NOT_VERIFIED' && errorMsg && (
          <div className="bg-amber-50 dark:bg-amber-950/15 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 mb-6">
            <div className="flex gap-3 text-amber-900 dark:text-amber-200">
              <Mail className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="space-y-2 text-xs leading-relaxed">
                <p className="font-black text-sm">Email belum diverifikasi</p>
                <p className="font-medium opacity-90">{errorMsg}</p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="cursor-pointer inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
                  {resendLoading ? 'Mengirim ulang...' : 'Kirim ulang email verifikasi'}
                </button>
              </div>
            </div>
          </div>
        )}

        {errorCode === 'APPROVAL_PENDING' && errorMsg && (
          <div className="bg-sky-50 dark:bg-sky-950/15 border border-sky-200 dark:border-sky-800/40 rounded-2xl p-4 mb-6">
            <div className="flex gap-3 text-sky-900 dark:text-sky-200">
              <Clock3 className="h-5 w-5 shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
              <div className="space-y-1 text-xs leading-relaxed">
                <p className="font-black text-sm">Menunggu persetujuan admin</p>
                <p className="font-medium opacity-90">{errorMsg}</p>
              </div>
            </div>
          </div>
        )}

        {errorMsg && errorCode !== 'EMAIL_NOT_VERIFIED' && errorCode !== 'APPROVAL_PENDING' && (
          <div className="bg-rose-50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/30 rounded-2xl p-4 flex gap-3 text-rose-800 dark:text-rose-300 text-xs font-semibold mb-6 transition-colors duration-150">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <div className="leading-relaxed space-y-1">
              {errorCode === 'INVALID_CREDENTIALS' && (
                <p className="font-black text-sm text-rose-900 dark:text-rose-200">Login gagal</p>
              )}
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {resendMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl p-4 text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-6">
            {resendMsg}
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Input Email */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide transition-colors duration-150">Alamat Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-550" />
              <input
                type="email"
                placeholder="operator@toko.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600"
                required
              />
            </div>
          </div>

          {/* Input Password */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide transition-colors duration-150">Kata Sandi</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-550" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600"
                required
              />
            </div>
          </div>

          {/* Tombol Login */}
          <button
            type="submit"
            disabled={loading}
            className={`cursor-pointer w-full py-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-indigo-950/30 transition-all ${loading
                ? 'bg-indigo-400 cursor-wait shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-99'
              } mt-6 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Memverifikasi...
              </>
            ) : (
              'Masuk ke Sistem Kasir'
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
