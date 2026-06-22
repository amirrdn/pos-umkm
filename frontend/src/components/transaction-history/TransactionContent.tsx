import { TransactionSearchBar } from './TransactionSearchBar';
import { TransactionListPanel } from './TransactionListPanel';
import { TransactionOverviewStats } from './TransactionOverviewStats';
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
    selectedStatus,
    setSelectedStatus,
    selectedPayment,
    setSelectedPayment,
    selectedDateRange,
    setSelectedDateRange,
    summaryStats,
    resetFilters,
    fetchHistory,
    filteredTransactions,
    setSelectedTransaction,
    handleSendWhatsApp,
  } = transactionHistory;

  return (
    <main className="flex-1 overflow-y-auto md:overflow-hidden p-4 md:p-6 flex flex-col gap-5 bg-slate-50 dark:bg-slate-950">
      {/* Panel Statistik Ringkasan */}
      <TransactionOverviewStats summaryStats={summaryStats} />

      {/* Pencarian dan Penyaringan */}
      <TransactionSearchBar
        searchQuery={searchQuery}
        loading={loading}
        onSearchQueryChange={setSearchQuery}
        onRefresh={fetchHistory}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedPayment={selectedPayment}
        onPaymentChange={setSelectedPayment}
        selectedDateRange={selectedDateRange}
        onDateRangeChange={setSelectedDateRange}
      />

      {/* Daftar Transaksi */}
      <TransactionListPanel
        loading={loading}
        error={error}
        transactions={filteredTransactions}
        onRefresh={fetchHistory}
        onSelectTransaction={setSelectedTransaction}
        onSendWhatsApp={handleSendWhatsApp}
        resetFilters={resetFilters}
        isFiltered={
          searchQuery !== '' ||
          selectedStatus !== 'ALL' ||
          selectedPayment !== 'ALL' ||
          selectedDateRange !== 'ALL'
        }
      />
    </main>
  );
}
