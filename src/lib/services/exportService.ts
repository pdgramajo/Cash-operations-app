import type { CashSession, Transaction, Branch } from '@/types';

export interface ExportSessionData {
  version: string;
  exportedAt: string;
  session: Omit<CashSession, 'id'> & { originalId?: string };
  transactions: Omit<Transaction, 'id' | 'sessionId'>[];
  branches: Branch[];
}

export function exportSession(
  session: CashSession,
  transactions: Transaction[],
  branches: Branch[]
): void {
  const sessionBranches: Branch[] = [];

  const branchId = session.branchId;
  if (branchId) {
    const branch = branches.find(b => b.id === branchId);
    if (branch) {
      sessionBranches.push(branch);
    }
  }

  const exportData: ExportSessionData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    session: {
      originalId: session.id,
      name: session.name,
      branchId: session.branchId,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      openingBalance: session.openingBalance,
      closingBalance: session.closingBalance,
      status: session.status,
      notes: session.notes,
    },
    transactions: transactions.map(t => ({
      branchId: t.branchId,
      type: t.type,
      subType: t.subType,
      amount: t.amount,
      note: t.note,
      recipientType: t.recipientType,
      recipientName: t.recipientName,
      createdAt: t.createdAt,
      isDeleted: t.isDeleted,
    })),
    branches: sessionBranches,
  };

  const safeName = session.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  const date = new Date().toISOString().split('T')[0];
  const filename = `${safeName}_${date}.json`;

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseExportFile(content: string): ExportSessionData | null {
  try {
    const data = JSON.parse(content);
    if (!data.version || !data.session || !data.transactions) {
      return null;
    }
    return data as ExportSessionData;
  } catch {
    return null;
  }
}
