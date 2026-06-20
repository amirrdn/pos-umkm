import { TransactionSearchBar } from './TransactionSearchBar';
import { TransactionListPanel } from './TransactionListPanel';
import type { UseTransactionHistoryReturn } from '../../hooks/useTransactionHistory';

export interface TransactionContentProps {
  transactionHistory: UseTransactionHistoryReturn;
}

export function TransactionContent({ transactionHistory }: TransactionContentProps) {
  const {
    loading,
    error,
    searchQuery,
    setSearchQuery,
    fetchHistory,
    filteredTransactions,
    setSelectedTransaction,
  } = transactionHistory;

  return (
    <main className="flex-1 overflow-hidden p-6 flex flex-col gap-6 bg-slate-50 dark:bg-slate-950">
      <TransactionSearchBar
        searchQuery={searchQuery}
        loading={loading}
        onSearchQueryChange={setSearchQuery}
        onRefresh={fetchHistory}
      />

      <TransactionListPanel
        loading={loading}
        error={error}
        transactions={filteredTransactions}
        onRefresh={fetchHistory}
        onSelectTransaction={setSelectedTransaction}
      />
    </main>
  );
}
