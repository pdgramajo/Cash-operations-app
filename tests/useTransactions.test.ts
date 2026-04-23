import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTransactions } from '@/hooks/useTransactions';
import { transactionRepository } from '@/lib/repos';
import type { Transaction } from '@/types';

vi.mock('@/lib/repos', () => ({
  transactionRepository: {
    getBySession: vi.fn(),
    create: vi.fn(),
    softDelete: vi.fn(),
  },
}));

const mockTransactions: Transaction[] = [
  {
    id: '1',
    sessionId: 'session-1',
    branchId: 'branch-1',
    type: 'sale',
    subType: 'cash',
    amount: 100,
    note: null,
    createdAt: new Date(),
    isDeleted: false,
  },
  {
    id: '2',
    sessionId: 'session-1',
    branchId: 'branch-1',
    type: 'sale',
    subType: 'transfer',
    amount: 200,
    note: null,
    createdAt: new Date(),
    isDeleted: false,
  },
  {
    id: '3',
    sessionId: 'session-1',
    branchId: 'branch-1',
    type: 'expense',
    amount: 50,
    note: 'Test expense',
    createdAt: new Date(),
    isDeleted: false,
  },
  {
    id: '4',
    sessionId: 'session-1',
    branchId: 'branch-1',
    type: 'cash_withdrawal',
    amount: 25,
    note: null,
    createdAt: new Date(),
    isDeleted: false,
  },
];

describe('useTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should start with empty transactions', async () => {
      vi.mocked(transactionRepository.getBySession).mockResolvedValue([]);
      const { result } = renderHook(() => useTransactions('session-1'));

      expect(result.current.transactions).toEqual([]);
    });

    it('should start with loading true', async () => {
      vi.mocked(transactionRepository.getBySession).mockResolvedValue([]);
      const { result } = renderHook(() => useTransactions('session-1'));

      expect(result.current.loading).toBe(true);
    });
  });

  describe('getTotals', () => {
    it('should calculate cash sales correctly', async () => {
      vi.mocked(transactionRepository.getBySession).mockResolvedValue(mockTransactions);
      const { result } = renderHook(() => useTransactions('session-1'));

      await waitFor(() => expect(result.current.loading).toBe(false));

      const totals = result.current.getTotals();
      expect(totals.cashSales).toBe(100);
    });

    it('should calculate transfer sales correctly', async () => {
      vi.mocked(transactionRepository.getBySession).mockResolvedValue(mockTransactions);
      const { result } = renderHook(() => useTransactions('session-1'));

      await waitFor(() => expect(result.current.loading).toBe(false));

      const totals = result.current.getTotals();
      expect(totals.transferSales).toBe(200);
    });

    it('should calculate total sales as cash + transfer', async () => {
      vi.mocked(transactionRepository.getBySession).mockResolvedValue(mockTransactions);
      const { result } = renderHook(() => useTransactions('session-1'));

      await waitFor(() => expect(result.current.loading).toBe(false));

      const totals = result.current.getTotals();
      expect(totals.totalSales).toBe(300);
    });

    it('should calculate expenses correctly', async () => {
      vi.mocked(transactionRepository.getBySession).mockResolvedValue(mockTransactions);
      const { result } = renderHook(() => useTransactions('session-1'));

      await waitFor(() => expect(result.current.loading).toBe(false));

      const totals = result.current.getTotals();
      expect(totals.expenses).toBe(50);
    });

    it('should calculate withdrawals correctly', async () => {
      vi.mocked(transactionRepository.getBySession).mockResolvedValue(mockTransactions);
      const { result } = renderHook(() => useTransactions('session-1'));

      await waitFor(() => expect(result.current.loading).toBe(false));

      const totals = result.current.getTotals();
      expect(totals.withdrawals).toBe(25);
    });

    it('should return zero totals for empty transactions', async () => {
      vi.mocked(transactionRepository.getBySession).mockResolvedValue([]);
      const { result } = renderHook(() => useTransactions('session-1'));

      await waitFor(() => expect(result.current.loading).toBe(false));

      const totals = result.current.getTotals();
      expect(totals.cashSales).toBe(0);
      expect(totals.transferSales).toBe(0);
      expect(totals.totalSales).toBe(0);
      expect(totals.expenses).toBe(0);
      expect(totals.withdrawals).toBe(0);
    });

    it('should sum multiple transactions of same type', async () => {
      const multipleSales: Transaction[] = [
        ...mockTransactions,
        {
          id: '5',
          sessionId: 'session-1',
          branchId: 'branch-1',
          type: 'sale',
          subType: 'cash',
          amount: 150,
          note: null,
          createdAt: new Date(),
          isDeleted: false,
        },
        {
          id: '6',
          sessionId: 'session-1',
          branchId: 'branch-1',
          type: 'expense',
          amount: 30,
          note: null,
          createdAt: new Date(),
          isDeleted: false,
        },
      ];

      vi.mocked(transactionRepository.getBySession).mockResolvedValue(multipleSales);
      const { result } = renderHook(() => useTransactions('session-1'));

      await waitFor(() => expect(result.current.loading).toBe(false));

      const totals = result.current.getTotals();
      expect(totals.cashSales).toBe(250);
      expect(totals.expenses).toBe(80);
    });
  });

  describe('createTransaction', () => {
    it('should call repository to create transaction', async () => {
      const newTransaction: Transaction = {
        id: 'new-1',
        sessionId: 'session-1',
        branchId: 'branch-1',
        type: 'sale',
        subType: 'cash',
        amount: 150,
        note: null,
        createdAt: new Date(),
        isDeleted: false,
      };
      vi.mocked(transactionRepository.create).mockResolvedValue(newTransaction);
      vi.mocked(transactionRepository.getBySession).mockResolvedValue([]);

      const { result } = renderHook(() => useTransactions('session-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.createTransaction({
          sessionId: 'session-1',
          branchId: 'branch-1',
          type: 'sale',
          subType: 'cash',
          amount: 150,
        });
      });

      expect(transactionRepository.create).toHaveBeenCalledWith({
        sessionId: 'session-1',
        branchId: 'branch-1',
        type: 'sale',
        subType: 'cash',
        amount: 150,
      });
    });
  });

  describe('deleteTransaction', () => {
    it('should call repository to soft delete transaction', async () => {
      vi.mocked(transactionRepository.softDelete).mockResolvedValue(undefined);
      vi.mocked(transactionRepository.getBySession).mockResolvedValue(mockTransactions);

      const { result } = renderHook(() => useTransactions('session-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteTransaction('1');
      });

      expect(transactionRepository.softDelete).toHaveBeenCalledWith('1');
    });
  });
});
