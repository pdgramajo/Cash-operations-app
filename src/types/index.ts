export type TransactionType =
  | 'sale'
  | 'expense'
  | 'cash_withdrawal'
  | 'opening_balance'
  | 'refund'
  | 'adjustment';

export type TransactionSubType = 'cash' | 'transfer';

export type RecipientType =
  | 'owner'
  | 'employee'
  | 'messenger'
  | 'supplier'
  | 'branch_transfer'
  | 'other';

export type InventoryMovementType =
  | 'incoming'
  | 'outgoing'
  | 'transfer'
  | 'adjustment'
  | 'damaged'
  | 'return';

export type MovementUnit = 'kg' | 'unit' | 'half' | 'quarter';

export type SessionStatus = 'open' | 'closed';

export type ReportType = 'session' | 'daily' | 'custom' | 'range';

export interface Branch {
  id: string;
  name: string;
  createdAt: Date;
}

export interface ReceiptType {
  id: string;
  name: string;
  createdAt: Date;
}

export interface CashSession {
  id: string;
  name: string;
  branchId: string | null;
  openedAt: Date;
  closedAt: Date | null;
  openingBalance: number;
  closingBalance: number | null;
  status: SessionStatus;
  notes: string | null;
}

export interface Transaction {
  id: string;
  sessionId: string;
  branchId: string | null;
  type: TransactionType;
  subType?: TransactionSubType;
  amount: number;
  note: string | null;
  recipientType?: RecipientType;
  recipientName?: string;
  createdAt: Date;
  isDeleted: boolean;
}

export interface InventoryMovement {
  id: string;
  sessionId: string;
  branchId: string | null;
  type: InventoryMovementType;
  description: string;
  receiptType?: string;
  estimatedQuantity?: number;
  unit?: MovementUnit;
  targetBranchId?: string;
  createdAt: Date;
}

export interface Report {
  id: string;
  createdAt: Date;
  type: ReportType;
  sessionIds: string[];
  dateFrom: Date | null;
  dateTo: Date | null;
  branchId: string | null;
  fileName: string;
}

export interface SessionSummary {
  sessionId: string;
  sessionName: string;
  branchName: string | null;
  openingBalance: number;
  closingBalance: number;
  cashSales: number;
  transferSales: number;
  totalSales: number;
  expenses: number;
  withdrawals: number;
  transactions: Transaction[];
  movements: InventoryMovement[];
}

export interface DailySummary {
  date: string;
  branchName: string | null;
  sessions: SessionSummary[];
  totalCash: number;
  totalTransfers: number;
  totalSales: number;
  totalExpenses: number;
  totalWithdrawals: number;
  totalInternalMovements: InventoryMovement[];
}
