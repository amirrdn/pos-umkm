import { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { usePlatformStore } from '../../store/usePlatformStore';
import { overrideSubscriptionApi } from '../../api/platformBillingApi';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function PlatformOverrideModal({ onClose, onSuccess }: Props) {
  const { tenants, fetchTenants } = usePlatformStore();
  const [tenantId, setTenantId] = useState('');
  const [tier, setTier] = useState<'FREE' | 'GROWTH' | 'ENTERPRISE'>('FREE');
  const [expiresAt, setExpiresAt] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tenants.length === 0) {
      fetchTenants();
    }
  }, [tenants.length, fetchTenants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!tenantId) {
      setError('Pilih tenant terlebih dahulu');
      return;
    }
    if (!note) {
      setError('Alasan override wajib diisi');
      return;
    }

    setLoading(true);
    try {
      await overrideSubscriptionApi(tenantId, {
        tier,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        note,
      });
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal melakukan override');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Override Paket Manual
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 p-3 rounded-lg flex items-start text-sm">
            <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <p>
              Tindakan ini akan melewati siklus billing standar dan dicatat di audit log.
              Gunakan hanya untuk keadaan khusus.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Pilih Tenant
            </label>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">-- Pilih Tenant --</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.slug})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ubah ke Paket
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as 'FREE' | 'GROWTH' | 'ENTERPRISE')}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="FREE">FREE</option>
              <option value="GROWTH">GROWTH</option>
              <option value="ENTERPRISE">ENTERPRISE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tanggal Berakhir Baru (Opsional)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Kosongkan jika ingin sistem menghitung otomatis berdasarkan sisa hari atau tipe paket.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Alasan Override <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Misal: Perpanjangan trial karena downtime"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                'Memproses...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Terapkan Override
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
