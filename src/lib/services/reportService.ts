import { jsPDF } from 'jspdf';
import type { CashSession, Transaction, InventoryMovement, Branch } from '@/types';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getTransactionTypeLabel,
  getTransactionSubTypeLabel,
  getRecipientTypeLabel,
  getMovementTypeLabel,
  getMovementUnitLabel,
} from '@/lib/formatters';

export interface ReportOptions {
  sessions: CashSession[];
  transactions: Transaction[];
  movements: InventoryMovement[];
  branches: Branch[];
  title?: string;
  type: 'session' | 'daily' | 'custom' | 'range';
}

export function generateSessionReport(
  session: CashSession,
  transactions: Transaction[],
  movements: InventoryMovement[],
  branches: Branch[]
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  const branch = branches.find(b => b.id === session.branchId);
  const branchName = branch?.name || 'Sin sucursal';

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DE SESIÓN', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Sucursal: ${branchName}`, margin, y);
  y += 6;
  doc.text(`Sesión: ${session.name}`, margin, y);
  y += 6;
  doc.text(`Fecha: ${formatDate(session.openedAt)}`, margin, y);
  y += 6;
  doc.text(
    `Horario: ${formatDateTime(session.openedAt)} - ${formatDateTime(session.closedAt)}`,
    margin,
    y
  );
  y += 10;

  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN', margin, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const cashSales = transactions
    .filter(t => t.type === 'sale' && t.subType === 'cash')
    .reduce((sum, t) => sum + t.amount, 0);

  const transferSales = transactions
    .filter(t => t.type === 'sale' && t.subType === 'transfer')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSales = cashSales + transferSales;
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const withdrawals = transactions
    .filter(t => t.type === 'cash_withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  const closingBalance = session.closingBalance || session.openingBalance;

  doc.text(`Saldo inicial: ${formatCurrency(session.openingBalance)}`, margin, y);
  y += 6;
  doc.text(`Ventas efectivo: ${formatCurrency(cashSales)}`, margin, y);
  y += 6;
  doc.text(`Ventas transferencia: ${formatCurrency(transferSales)}`, margin, y);
  y += 6;
  doc.text(`Total ventas: ${formatCurrency(totalSales)}`, margin, y);
  y += 6;
  doc.text(`Gastos: ${formatCurrency(expenses)}`, margin, y);
  y += 6;
  doc.text(`Retiros: ${formatCurrency(withdrawals)}`, margin, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text(`CAJA CIERRA: ${formatCurrency(closingBalance)}`, margin, y);
  y += 15;

  if (transactions.length > 0) {
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MOVIMIENTOS', margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    transactions.forEach(t => {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }

      const typeLabel = getTransactionTypeLabel(t.type);
      const subTypeLabel = t.subType ? ` (${getTransactionSubTypeLabel(t.subType)})` : '';
      const recipientLabel = t.recipientType
        ? ` - ${t.recipientName || ''} (${getRecipientTypeLabel(t.recipientType)})`
        : '';
      const noteLabel = t.note ? ` - ${t.note}` : '';

      const line = `${formatDateTime(t.createdAt)} | ${typeLabel}${subTypeLabel}${recipientLabel}${noteLabel}: ${formatCurrency(t.amount)}`;
      const lines = doc.splitTextToSize(line, pageWidth - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 3;
    });
  }

  if (movements.length > 0) {
    y += 5;
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MOVIMIENTOS INTERNOS', margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    movements.forEach(m => {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }

      const unitLabel = m.unit ? ` ${getMovementUnitLabel(m.unit)}` : '';
      const qtyLabel = m.estimatedQuantity ? ` (${m.estimatedQuantity}${unitLabel})` : '';
      const targetBranch = m.targetBranchId
        ? ` → ${branches.find(b => b.id === m.targetBranchId)?.name || ''}`
        : '';

      const line = `${formatDateTime(m.createdAt)} | ${getMovementTypeLabel(m.type)}: ${m.description}${qtyLabel}${targetBranch}`;
      const lines = doc.splitTextToSize(line, pageWidth - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 3;
    });
  }

  return doc;
}

export function generateDailyReport(
  sessions: CashSession[],
  transactions: Transaction[],
  movements: InventoryMovement[],
  branches: Branch[]
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  const date =
    sessions.length > 0 ? formatDate(sessions[0]?.openedAt || new Date()) : formatDate(new Date());
  const firstSessionBranchId = sessions[0]?.branchId ?? null;
  const branch = branches.find(b => b.id === firstSessionBranchId);
  const branchName = branch?.name || 'Todas las sucursales';

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DIARIO', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Sucursal: ${branchName}`, margin, y);
  y += 6;
  doc.text(`Fecha: ${date}`, margin, y);
  y += 6;
  doc.text(`Sesiones: ${sessions.length}`, margin, y);
  y += 10;

  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  let totalCash = 0;
  let totalTransfers = 0;
  let totalExpenses = 0;
  let totalWithdrawals = 0;

  sessions.forEach((session, index) => {
    if (y > 250) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`SESIÓN ${index + 1}: ${session.name.toUpperCase()}`, margin, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const sessionTransactions = transactions.filter(t => t.sessionId === session.id);

    const cashSales = sessionTransactions
      .filter(t => t.type === 'sale' && t.subType === 'cash')
      .reduce((sum, t) => sum + t.amount, 0);

    const transferSales = sessionTransactions
      .filter(t => t.type === 'sale' && t.subType === 'transfer')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = sessionTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const withdrawals = sessionTransactions
      .filter(t => t.type === 'cash_withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);

    totalCash += cashSales;
    totalTransfers += transferSales;
    totalExpenses += expenses;
    totalWithdrawals += withdrawals;

    doc.text(`Saldo inicial: ${formatCurrency(session.openingBalance)}`, margin + 5, y);
    y += 5;
    doc.text(`Efectivo ventas: ${formatCurrency(cashSales)}`, margin + 5, y);
    y += 5;
    doc.text(`Transferencias: ${formatCurrency(transferSales)}`, margin + 5, y);
    y += 5;
    doc.text(`Gastos: ${formatCurrency(expenses)}`, margin + 5, y);
    y += 5;
    doc.text(`Retiros: ${formatCurrency(withdrawals)}`, margin + 5, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text(`CAJA CIERRA: ${formatCurrency(session.closingBalance || 0)}`, margin + 5, y);
    y += 12;
  });

  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CONSOLIDADO DEL DÍA', margin, y);
  y += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total efectivo en caja: ${formatCurrency(totalCash)}`, margin, y);
  y += 7;
  doc.text(`Total transferencias: ${formatCurrency(totalTransfers)}`, margin, y);
  y += 7;
  doc.text(`Total gastos: ${formatCurrency(totalExpenses)}`, margin, y);
  y += 7;
  doc.text(`Total retiros: ${formatCurrency(totalWithdrawals)}`, margin, y);
  y += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL GENERAL: ${formatCurrency(totalCash + totalTransfers)}`, margin, y);
  y += 15;

  const dayMovements = movements.filter(m => sessions.some(s => s.id === m.sessionId));

  if (dayMovements.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('MOVIMIENTOS INTERNOS', margin, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    dayMovements.forEach(m => {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }

      const unitLabel = m.unit ? ` ${getMovementUnitLabel(m.unit)}` : '';
      const qtyLabel = m.estimatedQuantity ? ` (${m.estimatedQuantity}${unitLabel})` : '';
      const targetBranch = m.targetBranchId
        ? ` → ${branches.find(b => b.id === m.targetBranchId)?.name || ''}`
        : '';

      const line = `${getMovementTypeLabel(m.type)}: ${m.description}${qtyLabel}${targetBranch}`;
      doc.text(line, margin, y);
      y += 6;
    });
  }

  return doc;
}

export function downloadReport(doc: jsPDF, fileName: string): void {
  doc.save(fileName);
}
