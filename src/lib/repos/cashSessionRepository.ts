import { db } from '../db';
import type { CashSession } from '@/types';
import { v4 as uuidv4 } from 'uuid';

function parseSessionDate(session: CashSession): CashSession {
  return {
    ...session,
    openedAt: typeof session.openedAt === 'string' ? new Date(session.openedAt) : session.openedAt,
    closedAt: session.closedAt
      ? typeof session.closedAt === 'string'
        ? new Date(session.closedAt)
        : session.closedAt
      : null,
  };
}

function parseSessions(sessions: CashSession[]): CashSession[] {
  return sessions.map(parseSessionDate);
}

export const cashSessionRepository = {
  async getAll(): Promise<CashSession[]> {
    const sessions = await db.cashSessions.orderBy('openedAt').reverse().toArray();
    return parseSessions(sessions);
  },

  async getById(id: string): Promise<CashSession | undefined> {
    const session = await db.cashSessions.get(id);
    return session ? parseSessionDate(session) : undefined;
  },

  async getOpen(): Promise<CashSession | undefined> {
    const session = await db.cashSessions.where('status').equals('open').first();
    return session ? parseSessionDate(session) : undefined;
  },

  async getByStatus(status: 'open' | 'closed'): Promise<CashSession[]> {
    const sessions = await db.cashSessions.where('status').equals(status).toArray();
    return parseSessions(sessions);
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

  async getByDateRange(startDate: Date, endDate: Date): Promise<CashSession[]> {
    const all = await db.cashSessions.toArray();
    const parsed = parseSessions(all);
    return parsed.filter(s => {
      const opened = s.openedAt;
      return opened >= startDate && opened <= endDate;
    });
  },
};
