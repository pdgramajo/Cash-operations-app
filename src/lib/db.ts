import Dexie, { type EntityTable } from 'dexie';
import type { Branch, CashSession, Transaction, InventoryMovement, Report } from '@/types';

export class CashOperationsDB extends Dexie {
  branches!: EntityTable<Branch, 'id'>;
  cashSessions!: EntityTable<CashSession, 'id'>;
  transactions!: EntityTable<Transaction, 'id'>;
  inventoryMovements!: EntityTable<InventoryMovement, 'id'>;
  reports!: EntityTable<Report, 'id'>;

  constructor() {
    super('cashOperationsDB');

    this.version(1).stores({
      branches: 'id, name, createdAt',
      cashSessions: 'id, branchId, status, openedAt, closedAt',
      transactions: 'id, sessionId, branchId, type, createdAt, isDeleted',
      inventoryMovements: 'id, sessionId, branchId, type, createdAt',
      reports: 'id, type, createdAt, branchId',
    });
  }
}

export const db = new CashOperationsDB();
