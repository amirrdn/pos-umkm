import { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, ExternalLink, Receipt, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { getMidtransDetailApi } from '../../api/platformBillingApi';
import type { MidtransTransactionDetail } from '../../api/platformBillingApi';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Props {
  invoiceNumber: string;
  onClose: () => void;
}

export function PlatformMidtransDetailModal({ invoiceNumber, onClose }: Props) {
  const [data, setData] = useState<MidtransTransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    Promise.resolve().then(() => {
      setLoading(true);
      setError(null);
    });
    try {
      const result = await getMidtransDetailApi(invoiceNumber);
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil detail dari Midtrans.');
    } finally {
      setLoading(false);
    }
  }, [invoiceNumber]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDetail();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDetail]);

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-violet-500 animate-spin mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Menghubungi Midtrans...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
          <p className="text-rose-600 font-medium mb-2">{error}</p>
          <button
            onClick={fetchDetail}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      );
    }

    if (!data) return null;

    const isSuccess = ['settlement', 'capture'].includes(data.transaction_status);
    const StatusIcon = isSuccess ? CheckCircle : (data.transaction_status === 'pending' ? Clock : AlertCircle);

    return (
      <div className="p-4 space-y-6">
        <div className="flex items-start justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
              Status Midtrans
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-5 h-5 ${isSuccess ? 'text-emerald-500' : (data.transaction_status === 'pending' ? 'text-amber-500' : 'text-rose-500')}`} />
              <span className="font-bold text-slate-800 dark:text-slate-100 capitalize">
                {data.transaction_status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{data.status_message}</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
              Gross Amount
            </div>
            <div className="font-bold text-slate-800 dark:text-slate-100">
              {formatCurrency(data.gross_amount || 0)}
            </div>
            <div className="text-xs text-slate-500 mt-1 uppercase">{data.currency || 'IDR'}</div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-400" />
            Detail Transaksi
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-500 mb-1">Order ID / Invoice</div>
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                {data.order_id || invoiceNumber}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-500 mb-1">Payment Type</div>
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200 uppercase">
                {data.payment_type?.replace('_', ' ') || '-'}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-500 mb-1">Waktu Transaksi</div>
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {data.transaction_time
                  ? format(new Date(data.transaction_time), 'dd MMM yyyy HH:mm', { locale: id })
                  : '-'}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-500 mb-1">Fraud Status</div>
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">
                {data.fraud_status || '-'}
              </div>
            </div>
          </div>
        </div>

        {(data.va_numbers?.length || data.biller_code || data.bank) && (
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-slate-400" />
              Info Pembayaran
            </h4>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 space-y-2">
              {data.va_numbers?.map((va, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 uppercase">{va.bank} VA</span>
                  <span className="text-sm font-mono font-medium text-slate-800 dark:text-slate-200">{va.va_number}</span>
                </div>
              ))}
              {data.biller_code && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Biller Code</span>
                  <span className="text-sm font-mono font-medium text-slate-800 dark:text-slate-200">{data.biller_code}</span>
                </div>
              )}
              {data.bill_key && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Bill Key</span>
                  <span className="text-sm font-mono font-medium text-slate-800 dark:text-slate-200">{data.bill_key}</span>
                </div>
              )}
              {data.bank && !data.va_numbers?.length && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Bank</span>
                  <span className="text-sm font-medium uppercase text-slate-800 dark:text-slate-200">{data.bank}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Detail Pembayaran Midtrans
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {renderContent()}

      </div>
    </div>
  );
}
