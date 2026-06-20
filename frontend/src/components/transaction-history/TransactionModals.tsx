import { TransactionDetailModal } from './TransactionDetailModal';
import { TransactionPrintLayer } from './TransactionPrintLayer';
import type { UseTransactionHistoryReturn } from '../../hooks/useTransactionHistory';

export interface TransactionModalsProps {
  transactionHistory: UseTransactionHistoryReturn;
}

export function TransactionModals({ transactionHistory }: TransactionModalsProps) {
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
      />
    </>
  );
}
