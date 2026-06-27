import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface PosHelpModalProps {
  onClose: () => void;
}

interface ShortcutItem {
  key: string;
  description: string;
}

export const PosHelpModal: React.FC<PosHelpModalProps> = ({ onClose }) => {
  const shortcuts: ShortcutItem[] = [
    { key: '/', description: 'Fokus ke Kolom Pencarian' },
    { key: 'F2', description: 'Buka Keranjang Belanja (Mobile/Tablet)' },
    { key: 'F9', description: 'Selesaikan Pembayaran (Bayar Sekarang)' },
    { key: 'Escape', description: 'Tutup Keranjang Belanja' },
    { key: '+ / =', description: 'Tambah Jumlah Item Terakhir di Keranjang' },
    { key: '-', description: 'Kurangi Jumlah Item Terakhir di Keranjang' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
      >
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900">
          <h3 id="help-title" className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-indigo-500" />
            Pintasan Keyboard Kasir
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Tutup bantuan"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="overflow-hidden border border-slate-150 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-150 dark:border-slate-800">
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-1/3">Tombol</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Fungsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {shortcuts.map((shortcut) => (
                  <tr key={shortcut.key} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                    <td className="px-4 py-3">
                      <kbd className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-black bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg shadow-xs leading-none">
                        {shortcut.key}
                      </kbd>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {shortcut.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400 text-center">
            Pintasan di atas mempercepat operasional kasir tanpa memerlukan mouse.
          </p>
        </div>
      </div>
    </div>
  );
};
