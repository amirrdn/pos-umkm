import { ArrowRight, ShoppingBag, Wallet, X } from 'lucide-react';

export interface PosOnboardingProps {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}

const STEPS = [
  {
    icon: Wallet,
    title: 'Buka Shift Dulu',
    description: 'Masukkan modal awal kas di laci sebelum melayani pelanggan.',
  },
  {
    icon: ShoppingBag,
    title: 'Pilih Barang',
    description: 'Ketuk produk di katalog atau cari lewat nama/SKU. Gunakan tombol + di kartu untuk tambah cepat.',
  },
  {
    icon: ArrowRight,
    title: 'Bayar & Selesai',
    description: 'Pilih Tunai atau QRIS, lalu tekan Bayar Sekarang. Cetak struk atau kirim ke WhatsApp.',
  },
];

export function PosOnboarding({ step, onNext, onSkip }: PosOnboardingProps) {
  const current = STEPS[step];
  if (!current) return null;

  const Icon = current.icon;
  const isLast = step >= STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 relative">
        <button
          type="button"
          onClick={onSkip}
          className="cursor-pointer absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          aria-label="Lewati panduan"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
            <Icon className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-1">
              Langkah {step + 1} dari {STEPS.length}
            </p>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{current.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{current.description}</p>
          </div>

          <div className="flex justify-center gap-1.5">
            {STEPS.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === step ? 'w-6 bg-indigo-600' : 'w-1.5 bg-slate-300 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onNext}
            className="cursor-pointer w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
          >
            {isLast ? 'Mengerti, Mulai!' : 'Lanjut'}
          </button>
        </div>
      </div>
    </div>
  );
}
