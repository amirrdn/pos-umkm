import { useEffect, useState } from 'react';
import { fetchPlatformAuditLogsApi, type PlatformAuditLogEntry } from '../../api/platformAuditApi';
import { usePlatformStore } from '../../store/usePlatformStore';

const ACTION_LABELS: Record<string, string> = {
  IMPERSONATE_START: 'Mulai Inspeksi Tenant',
  IMPERSONATE_END: 'Akhiri Inspeksi Tenant',
  TENANT_SCOPED_WRITE: 'Aksi Tulis pada Tenant',
  TENANT_CREATE: 'Buat Tenant',
  TENANT_UPDATE: 'Perbarui Tenant',
  TENANT_DELETE: 'Hapus Tenant',
  TENANT_SUSPEND: 'Tangguhkan Tenant',
  TENANT_ACTIVATE: 'Aktifkan Tenant',
  TIER_OVERRIDE: 'Override Paket',
};

function formatAction(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function formatMetadata(metadata: PlatformAuditLogEntry['metadata']): string {
  if (!metadata) return '-';
  const entries = Object.entries(metadata);
  if (entries.length === 0) return '-';
  return entries
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join(' · ');
}

export function PlatformAuditView() {
  const activeTenantId = usePlatformStore((state) => state.activeTenantId);
  const [logs, setLogs] = useState<PlatformAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scopeTenantOnly, setScopeTenantOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchPlatformAuditLogsApi({
          page,
          limit: 20,
          tenantId: scopeTenantOnly && activeTenantId ? activeTenantId : undefined,
        });
        if (cancelled) return;
        setLogs(result.items);
        setTotalPages(result.totalPages);
      } catch (err: unknown) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat audit trail.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadLogs();

    return () => {
      cancelled = true;
    };
  }, [page, scopeTenantOnly, activeTenantId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Audit Trail Platform</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Jejak aksi admin platform, inspeksi tenant, dan operasi sensitif.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={scopeTenantOnly}
            onChange={(event) => {
              setScopeTenantOnly(event.target.checked);
              setPage(1);
            }}
            className="rounded border-slate-300 dark:border-slate-600"
          />
          Hanya tenant aktif
        </label>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-950/60 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-bold">Waktu</th>
              <th className="px-4 py-3 font-bold">Aksi</th>
              <th className="px-4 py-3 font-bold">Actor</th>
              <th className="px-4 py-3 font-bold">Tenant</th>
              <th className="px-4 py-3 font-bold">Detail</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  Memuat audit trail...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  Belum ada entri audit trail.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {new Date(log.createdAt).toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                    {formatAction(log.action)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {log.actorUserId}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {log.tenantId ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatMetadata(log.metadata)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold disabled:opacity-50"
        >
          Sebelumnya
        </button>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Halaman {page} dari {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages || loading}
          onClick={() => setPage((current) => current + 1)}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold disabled:opacity-50"
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}
