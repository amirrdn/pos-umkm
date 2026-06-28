import { Edit, RefreshCw, Trash2 } from 'lucide-react';
import type { Customer } from '../../store/useCustomerStore';
import { formatCustomerJoinDate } from '../../utils/customerManagementHelpers';

export interface CustomerListPanelProps {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string, name: string) => void;
}

const getCustomerInitials = (name: string) => {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

export function CustomerListPanel({
  customers,
  loading,
  error,
  onEdit,
  onDelete,
}: CustomerListPanelProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Tampilan Tabel DESKTOP (md ke atas) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <th className="px-6 py-4 w-16 text-center">No</th>
              <th className="px-6 py-4">Nama Pelanggan</th>
              <th className="px-6 py-4">No. Telepon / WhatsApp</th>
              <th className="px-6 py-4">Alamat Email</th>
              <th className="px-6 py-4 text-center">Poin Loyalitas</th>
              <th className="px-6 py-4">Tanggal Bergabung</th>
              <th className="px-6 py-4 w-36 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {loading && customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
                  Memuat data pelanggan...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-rose-500 font-bold">
                  Terjadi kesalahan: {error}
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">
                  Belum ada pelanggan terdaftar di tenant ini.
                </td>
              </tr>
            ) : (
              customers.map((cust, idx) => (
                <tr
                  key={cust.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors font-medium"
                >
                  <td className="px-6 py-4 text-center text-slate-400 dark:text-slate-500 font-bold">
                    {idx + 1}
                  </td>
                  <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-bold">{cust.name}</td>
                  <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400">
                    {cust.phone || '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{cust.email || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 font-black px-2.5 py-1 rounded-lg text-[10px]">
                      {cust.points} Pts
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {formatCustomerJoinDate(cust.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(cust)}
                        className="cursor-pointer p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
                        title="Edit Pelanggan"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(cust.id, cust.name)}
                        className="cursor-pointer p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        title="Hapus Pelanggan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Tampilan Kartu MOBILE (di bawah md) */}
      <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/40">
        {loading && customers.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-bold">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
            Memuat data pelanggan...
          </div>
        ) : error ? (
          <div className="text-center py-12 text-rose-500 font-bold">
            Terjadi kesalahan: {error}
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-bold">
            Belum ada pelanggan terdaftar di tenant ini.
          </div>
        ) : (
          customers.map((cust) => (
            <article
              key={cust.id}
              className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors flex flex-col gap-3 cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                  {getCustomerInitials(cust.name)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{cust.name}</span>
                    </p>
                    <span className="bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 font-black px-2.5 py-1 rounded-lg text-[10px] shrink-0">
                      {cust.points} Pts
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{cust.email || 'Tidak ada email'}</p>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">{cust.phone || 'Tidak ada nomor telepon'}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 w-full">
                <button
                  type="button"
                  onClick={() => onEdit(cust)}
                  className="cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-650 dark:hover:text-indigo-400 active:scale-95 text-xs font-semibold transition-all duration-200"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(cust.id, cust.name)}
                  className="cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 active:scale-95 text-xs font-semibold transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
