import { describe, it, expect } from 'vitest';
import type { CashSession, Transaction } from '@/types';

// Test data factory
function createMockSession(overrides: Partial<CashSession> = {}): CashSession {
  return {
    id: 'session-1',
    name: 'Caja Principal',
    branchId: 'branch-1',
    openedAt: new Date(),
    closedAt: null,
    openingBalance: 500,
    closingBalance: null,
    status: 'open',
    notes: null,
    ...overrides,
  };
}

function createMockTransactions(totals: {
  cashSales?: number;
  transferSales?: number;
  expenses?: number;
  withdrawals?: number;
}): Transaction[] {
  const transactions: Transaction[] = [];

  if (totals.cashSales) {
    transactions.push({
      id: 'sale-cash-1',
      sessionId: 'session-1',
      branchId: 'branch-1',
      type: 'sale',
      subType: 'cash',
      amount: totals.cashSales,
      note: null,
      createdAt: new Date(),
      isDeleted: false,
    });
  }

  if (totals.transferSales) {
    transactions.push({
      id: 'sale-transfer-1',
      sessionId: 'session-1',
      branchId: 'branch-1',
      type: 'sale',
      subType: 'transfer',
      amount: totals.transferSales,
      note: null,
      createdAt: new Date(),
      isDeleted: false,
    });
  }

  if (totals.expenses) {
    transactions.push({
      id: 'expense-1',
      sessionId: 'session-1',
      branchId: 'branch-1',
      type: 'expense',
      amount: totals.expenses,
      note: null,
      createdAt: new Date(),
      isDeleted: false,
    });
  }

  if (totals.withdrawals) {
    transactions.push({
      id: 'withdrawal-1',
      sessionId: 'session-1',
      branchId: 'branch-1',
      type: 'cash_withdrawal',
      amount: totals.withdrawals,
      note: null,
      createdAt: new Date(),
      isDeleted: false,
    });
  }

  return transactions;
}

// Pure functions extracted from SessionPage logic for testing
function calculateDineroEnCaja(
  openingBalance: number,
  cashSales: number,
  expenses: number
): number {
  return openingBalance + cashSales - expenses;
}

function calculateEstimatedClosingBalance(
  openingBalance: number,
  cashSales: number,
  expenses: number,
  withdrawals: number
): number {
  return openingBalance + cashSales - expenses - withdrawals;
}

function calculateTotals(transactions: Transaction[]) {
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

  return { cashSales, transferSales, totalSales: cashSales + transferSales, expenses, withdrawals };
}

describe('Session calculations', () => {
  describe('dineroEnCaja', () => {
    it('should calculate dinero en caja as openingBalance + cashSales - expenses', () => {
      const session = createMockSession({ openingBalance: 500 });
      const transactions = createMockTransactions({
        cashSales: 100,
        transferSales: 200,
        expenses: 50,
        withdrawals: 25,
      });

      const totals = calculateTotals(transactions);
      const result = calculateDineroEnCaja(
        session.openingBalance,
        totals.cashSales,
        totals.expenses
      );

      expect(result).toBe(550); // 500 + 100 - 50
    });

    it('should return only openingBalance when no cash sales or expenses', () => {
      const session = createMockSession({ openingBalance: 500 });
      const transactions = createMockTransactions({
        transferSales: 200,
      });

      const totals = calculateTotals(transactions);
      const result = calculateDineroEnCaja(
        session.openingBalance,
        totals.cashSales,
        totals.expenses
      );

      expect(result).toBe(500); // 500 + 0 - 0
    });

    it('should handle multiple expenses', () => {
      const session = createMockSession({ openingBalance: 1000 });
      const transactions = createMockTransactions({
        cashSales: 300,
        expenses: 150,
      });

      const totals = calculateTotals(transactions);
      const result = calculateDineroEnCaja(
        session.openingBalance,
        totals.cashSales,
        totals.expenses
      );

      expect(result).toBe(1150); // 1000 + 300 - 150
    });

    it('should handle zero opening balance', () => {
      const session = createMockSession({ openingBalance: 0 });
      const transactions = createMockTransactions({
        cashSales: 500,
        expenses: 100,
      });

      const totals = calculateTotals(transactions);
      const result = calculateDineroEnCaja(
        session.openingBalance,
        totals.cashSales,
        totals.expenses
      );

      expect(result).toBe(400); // 0 + 500 - 100
    });
  });

  describe('estimatedClosingBalance', () => {
    it('should calculate correctly with all transaction types', () => {
      const session = createMockSession({ openingBalance: 500 });
      const transactions = createMockTransactions({
        cashSales: 100,
        transferSales: 200,
        expenses: 50,
        withdrawals: 25,
      });

      const totals = calculateTotals(transactions);
      const result = calculateEstimatedClosingBalance(
        session.openingBalance,
        totals.cashSales,
        totals.expenses,
        totals.withdrawals
      );

      expect(result).toBe(525); // 500 + 100 - 50 - 25
    });

    it('should equal dineroEnCaja minus withdrawals', () => {
      const session = createMockSession({ openingBalance: 500 });
      const transactions = createMockTransactions({
        cashSales: 200,
        expenses: 75,
        withdrawals: 50,
      });

      const totals = calculateTotals(transactions);
      const dineroEnCaja = calculateDineroEnCaja(
        session.openingBalance,
        totals.cashSales,
        totals.expenses
      );
      const closingBalance = calculateEstimatedClosingBalance(
        session.openingBalance,
        totals.cashSales,
        totals.expenses,
        totals.withdrawals
      );

      expect(closingBalance).toBe(dineroEnCaja - totals.withdrawals);
      expect(closingBalance).toBe(575);
    });
  });

  describe('calculateTotals', () => {
    it('should correctly separate cash and transfer sales', () => {
      const transactions = createMockTransactions({
        cashSales: 100,
        transferSales: 200,
        expenses: 50,
        withdrawals: 25,
      });

      const totals = calculateTotals(transactions);

      expect(totals.cashSales).toBe(100);
      expect(totals.transferSales).toBe(200);
      expect(totals.totalSales).toBe(300);
    });

    it('should handle only expenses', () => {
      const transactions = createMockTransactions({
        expenses: 100,
      });

      const totals = calculateTotals(transactions);

      expect(totals.cashSales).toBe(0);
      expect(totals.transferSales).toBe(0);
      expect(totals.totalSales).toBe(0);
      expect(totals.expenses).toBe(100);
      expect(totals.withdrawals).toBe(0);
    });
  });
});
