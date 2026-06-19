import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, User, Mail, Lock, ArrowLeft, AlertTriangle, CheckCircle, Briefcase } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function RegisterView() {
  const navigate = useNavigate();
  const [registerType, setRegisterType] = useState<'owner' | 'staff'>('owner');

  // Form states
  const [tenantName, setTenantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Staff specific states
  const [tenantId, setTenantId] = useState('');
  const [selectedOutlets, setSelectedOutlets] = useState<string[]>([]);
  const [tenantsList, setTenantsList] = useState<{id: string, name: string}[]>([]);
  const [outletsList, setOutletsList] = useState<{id: string, name: string}[]>([]);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (registerType === 'staff') {
      fetchTenants();
    }
  }, [registerType]);

  useEffect(() => {
    if (tenantId) {
      fetchOutlets(tenantId);
    } else {
      setOutletsList([]);
      setSelectedOutlets([]);
    }
  }, [tenantId]);

  const fetchTenants = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/tenants`);
      const data = await res.json();
      if (data.success) setTenantsList(data.data);
    } catch (err) {
      console.error('Failed to fetch tenants', err);
    }
  };

  const fetchOutlets = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/tenants/${id}/outlets`);
      const data = await res.json();
      if (data.success) setOutletsList(data.data);
    } catch (err) {
      console.error('Failed to fetch outlets', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (registerType === 'owner') {
      if (!tenantName || !ownerName || !email || !password) {
        setError('Seluruh kolom formulir wajib diisi.');
        return;
      }
    } else {
      if (!tenantId || !ownerName || !email || !password || selectedOutlets.length === 0) {
        setError('Seluruh kolom formulir wajib diisi dan minimal 1 outlet dipilih.');
        return;
      }
    }

    if (password.length < 6) {
      setError('Password minimal harus terdiri dari 6 karakter.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = registerType === 'owner' ? '/api/auth/register' : '/api/auth/register-staff';
      const payload = registerType === 'owner' 
        ? { tenantName, ownerName, email, password }
        : { tenantId, name: ownerName, email, password, outletIds: selectedOutlets };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Proses pendaftaran gagal.');
      }

      setSuccess(registerType === 'owner' 
        ? 'Pendaftaran berhasil! Akun dan toko Anda telah dibuat. Mengalihkan ke login...'
        : 'Pendaftaran staf berhasil. Menunggu persetujuan Admin! Mengalihkan ke login...');
      
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

  const handleOutletToggle = (id: string) => {
    setSelectedOutlets(prev => 
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <button
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Beranda
      </button>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative z-10">
        
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4">
            <Store className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mb-2">Pendaftaran Akun</h2>
          <p className="text-xs text-slate-400">Silakan pilih jenis pendaftaran Anda</p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
          <button
            onClick={() => { setRegisterType('owner'); setError(null); setSuccess(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${registerType === 'owner' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
          >
            <Store className="w-4 h-4" /> Owner / Toko Baru
          </button>
          <button
            onClick={() => { setRegisterType('staff'); setError(null); setSuccess(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${registerType === 'staff' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
          >
            <Briefcase className="w-4 h-4" /> Staf Outlet
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-2xl text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-2xl text-xs flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {registerType === 'owner' ? (
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white placeholder-slate-600 disabled:opacity-50"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pilih Toko / Tenant</label>
              <div className="relative">
                <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  disabled={loading || !!success}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white disabled:opacity-50 appearance-none"
                  required
                >
                  <option value="" disabled>-- Pilih Toko --</option>
                  {tenantsList.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {registerType === 'staff' && tenantId && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pilih Outlet Penempatan</label>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-32 overflow-y-auto space-y-2">
                {outletsList.length === 0 ? (
                  <p className="text-xs text-slate-500">Belum ada outlet di toko ini.</p>
                ) : (
                  outletsList.map(outlet => (
                    <label key={outlet.id} className="flex items-center gap-3 cursor-pointer">
                      <div className="relative flex items-center">
                        <input 
                          type="checkbox" 
                          checked={selectedOutlets.includes(outlet.id)}
                          onChange={() => handleOutletToggle(outlet.id)}
                          className="peer sr-only"
                          disabled={loading || !!success}
                        />
                        <div className="w-4 h-4 border-2 border-slate-600 rounded bg-slate-900 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-colors"></div>
                        <CheckCircle className="absolute inset-0 w-4 h-4 text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none" />
                      </div>
                      <span className="text-xs text-slate-300 font-medium">{outlet.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama Lengkap</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder={registerType === 'owner' ? "Nama Pemilik" : "Nama Staf"}
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                disabled={loading || !!success}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white placeholder-slate-600 disabled:opacity-50"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Alamat Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || !!success}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white placeholder-slate-600 disabled:opacity-50"
                required
              />
            </div>
          </div>

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
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white placeholder-slate-600 disabled:opacity-50"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            {loading ? 'Memproses Pendaftaran...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6 pt-6 border-t border-slate-800/60">
          Sudah memiliki akun?{' '}
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
