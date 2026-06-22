import { TransactionDetailModal } from './TransactionDetailModal';
import { TransactionPrintLayer } from './TransactionPrintLayer';
import type { UseTransactionHistoryReturn } from '../../hooks/useTransactionHistory';

export interface TransactionModalsProps {
  transactionHistory: UseTransactionHistoryReturn;
  accent?: 'indigo' | 'emerald';
}

export function TransactionModals({ transactionHistory, accent = 'indigo' }: TransactionModalsProps) {
  const {
    selectedTransaction,
    setSelectedTransaction,
    handlePrint,
    handleSendWhatsApp,
    componentRef,
    receiptData,
  } = transactionHistory;

  return (
    <>
      <TransactionPrintLayer componentRef={componentRef} receiptData={receiptData} />
      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onPrint={() => handlePrint()}
        onSendWhatsApp={handleSendWhatsApp}
        accent={accent}
      />
    </>
  );
}
