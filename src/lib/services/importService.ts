import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import type { CashSession, Transaction, Branch } from '@/types';
import type { ExportSessionData } from './exportService';

export interface ImportResult {
  success: boolean;
  sessionData?: ExportSessionData;
  transactionCount: number;
  branchCreated: boolean;
  error?: string;
}

export async function importSession(data: ExportSessionData): Promise<ImportResult> {
  try {
    if (!data.session || !data.transactions) {
      return {
        success: false,
        transactionCount: 0,
        branchCreated: false,
        error: 'Estructura inválida',
      };
    }

    let branchId = data.session.branchId;
    const newBranchCreated = false;

    if (data.branches && data.branches.length > 0 && branchId) {
      const branchToCheck = data.branches[0];
      if (!branchToCheck) {
        return {
          success: false,
          transactionCount: 0,
          branchCreated: false,
          error: 'Estructura inválida',
        };
      }
      const existingBranch = await db.branches.where('name').equals(branchToCheck.name).first();
      if (existingBranch) {
        branchId = existingBranch.id;
      } else {
        const newBranchId = uuidv4();
        const newBranch: Branch = {
          id: newBranchId,
          name: branchToCheck.name,
          createdAt: new Date(),
        };
        await db.branches.add(newBranch);
        branchId = newBranchId;
      }
    }

    const newSessionId = uuidv4();
    const originalSession = data.session;

    const newSession: CashSession = {
      id: newSessionId,
      name: originalSession.name,
      branchId: branchId,
      openedAt: new Date(originalSession.openedAt),
      closedAt: originalSession.closedAt ? new Date(originalSession.closedAt) : null,
      openingBalance: originalSession.openingBalance,
      closingBalance: originalSession.closingBalance,
      status: originalSession.status,
      notes: originalSession.notes,
    };

    await db.cashSessions.add(newSession);

    let transactionCount = 0;
    for (const t of data.transactions) {
      if (t.isDeleted) continue;

      const transactionBranchId = t.branchId || branchId;

      const newTransaction: Transaction = {
        id: uuidv4(),
        sessionId: newSessionId,
        branchId: transactionBranchId,
        type: t.type,
        subType: t.subType,
        amount: t.amount,
        note: t.note,
        recipientType: t.recipientType,
        recipientName: t.recipientName,
        createdAt: new Date(t.createdAt),
        isDeleted: false,
      };

      await db.transactions.add(newTransaction);
      transactionCount++;
    }

    return {
      success: true,
      sessionData: data,
      transactionCount,
      branchCreated: newBranchCreated,
    };
  } catch (error) {
    return {
      success: false,
      transactionCount: 0,
      branchCreated: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
