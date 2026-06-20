import React from 'react';
import { Users, RefreshCw } from 'lucide-react';

interface PosAddCustomerModalProps {
  setShowAddCustomerModal: (val: boolean) => void;
  newCustName: string;
  setNewCustName: (val: string) => void;
  newCustPhone: string;
  setNewCustPhone: (val: string) => void;
  newCustEmail: string;
  setNewCustEmail: (val: string) => void;
  handleCreateCustomerSubmit: (name: string, phone: string, email: string) => Promise<boolean>;
  isCreatingCustomer: boolean;
}

export const PosAddCustomerModal: React.FC<PosAddCustomerModalProps> = ({
  setShowAddCustomerModal,
  newCustName,
  setNewCustName,
  newCustPhone,
  setNewCustPhone,
  newCustEmail,
  setNewCustEmail,
  handleCreateCustomerSubmit,
  isCreatingCustomer,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <Users className="h-4 w-4 text-indigo-600" />
            Daftar Pelanggan Baru
          </h3>
          <button
            type="button"
            onClick={() => {
              setShowAddCustomerModal(false);
              setNewCustName('');
              setNewCustPhone('');
              setNewCustEmail('');
            }}
            className="cursor-pointer text-slate-400 hover:text-slate-650 text-xs font-bold"
          >
            Tutup
          </button>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const success = await handleCreateCustomerSubmit(newCustName, newCustPhone, newCustEmail);
            if (success) {
              setNewCustName('');
              setNewCustPhone('');
              setNewCustEmail('');
            }
          }}
          className="mt-4 space-y-4"
        >
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Nama Lengkap *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Budi Santoso"
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Nomor Telepon (WhatsApp)</label>
            <input
              type="tel"
              placeholder="Contoh: 0812XXXXXXXX"
              value={newCustPhone}
              onChange={(e) => setNewCustPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Alamat Email</label>
            <input
              type="email"
              placeholder="Contoh: budi@gmail.com"
              value={newCustEmail}
              onChange={(e) => setNewCustEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowAddCustomerModal(false);
                setNewCustName('');
                setNewCustPhone('');
                setNewCustEmail('');
              }}
              className="cursor-pointer flex-1 py-2.5 border border-slate-200 text-xs font-bold text-slate-500 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isCreatingCustomer}
              className="cursor-pointer flex-1 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-150 transition-all flex items-center justify-center"
            >
              {isCreatingCustomer ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Daftarkan & Tautkan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
