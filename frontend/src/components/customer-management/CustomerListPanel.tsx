import { DollarSign, Edit, RefreshCw, Trash2 } from 'lucide-react';
import type { Customer } from '../../store/useCustomerStore';
import {
  formatCustomerDebt,
  formatCustomerJoinDate,
  getCustomerDebtClass,
  hasCustomerDebt,
} from '../../utils/customerManagementHelpers';

export interface CustomerListPanelProps {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string, name: string) => void;
  onRepay: (customer: Customer) => void;
}

export function CustomerListPanel({
  customers,
  loading,
  error,
  onEdit,
  onDelete,
  onRepay,
}: CustomerListPanelProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <th className="px-6 py-4 w-16 text-center">No</th>
              <th className="px-6 py-4">Nama Pelanggan</th>
              <th className="px-6 py-4">No. Telepon / WhatsApp</th>
              <th className="px-6 py-4">Alamat Email</th>
              <th className="px-6 py-4 text-center">Poin Loyalitas</th>
              <th className="px-6 py-4 text-right">Saldo Hutang</th>
              <th className="px-6 py-4">Tanggal Bergabung</th>
              <th className="px-6 py-4 w-36 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {loading && customers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-bold">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
                  Memuat data pelanggan...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-rose-500 font-bold">
                  Terjadi kesalahan: {error}
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-bold">
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
                    <span className="bg-indigo-50 text-indigo-800 font-black px-2.5 py-1 rounded-lg text-[10px]">
                      {cust.points} Pts
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-extrabold ${getCustomerDebtClass(cust.debtBalance)}`}>
                      {formatCustomerDebt(cust.debtBalance)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {formatCustomerJoinDate(cust.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {hasCustomerDebt(cust.debtBalance) && (
                        <button
                          type="button"
                          onClick={() => onRepay(cust)}
                          className="cursor-pointer px-2.5 py-1 text-[10px] font-extrabold bg-rose-50 hover:bg-rose-105 text-rose-700 hover:text-rose-800 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 dark:text-rose-350 dark:hover:text-rose-200 rounded-lg transition-colors flex items-center gap-1"
                          title="Bayar Cicilan Hutang"
                        >
                          <DollarSign className="h-3 w-3" />
                          Bayar
                        </button>
                      )}
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
    </div>
  );
}
