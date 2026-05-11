import { db } from '../db';
import type { Transaction, TransactionType, TransactionSubType, RecipientType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

function parseTransactionDate(t: Transaction): Transaction {
  return {
    ...t,
    createdAt: typeof t.createdAt === 'string' ? new Date(t.createdAt) : t.createdAt,
  };
}

function parseTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.map(parseTransactionDate);
}

export interface CreateTransactionData {
  sessionId: string;
  branchId: string | null;
  type: TransactionType;
  subType?: TransactionSubType;
  amount: number;
  note?: string;
  recipientType?: RecipientType;
  recipientName?: string;
}

export const transactionRepository = {
  async getBySession(sessionId: string): Promise<Transaction[]> {
    const transactions = await db.transactions
      .where('sessionId')
      .equals(sessionId)
      .and(t => !t.isDeleted)
      .toArray();
    return parseTransactions(transactions);
  },

  async getById(id: string): Promise<Transaction | undefined> {
    const t = await db.transactions.get(id);
    return t ? parseTransactionDate(t) : undefined;
  },

  async create(data: CreateTransactionData): Promise<Transaction> {
    const transaction: Transaction = {
      id: uuidv4(),
      sessionId: data.sessionId,
      branchId: data.branchId,
      type: data.type,
      subType: data.subType,
      amount: data.amount,
      note: data.note ?? null,
      recipientType: data.recipientType,
      recipientName: data.recipientName,
      createdAt: new Date(),
      isDeleted: false,
    };
    await db.transactions.add(transaction);
    return transaction;
  },

  async softDelete(id: string): Promise<void> {
    await db.transactions.update(id, { isDeleted: true });
  },

  async getByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    const all = await db.transactions.toArray();
    const parsed = parseTransactions(all);
    return parsed.filter(t => {
      if (t.isDeleted) return false;
      const created = t.createdAt;
      return created >= startDate && created <= endDate;
    });
  },

  async getTopSaleAmountsYesterday(branchId: string | null, limit = 5): Promise<number[]> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const transactions = await db.transactions.toArray();
    const filtered = transactions.filter(t => {
      const created = new Date(t.createdAt);
      return (
        created >= yesterday &&
        created < today &&
        !t.isDeleted &&
        t.type === 'sale' &&
        (branchId === null || t.branchId === branchId)
      );
    });

    const amountCounts = new Map<number, number>();
    for (const t of filtered) {
      const amount = Math.round(t.amount * 100) / 100;
      amountCounts.set(amount, (amountCounts.get(amount) || 0) + 1);
    }

    return Array.from(amountCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([amount]) => amount);
  },
};
