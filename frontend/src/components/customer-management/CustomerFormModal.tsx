import { RefreshCw, Users } from 'lucide-react';
import type { UseCustomerManagementReturn } from '../../hooks/useCustomerManagement';

export interface CustomerFormModalProps {
  customerManagement: UseCustomerManagementReturn;
}

export function CustomerFormModal({ customerManagement }: CustomerFormModalProps) {
  const {
    isModalOpen,
    setIsModalOpen,
    modalMode,
    name,
    setName,
    phone,
    setPhone,
    email,
    setEmail,
    isSubmitting,
    handleSubmit,
  } = customerManagement;

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
            <Users className="h-4 w-4 text-indigo-600" />
            {modalMode === 'create' ? 'Daftar Pelanggan Baru' : 'Edit Data Pelanggan'}
          </h3>
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="cursor-pointer text-slate-400 hover:text-slate-650 text-xs font-bold"
          >
            Tutup
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Nama Lengkap *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Budi Santoso"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Nomor Telepon / WhatsApp
            </label>
            <input
              type="tel"
              placeholder="Contoh: 0812XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Alamat Email
            </label>
            <input
              type="email"
              placeholder="Contoh: budi@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="cursor-pointer flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer flex-1 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-150 transition-all flex items-center justify-center"
            >
              {isSubmitting ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : modalMode === 'create' ? (
                'Simpan'
              ) : (
                'Perbarui'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
