import { History } from 'lucide-react';
import { useTransactionHistory } from '../hooks/useTransactionHistory';
import { AppShellHeader } from './AppShellHeader';
import { TransactionContent, TransactionModals } from './transaction-history';

export const TransactionHistory = () => {
  const transactionHistory = useTransactionHistory();

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans overflow-hidden transition-colors duration-150">
      <AppShellHeader
        title="Riwayat Transaksi"
        subtitle="Arsip & detail transaksi penjualan"
        icon={History}
        accent="indigo"
        user={transactionHistory.user}
        onLogout={transactionHistory.handleLogout}
      />

      <TransactionContent transactionHistory={transactionHistory} />
      <TransactionModals transactionHistory={transactionHistory} />
    </div>
  );
};
