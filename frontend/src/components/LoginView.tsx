import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from '../config';
import { Lock, Mail, RefreshCw, ShoppingBag, AlertCircle } from 'lucide-react';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  // Local State
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handler Submit Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // Validasi dasar client-side
    if (!email || !password) {
      setErrorMsg('Email dan password wajib diisi.');
      setLoading(false);
      return;
    }

    try {
      // Panggil API Login Backend
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal masuk sistem. Periksa kembali email dan password Anda.');
      }

      // Berhasil login: simpan ke Zustand store (localStorage)
      login(data.data.token, data.data.user);

      // Redirect ke halaman utama POS
      navigate('/pos');

    } catch (err: any) {
      console.error('Login Error:', err);
      setErrorMsg(err.message || 'Koneksi ke server gagal. Pastikan backend aktif.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-50 flex items-center justify-center font-sans overflow-hidden">
      
      {/* Background Decorator Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-100/40 blur-3xl z-0"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-100/40 blur-3xl z-0"></div>

      {/* LOGIN CARD */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl p-8 relative z-10 mx-4">
        
        {/* LOGO & TITLE */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-3.5 rounded-2xl text-white shadow-lg shadow-indigo-200 mb-4">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">Selamat Datang</h1>
          <p className="text-slate-400 text-xs mt-1.5 font-medium">Sistem POS Multi-Tenant Antigravity</p>
        </div>

        {/* ERROR MESSAGE ALERT */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-3 text-rose-800 text-xs font-semibold mb-6 animate-pulse">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Input Email */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Alamat Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                placeholder="operator@toko.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
                required
              />
            </div>
          </div>

          {/* Input Password */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Kata Sandi</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
                required
              />
            </div>
          </div>

          {/* Tombol Login */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-150 transition-all ${
              loading 
                ? 'bg-indigo-400 cursor-wait shadow-none' 
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-99'
            } mt-6`}
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

        {/* Dummy Account Helper (Seeder-based) */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 font-medium">Akun Demo Default (Seeder):</p>
          <p className="text-[11px] font-bold text-indigo-500 mt-1">owner@tokoutama.com | password123</p>
        </div>

      </div>
    </div>
  );
};
