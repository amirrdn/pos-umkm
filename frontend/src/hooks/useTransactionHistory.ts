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
  openWhatsAppInvoice,
} from '../utils/transactionHistoryHelpers';
import type { TransactionRecord } from '../types/transactionHistory';

const QRIS_POLL_INTERVAL_MS = 3000;

export function useTransactionHistory() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'COMPLETED' | 'PENDING' | 'VOID'>('ALL');
  const [selectedPayment, setSelectedPayment] = useState<'ALL' | 'CASH' | 'QRIS'>('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState<'ALL' | 'TODAY' | 'WEEK'>('ALL');
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null);

  const componentRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  const fetchHistory = useCallback(async () => {
    const isPlatformAdminUser = user && isPlatformAdmin(user.roles);
    if (!isAuthenticated || (!isPlatformAdminUser && !user?.tenantId)) return;

    setLoading(true);
    setError(null);

    try {
      setTransactions(
        await getTransactionHistoryApi({
          search: searchQuery || undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          paymentMethod: selectedPayment !== 'ALL' ? selectedPayment : undefined,
          dateRange: selectedDateRange !== 'ALL' ? selectedDateRange : undefined,
        })
      );
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : 'Terjadi kesalahan saat menghubungi server.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, searchQuery, selectedStatus, selectedPayment, selectedDateRange]);

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      await fetchHistory();
    })();
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

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const query = searchQuery.toLowerCase().trim();
      const matchQuery =
        !query ||
        tx.invoiceNumber.toLowerCase().includes(query) ||
        (tx.customer?.name && tx.customer.name.toLowerCase().includes(query));

      if (!matchQuery) return false;

      if (selectedStatus !== 'ALL' && tx.status !== selectedStatus) {
        return false;
      }

      if (selectedPayment !== 'ALL' && tx.paymentMethod !== selectedPayment) {
        return false;
      }

      if (selectedDateRange !== 'ALL') {
        const txDate = new Date(tx.createdAt);
        if (selectedDateRange === 'TODAY') {
          if (txDate.toDateString() !== new Date().toDateString()) {
            return false;
          }
        } else if (selectedDateRange === 'WEEK') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          oneWeekAgo.setHours(0, 0, 0, 0);
          if (txDate < oneWeekAgo) {
            return false;
          }
        }
      }

      return true;
    });
  }, [transactions, searchQuery, selectedStatus, selectedPayment, selectedDateRange]);

  const summaryStats = useMemo(() => {
    let totalRevenue = 0;
    let successCount = 0;
    let pendingCount = 0;
    let pendingAmount = 0;
    let voidCount = 0;

    transactions.forEach((tx) => {
      if (tx.status === 'COMPLETED') {
        totalRevenue += Number(tx.grandTotal);
        successCount += 1;
      } else if (tx.status === 'PENDING') {
        pendingCount += 1;
        pendingAmount += Number(tx.grandTotal);
      } else if (tx.status === 'VOID') {
        voidCount += 1;
      }
    });

    return {
      totalRevenue,
      successCount,
      pendingCount,
      pendingAmount,
      voidCount,
    };
  }, [transactions]);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedStatus('ALL');
    setSelectedPayment('ALL');
    setSelectedDateRange('ALL');
  }, []);

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
    selectedTransaction,
    setSelectedTransaction,
    componentRef,
    handlePrint,
    receiptData,
    handleSendWhatsApp,
  };
}

export type UseTransactionHistoryReturn = ReturnType<typeof useTransactionHistory>;
