import { db } from '@/lib/db';
import type {
  Branch,
  CashSession,
  Transaction,
  InventoryMovement,
  Report,
  ReceiptType,
} from '@/types';

export interface BackupData {
  version: string;
  exportedAt: string;
  branches: Branch[];
  cashSessions: CashSession[];
  transactions: Transaction[];
  inventoryMovements: InventoryMovement[];
  receiptTypes: ReceiptType[];
  reports: Report[];
}

export interface ImportResult {
  success: boolean;
  branches: number;
  cashSessions: number;
  transactions: number;
  inventoryMovements: number;
  receiptTypes: number;
  reports: number;
  error?: string;
}

function parseDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

function parseBranch(data: Branch[]): Branch[] {
  return data.map(b => ({ ...b, createdAt: parseDate(b.createdAt) }));
}

function parseCashSession(data: CashSession[]): CashSession[] {
  return data.map(s => ({
    ...s,
    openedAt: parseDate(s.openedAt),
    closedAt: s.closedAt ? parseDate(s.closedAt) : null,
  }));
}

function parseTransaction(data: Transaction[]): Transaction[] {
  return data.map(t => ({ ...t, createdAt: parseDate(t.createdAt) }));
}

function parseInventoryMovement(data: InventoryMovement[]): InventoryMovement[] {
  return data.map(m => ({ ...m, createdAt: parseDate(m.createdAt) }));
}

function parseReport(data: Report[]): Report[] {
  return data.map(r => ({
    ...r,
    createdAt: parseDate(r.createdAt),
    dateFrom: r.dateFrom ? parseDate(r.dateFrom) : null,
    dateTo: r.dateTo ? parseDate(r.dateTo) : null,
  }));
}

function parseReceiptType(data: ReceiptType[]): ReceiptType[] {
  return data.map(r => ({ ...r, createdAt: parseDate(r.createdAt) }));
}

export async function exportAllData(): Promise<BackupData> {
  const [branches, cashSessions, transactions, inventoryMovements, receiptTypes, reports] =
    await Promise.all([
      db.branches.toArray(),
      db.cashSessions.toArray(),
      db.transactions.toArray(),
      db.inventoryMovements.toArray(),
      db.receiptTypes.toArray(),
      db.reports.toArray(),
    ]);

  return {
    version: 'backup-v1',
    exportedAt: new Date().toISOString(),
    branches,
    cashSessions,
    transactions,
    inventoryMovements,
    receiptTypes,
    reports,
  };
}

export function downloadBackup(data: BackupData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().split('T')[0];
  a.download = `backup-completo-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importBackup(data: BackupData): Promise<ImportResult> {
  try {
    if (!data.version || !data.branches) {
      return {
        success: false,
        branches: 0,
        cashSessions: 0,
        transactions: 0,
        inventoryMovements: 0,
        receiptTypes: 0,
        reports: 0,
        error: 'Formato de backup inválido',
      };
    }

    let branches = 0;
    let cashSessions = 0;
    let transactions = 0;
    let inventoryMovements = 0;
    let receiptTypes = 0;
    let reports = 0;

    if (data.branches && data.branches.length > 0) {
      await db.branches.bulkPut(parseBranch(data.branches));
      branches = data.branches.length;
    }

    if (data.cashSessions && data.cashSessions.length > 0) {
      await db.cashSessions.bulkPut(parseCashSession(data.cashSessions));
      cashSessions = data.cashSessions.length;
    }

    if (data.transactions && data.transactions.length > 0) {
      await db.transactions.bulkPut(parseTransaction(data.transactions));
      transactions = data.transactions.length;
    }

    if (data.inventoryMovements && data.inventoryMovements.length > 0) {
      await db.inventoryMovements.bulkPut(parseInventoryMovement(data.inventoryMovements));
      inventoryMovements = data.inventoryMovements.length;
    }

    if (data.receiptTypes && data.receiptTypes.length > 0) {
      await db.receiptTypes.bulkPut(parseReceiptType(data.receiptTypes));
      receiptTypes = data.receiptTypes.length;
    }

    if (data.reports && data.reports.length > 0) {
      await db.reports.bulkPut(parseReport(data.reports));
      reports = data.reports.length;
    }

    return {
      success: true,
      branches,
      cashSessions,
      transactions,
      inventoryMovements,
      receiptTypes,
      reports,
    };
  } catch (error) {
    return {
      success: false,
      branches: 0,
      cashSessions: 0,
      transactions: 0,
      inventoryMovements: 0,
      receiptTypes: 0,
      reports: 0,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export function validateBackupFile(file: File): Promise<BackupData | null> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.version && data.branches) {
          resolve(data);
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
}
