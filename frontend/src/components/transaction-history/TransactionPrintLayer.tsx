import type { RefObject } from 'react';
import { ReceiptTemplate } from '../ReceiptTemplate';
import type { ReceiptData } from '../../types/transactionHistory';

export interface TransactionPrintLayerProps {
  componentRef: RefObject<HTMLDivElement | null>;
  receiptData: ReceiptData | null;
}

export function TransactionPrintLayer({ componentRef, receiptData }: TransactionPrintLayerProps) {
  return (
    <div className="hidden print:block">
      <ReceiptTemplate ref={componentRef} transactionData={receiptData} />
    </div>
  );
}
