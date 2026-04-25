import { useState, useCallback, useEffect } from 'react';
import { transactionRepository } from '@/lib/repos';
import type { Transaction } from '@/types';

export function useTransactions(sessionId: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!sessionId) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    const data = await transactionRepository.getBySession(sessionId);
    setTransactions(data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const createTransaction = useCallback(
    async (data: {
      sessionId: string;
      branchId: string | null;
      type: Transaction['type'];
      subType?: Transaction['subType'];
      amount: number;
      note?: string;
      recipientType?: Transaction['recipientType'];
      recipientName?: string;
    }) => {
      const transaction = await transactionRepository.create(data);
      setTransactions(prev => [transaction, ...prev]);
      return transaction;
    },
    []
  );

  const deleteTransaction = useCallback(async (id: string) => {
    await transactionRepository.softDelete(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const getTotals = useCallback(() => {
    const cashSales = transactions
      .filter(t => t.type === 'sale' && t.subType === 'cash')
      .reduce((sum, t) => sum + t.amount, 0);

    const transferSales = transactions
      .filter(t => t.type === 'sale' && t.subType === 'transfer')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const withdrawals = transactions
      .filter(t => t.type === 'cash_withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      cashSales,
      transferSales,
      totalSales: cashSales + transferSales,
      expenses,
      withdrawals,
    };
  }, [transactions]);

  const getBySession = useCallback(async (sid: string): Promise<Transaction[]> => {
    return transactionRepository.getBySession(sid);
  }, []);

  return {
    transactions,
    loading,
    createTransaction,
    deleteTransaction,
    getTotals,
    getBySession,
    refetch: fetchTransactions,
  };
}
