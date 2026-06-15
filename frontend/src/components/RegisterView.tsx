import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, User, Mail, Lock, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function RegisterView() {
  const navigate = useNavigate();

  // Form states
  const [tenantName, setTenantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!tenantName || !ownerName || !email || !password) {
      setError('Seluruh kolom formulir wajib diisi.');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal harus terdiri dari 6 karakter.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenantName,
          ownerName,
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Proses pendaftaran gagal.');
      }

      setSuccess('Pendaftaran berhasil! Akun dan toko Anda telah dibuat. Mengalihkan ke login...');
      
      // Reset form
      setTenantName('');
      setOwnerName('');
      setEmail('');
      setPassword('');

      // Redirect ke login setelah 3 detik
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs dekoratif */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Button Kembali */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Beranda
      </button>

      {/* Card Pendaftaran */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* Header Form */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4">
            <Store className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mb-2">Daftar UMKM POS</h2>
          <p className="text-xs text-slate-400">Buat sistem kasir mandiri toko Anda dalam hitungan detik</p>
        </div>

        {/* State Notifikasi */}
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Formulir */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nama Toko */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama Toko (UMKM)</label>
            <div className="relative">
              <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Contoh: Toko Berkah Sejahtera"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                disabled={loading || !!success}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-slate-900 transition-all text-white placeholder-slate-600 disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Nama Pemilik */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama Lengkap Pemilik</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                disabled={loading || !!success}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-slate-900 transition-all text-white placeholder-slate-600 disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Alamat Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="pemilik@toko.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || !!success}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-slate-900 transition-all text-white placeholder-slate-600 disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kata Sandi Akun</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || !!success}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-slate-900 transition-all text-white placeholder-slate-600 disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Button Submit */}
          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-55 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Memproses Pendaftaran...' : 'Daftarkan Toko Saya'}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-400 mt-6 pt-6 border-t border-slate-800/60">
          Sudah memiliki akun toko?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
          >
            Masuk Kasir
          </button>
        </p>
      </div>
    </div>
  );
}
