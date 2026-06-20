import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { useAuthStore } from '../store/useAuthStore';
import { isPlatformAdmin } from '../utils/roles';
import {
  getTransactionHistoryApi,
  getTransactionStatusApi,
} from '../api/transactionHistoryApi';
import {
  buildReceiptData,
  filterTransactionsByInvoice,
  openWhatsAppInvoice,
} from '../utils/transactionHistoryHelpers';
import type { TransactionRecord } from '../types/transactionHistory';

const QRIS_POLL_INTERVAL_MS = 3000;

export function useTransactionHistory() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null);

  const componentRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  const fetchHistory = useCallback(async () => {
    const isPlatformAdminUser = user && isPlatformAdmin(user.roles);
    if (!token || (!isPlatformAdminUser && !user?.tenantId)) return;

    setLoading(true);
    setError(null);

    try {
      setTransactions(await getTransactionHistoryApi());
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : 'Terjadi kesalahan saat menghubungi server.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      selectedTransaction &&
      selectedTransaction.status === 'PENDING' &&
      selectedTransaction.paymentMethod === 'QRIS'
    ) {
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const statusData = await getTransactionStatusApi(selectedTransaction.invoiceNumber);
          if (statusData?.status && statusData.status !== 'PENDING') {
            setSelectedTransaction((prev) => {
              if (!prev) return null;
              return { ...prev, status: statusData.status };
            });
            fetchHistory();
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
          }
        } catch (err) {
          console.error('Error polling status in history:', err);
        }
      }, QRIS_POLL_INTERVAL_MS);
    } else if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [selectedTransaction, fetchHistory]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const filteredTransactions = useMemo(
    () => filterTransactionsByInvoice(transactions, searchQuery),
    [transactions, searchQuery]
  );

  const receiptData = useMemo(
    () => buildReceiptData(selectedTransaction, user),
    [selectedTransaction, user]
  );

  const handleSendWhatsApp = (transaction: TransactionRecord | null) => {
    if (!transaction) return;
    openWhatsAppInvoice(transaction, user);
  };

  return {
    user,
    handleLogout,
    transactions,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    fetchHistory,
    filteredTransactions,
    selectedTransaction,
    setSelectedTransaction,
    componentRef,
    handlePrint,
    receiptData,
    handleSendWhatsApp,
  };
}

export type UseTransactionHistoryReturn = ReturnType<typeof useTransactionHistory>;
