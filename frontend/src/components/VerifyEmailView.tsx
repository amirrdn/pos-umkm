import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { verifyEmailApi } from '../api/authApi';

export default function VerifyEmailView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Tautan verifikasi tidak valid. Periksa kembali email Anda.');
      return;
    }

    const verify = async () => {
      try {
        const data = await verifyEmailApi(token);
        setVerifiedEmail(data.data?.email ?? '');
        setStatus('success');
        setMessage(data.message || 'Email berhasil diverifikasi.');
      } catch (err: unknown) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Verifikasi email gagal.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <button
        onClick={() => navigate('/login')}
        className="cursor-pointer absolute top-8 left-8 flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Ke Halaman Login
      </button>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative z-10 text-center">
        <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4">
          <Mail className="w-6 h-6 text-white" />
        </div>

        <h2 className="text-2xl font-black tracking-tight text-white mb-2">Verifikasi Email</h2>

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400">Memverifikasi akun Anda...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-2xl text-xs flex items-start gap-2.5 text-left">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{message}{verifiedEmail ? ` (${verifiedEmail})` : ''}</span>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="cursor-pointer w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all"
            >
              Masuk ke Akun
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="p-4 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-2xl text-xs flex items-start gap-2.5 text-left">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="cursor-pointer w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all"
            >
              Kembali ke Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
