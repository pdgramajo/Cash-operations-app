import Dexie, { type EntityTable } from 'dexie';
import type {
  Branch,
  CashSession,
  Transaction,
  InventoryMovement,
  Report,
  ReceiptType,
} from '@/types';

export class CashOperationsDB extends Dexie {
  branches!: EntityTable<Branch, 'id'>;
  cashSessions!: EntityTable<CashSession, 'id'>;
  transactions!: EntityTable<Transaction, 'id'>;
  inventoryMovements!: EntityTable<InventoryMovement, 'id'>;
  reports!: EntityTable<Report, 'id'>;
  receiptTypes!: EntityTable<ReceiptType, 'id'>;

  constructor() {
    super('cashOperationsDB');

    this.version(1).stores({
      branches: 'id, name, createdAt',
      cashSessions: 'id, branchId, status, openedAt, closedAt',
      transactions: 'id, sessionId, branchId, type, createdAt, isDeleted',
      inventoryMovements: 'id, sessionId, branchId, type, createdAt',
      reports: 'id, type, createdAt, branchId',
    });

    this.version(2).stores({
      receiptTypes: 'id, name, createdAt',
    });

    this.version(3).stores({
      branches: 'id, name, createdAt',
      cashSessions: 'id, branchId, status, openedAt, closedAt',
      transactions: 'createdAt, id, sessionId, branchId, type, isDeleted',
      inventoryMovements: 'createdAt, id, sessionId, branchId, type',
      reports: 'id, type, createdAt, branchId',
      receiptTypes: 'id, name, createdAt',
    });
  }
}

export const db = new CashOperationsDB();
