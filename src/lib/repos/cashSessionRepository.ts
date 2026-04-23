import { db } from '../db';
import type { CashSession } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const cashSessionRepository = {
  async getAll(): Promise<CashSession[]> {
    return db.cashSessions.orderBy('openedAt').reverse().toArray();
  },

  async getById(id: string): Promise<CashSession | undefined> {
    return db.cashSessions.get(id);
  },

  async getOpen(): Promise<CashSession | undefined> {
    return db.cashSessions.where('status').equals('open').first();
  },

  async getByStatus(status: 'open' | 'closed'): Promise<CashSession[]> {
    return db.cashSessions.where('status').equals(status).toArray();
  },

  async create(data: {
    name: string;
    branchId: string | null;
    openingBalance: number;
    notes?: string;
  }): Promise<CashSession> {
    const session: CashSession = {
      id: uuidv4(),
      name: data.name,
      branchId: data.branchId,
      openedAt: new Date(),
      closedAt: null,
      openingBalance: data.openingBalance,
      closingBalance: null,
      status: 'open',
      notes: data.notes ?? null,
    };
    await db.cashSessions.add(session);
    return session;
  },

  async close(id: string, closingBalance: number): Promise<void> {
    await db.cashSessions.update(id, {
      closedAt: new Date(),
      closingBalance,
      status: 'closed',
    });
  },

  async update(id: string, data: Partial<CashSession>): Promise<void> {
    await db.cashSessions.update(id, data);
  },

  async delete(id: string): Promise<void> {
    await db.cashSessions.delete(id);
  },
};
