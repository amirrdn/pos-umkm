import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, User, Mail, Lock, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { registerOwnerApi } from '../api/authApi';
import { isApiError } from '../api/types';
import { GoogleAuthButton } from './GoogleAuthButton';

export default function RegisterView() {
  const navigate = useNavigate();

  const [tenantName, setTenantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!tenantName || !ownerName || !email || !password) {
      setError('Ups, masih ada kotak yang kosong nih. Diisi dulu ya!');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal harus 6 karakter biar aman.');
      return;
    }

    setLoading(true);

    try {
      await registerOwnerApi({ tenantName, ownerName, email, password });
      setSuccess(`Berhasil daftar! Kami sudah mengirim link konfirmasi ke ${email}. Tolong dicek ya biar akunnya aktif.`);

      setTimeout(() => {
        navigate('/login');
      }, 8000);
    } catch (err: unknown) {
      console.error(err);
      if (isApiError(err)) {
        if (err.code === 'EMAIL_NOT_VERIFIED_RESENT') {
          setSuccess(err.message || 'Kami sudah mengirim ulang link ke email kamu. Coba dicek lagi ya!');
          return;
        }
        if (err.code === 'REGISTRATION_EMAIL_FAILED') {
          setError(err.message || 'Gagal mengirim email. Pendaftaran dibatalkan, coba lagi nanti ya.');
          return;
        }
      }
      setError(err instanceof Error ? err.message : 'Terjadi masalah di sistem kami. Coba lagi ya.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col items-center justify-center p-4">
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
      >
        <ArrowLeft className="w-5 h-5" />
        Kembali
      </button>

      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-lg mt-16 md:mt-0">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-md mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Daftar Toko Gratis
          </h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
            Isi data di bawah ini untuk langsung mulai jualan.
          </p>
        </div>

        <GoogleAuthButton mode="register" />

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
          <span className="text-sm text-slate-500 font-medium">atau isi manual</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 rounded-xl text-sm flex gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400 rounded-xl text-sm flex gap-3">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nama Toko / Warung
            </label>
            <div className="relative">
              <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Contoh: Warung Berkah"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                disabled={loading || !!success}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nama Anda (Pemilik)
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Nama Lengkap"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                disabled={loading || !!success}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || !!success}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                placeholder="Buat password (minimal 6 karakter)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || !!success}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-60"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full py-4 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-base shadow-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          Sudah punya akun?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            Masuk di sini
          </button>
        </p>
      </div>
    </div>
  );
}
