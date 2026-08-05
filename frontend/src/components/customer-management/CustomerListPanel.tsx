import { Edit, RefreshCw, Trash2, Award, Phone, Mail, Calendar, UserX } from 'lucide-react';
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
    <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
      <div className="hidden md:block overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-slate-100/90 dark:bg-slate-800/80 text-[11px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider sticky top-0 z-10 border-b-2 border-slate-200/90 dark:border-slate-700 backdrop-blur-md">
            <tr>
              <th className="py-5 px-6.5 w-16 text-center">No</th>
              <th className="py-5 px-6.5">Nama Pelanggan</th>
              <th className="py-5 px-6.5">No. Telepon / WA</th>
              <th className="py-5 px-6.5">Email</th>
              <th className="py-5 px-6.5 text-center">Poin Loyalitas</th>
              <th className="py-5 px-6.5">Tanggal Bergabung</th>
              <th className="py-5 px-6.5 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-semibold text-slate-800 dark:text-slate-200">
            {loading && customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-14 text-center text-slate-400 font-bold">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600 dark:text-indigo-400" />
                  Memuat data pelanggan...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="py-14 text-center text-rose-600 dark:text-rose-400 font-bold">
                  Terjadi kesalahan: {error}
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-14 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <UserX className="w-8 h-8 opacity-50 text-slate-400" />
                    <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      Belum Ada Pelanggan
                    </span>
                    <span className="text-xs max-w-xs text-slate-500 dark:text-slate-400">
                      Belum ada pelanggan terdaftar atau kriteria pencarian tidak ditemukan.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              customers.map((customer, index) => (
                <tr
                  key={customer.id}
                  className="group hover:bg-indigo-50/60 dark:hover:bg-slate-800/60 transition-colors duration-150 cursor-pointer"
                >
                  <td className="py-5.5 px-6.5 text-center font-bold text-slate-400 dark:text-slate-500 font-mono">
                    {index + 1}
                  </td>

                  <td className="py-5.5 px-6.5 text-slate-900 dark:text-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {getCustomerInitials(customer.name)}
                      </div>
                      <span className="font-extrabold text-slate-900 dark:text-slate-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {customer.name}
                      </span>
                    </div>
                  </td>

                  <td className="py-5.5 px-6.5 text-slate-700 dark:text-slate-300 font-mono font-bold">
                    {customer.phone ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        {customer.phone}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600 italic font-normal">-</span>
                    )}
                  </td>

                  <td className="py-5.5 px-6.5 text-slate-600 dark:text-slate-400 font-medium">
                    {customer.email ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        {customer.email}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600 italic font-normal">-</span>
                    )}
                  </td>

                  <td className="py-5.5 px-6.5 text-center">
                    <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono font-black border border-emerald-300 dark:border-emerald-800 px-3 py-1 rounded-full text-xs shadow-2xs">
                      <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {(customer.points || 0).toLocaleString('id-ID')} Poin
                    </span>
                  </td>

                  <td className="py-5.5 px-6.5 text-slate-600 dark:text-slate-400 font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {formatCustomerJoinDate(customer.createdAt)}
                    </span>
                  </td>

                  <td className="py-5.5 px-6.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(customer)}
                        className="cursor-pointer p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-250 dark:border-slate-700 transition-all active:scale-95 shadow-2xs"
                        title="Edit Data Pelanggan"
                        aria-label={`Edit ${customer.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(customer.id, customer.name)}
                        className="cursor-pointer p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-slate-250 dark:border-slate-700 transition-all active:scale-95 shadow-2xs"
                        title="Hapus Pelanggan"
                        aria-label={`Hapus ${customer.name}`}
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

      <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto">
        {loading && customers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-bold">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Memuat data pelanggan...
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            Belum ada pelanggan terdaftar.
          </div>
        ) : (
          customers.map((customer) => (
            <article
              key={customer.id}
              className="p-4.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  {getCustomerInitials(customer.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {customer.name}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEdit(customer)}
                        className="cursor-pointer p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(customer.id, customer.name)}
                        className="cursor-pointer p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1 text-xs">
                    {customer.phone && (
                      <p className="text-slate-700 dark:text-slate-300 font-mono font-bold flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {customer.phone}
                      </p>
                    )}
                    {customer.email && (
                      <p className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        {customer.email}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono font-black border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 rounded-full text-[11px]">
                      <Award className="w-3 h-3 text-emerald-600" />
                      {(customer.points || 0).toLocaleString('id-ID')} Poin
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatCustomerJoinDate(customer.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
