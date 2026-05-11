import { jsPDF } from 'jspdf';
import type { CashSession, Transaction, InventoryMovement, Branch } from '@/types';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
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

  const cashSales = transactions.filter(t => t.type === 'sale' && t.subType === 'cash');
  const transferSales = transactions.filter(t => t.type === 'sale' && t.subType === 'transfer');
  const expenses = transactions.filter(t => t.type === 'expense');
  const withdrawals = transactions.filter(t => t.type === 'cash_withdrawal');

  const totalCashSales = cashSales.reduce((sum, t) => sum + t.amount, 0);
  const totalTransferSales = transferSales.reduce((sum, t) => sum + t.amount, 0);
  const totalSales = totalCashSales + totalTransferSales;
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = withdrawals.reduce((sum, t) => sum + t.amount, 0);

  const closingBalance = session.closingBalance || session.openingBalance;

  const writeLine = (label: string, value: string, indent: number = 0) => {
    doc.text(label, margin + indent, y);
    doc.text(value, pageWidth - margin, y, { align: 'right' });
  };

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DE SESIÓN', margin, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  writeLine('Sucursal', branchName);
  y += 6;
  writeLine('Sesión', session.name);
  y += 6;
  writeLine('Apertura', formatDateTime(session.openedAt));
  y += 6;
  writeLine('Cierre', session.closedAt ? formatDateTime(session.closedAt) : '-');
  y += 12;

  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ENTRADAS', margin, y);
  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  writeLine('Saldo inicial', formatCurrency(session.openingBalance));
  y += 7;
  writeLine('Ventas efectivo', formatCurrency(totalCashSales));
  y += 7;
  writeLine('Ventas transferencia', formatCurrency(totalTransferSales));
  y += 7;

  const totalEntradas = session.openingBalance + totalSales;
  y += 2;
  doc.setFont('helvetica', 'bold');
  writeLine('Total entradas', formatCurrency(totalEntradas));
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SALIDAS', margin, y);
  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  writeLine('Gastos', formatCurrency(totalExpenses));
  y += 7;
  writeLine('Retiros', formatCurrency(totalWithdrawals));
  y += 7;

  const totalSalidas = totalExpenses + totalWithdrawals;
  y += 2;
  doc.setFont('helvetica', 'bold');
  writeLine('Total salidas', formatCurrency(totalSalidas));
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  writeLine('Efectivo en caja', formatCurrency(closingBalance));

  if (movements.length > 0) {
    y += 10;
    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INVENTARIO', margin, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const addMovementLine = (m: InventoryMovement, prefix: string) => {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
      const unitLabel = m.unit ? ` ${getMovementUnitLabel(m.unit)}` : '';
      const qtyLabel = m.estimatedQuantity ? ` (${m.estimatedQuantity}${unitLabel})` : '';
      const targetBranch = m.targetBranchId
        ? ` → ${branches.find(b => b.id === m.targetBranchId)?.name || ''}`
        : '';
      const desc = `${m.description}${qtyLabel}${targetBranch}`;
      doc.text(`${prefix} ${desc}`, margin, y);
      y += 6;
    };

    const incoming = movements.filter(m => m.type === 'incoming');
    const outgoing = movements.filter(m => m.type === 'outgoing');
    const transfers = movements.filter(m => m.type === 'transfer');
    const adjustments = movements.filter(
      m => m.type === 'adjustment' || m.type === 'damaged' || m.type === 'return'
    );

    if (incoming.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('ENTRADA', margin, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      incoming.forEach(m => addMovementLine(m, '-'));
      y += 4;
    }

    if (outgoing.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('SALIDA', margin, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      outgoing.forEach(m => addMovementLine(m, '-'));
      y += 4;
    }

    if (transfers.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('TRANSFERENCIA', margin, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      transfers.forEach(m => addMovementLine(m, '-'));
      y += 4;
    }

    if (adjustments.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('AJUSTE/OTRO', margin, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      adjustments.forEach(m => addMovementLine(m, '-'));
    }
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

export function generateWeeklyReport(
  sessions: CashSession[],
  transactions: Transaction[],
  movements: InventoryMovement[],
  branches: Branch[],
  startDate: Date,
  endDate: Date
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const getDayName = (date: Date): string => {
    const dayIndex = date.getDay();
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    return dayNames[adjustedIndex] || '';
  };

  const getDateKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const isVacuna = (text: string): boolean => {
    const lower = text.toLowerCase();
    return lower.includes('vacuna') || lower.includes('novillo') || lower.includes('vaca');
  };

  const isCerdo = (text: string): boolean => {
    return text.toLowerCase().includes('cerdo');
  };

  const getBranchName = (branchId: string | null): string => {
    if (!branchId) return 'Sin sucursal';
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || 'Sucursal desconocida';
  };

  const uniqueBranchIds = [
    ...new Set(sessions.map(s => s.branchId).filter(b => b !== null)),
  ] as string[];

  const formatShortDate = (d: Date) => {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE SEMANAL', margin, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Período: ${formatShortDate(startDate)} - ${formatShortDate(endDate)}`, margin, y);
  y += 12;

  uniqueBranchIds.forEach((branchId, branchIndex) => {
    if (y > 250) {
      doc.addPage();
      y = margin;
    }

    const branchName = getBranchName(branchId);
    const branchSessions = sessions.filter(s => s.branchId === branchId);
    const branchSessionIds = new Set(branchSessions.map(s => s.id));

    const branchTransactions = transactions.filter(t => branchSessionIds.has(t.sessionId));
    const branchMovements = movements.filter(m => branchSessionIds.has(m.sessionId));

    const daysData: { day: string; date: number; total: number }[] = [];
    let totalWeekSales = 0;

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = getDateKey(currentDate);
      const dayTransactions = branchTransactions.filter(t => {
        const tDate = new Date(t.createdAt);
        return getDateKey(tDate) === dateKey && t.type === 'sale';
      });

      const cashSales = dayTransactions
        .filter(t => t.subType === 'cash')
        .reduce((sum, t) => sum + t.amount, 0);

      const transferSales = dayTransactions
        .filter(t => t.subType === 'transfer')
        .reduce((sum, t) => sum + t.amount, 0);

      const dayTotal = cashSales + transferSales;
      totalWeekSales += dayTotal;

      daysData.push({
        day: getDayName(currentDate),
        date: currentDate.getDate(),
        total: dayTotal,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    let totalVacunas = 0;
    let totalCerdo = 0;

    branchMovements.forEach(m => {
      if (m.type !== 'incoming') return;
      const searchText = `${m.receiptType || ''} ${m.description || ''}`.toLowerCase();
      if (isVacuna(searchText)) totalVacunas++;
      if (isCerdo(searchText)) totalCerdo++;
    });

    if (branchIndex > 0) {
      y += 8;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`SUCURSAL: ${branchName}`, margin, y);
    y += 8;

    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Ventas por día', margin, y);
    y += 7;

    daysData.forEach(dayData => {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
      const label = `${dayData.day} ${dayData.date} => ${formatCurrency(dayData.total)}`;
      doc.text(label, margin, y);
      y += 6;
    });

    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total semana: ${formatCurrency(totalWeekSales)}`, margin, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Medias res recibidas', margin, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.text(`Vacunas: ${totalVacunas}`, margin, y);
    y += 6;
    doc.text(`Cerdo: ${totalCerdo}`, margin, y);
    y += 10;
  });

  return doc;
}

export function generateWeeklyReportText(
  sessions: CashSession[],
  transactions: Transaction[],
  movements: InventoryMovement[],
  branches: Branch[],
  startDate: Date,
  endDate: Date
): string {
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const getDayName = (date: Date): string => {
    const dayIndex = date.getDay();
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    return dayNames[adjustedIndex] || '';
  };

  const getDateKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const isVacuna = (text: string): boolean => {
    const lower = text.toLowerCase();
    return lower.includes('vacuna') || lower.includes('novillo') || lower.includes('vaca');
  };

  const isCerdo = (text: string): boolean => {
    return text.toLowerCase().includes('cerdo');
  };

  const getBranchName = (branchId: string | null): string => {
    if (!branchId) return 'Sin sucursal';
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || 'Sucursal desconocida';
  };

  const uniqueBranchIds = [
    ...new Set(sessions.map(s => s.branchId).filter(b => b !== null)),
  ] as string[];

  const formatShortDate = (d: Date) => {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  let text = `REPORTE SEMANAL\nPeríodo: ${formatShortDate(startDate)} - ${formatShortDate(endDate)}\n\n`;

  uniqueBranchIds.forEach((branchId, branchIndex) => {
    const branchName = getBranchName(branchId);
    const branchSessions = sessions.filter(s => s.branchId === branchId);
    const branchSessionIds = new Set(branchSessions.map(s => s.id));

    const branchTransactions = transactions.filter(t => branchSessionIds.has(t.sessionId));
    const branchMovements = movements.filter(m => branchSessionIds.has(m.sessionId));

    const daysData: { day: string; date: number; total: number }[] = [];
    let totalWeekSales = 0;

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = getDateKey(currentDate);
      const dayTransactions = branchTransactions.filter(t => {
        const tDate = new Date(t.createdAt);
        return getDateKey(tDate) === dateKey && t.type === 'sale';
      });

      const cashSales = dayTransactions
        .filter(t => t.subType === 'cash')
        .reduce((sum, t) => sum + t.amount, 0);

      const transferSales = dayTransactions
        .filter(t => t.subType === 'transfer')
        .reduce((sum, t) => sum + t.amount, 0);

      const dayTotal = cashSales + transferSales;
      totalWeekSales += dayTotal;

      daysData.push({
        day: getDayName(currentDate),
        date: currentDate.getDate(),
        total: dayTotal,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    let totalVacunas = 0;
    let totalCerdo = 0;

    branchMovements.forEach(m => {
      if (m.type !== 'incoming') return;
      const searchText = `${m.receiptType || ''} ${m.description || ''}`.toLowerCase();
      if (isVacuna(searchText)) totalVacunas++;
      if (isCerdo(searchText)) totalCerdo++;
    });

    if (branchIndex > 0) {
      text += '\n';
    }

    text += `SUCURSAL: ${branchName}\n`;
    text += '-'.repeat(30) + '\n';
    text += 'Ventas por día\n';

    daysData.forEach(dayData => {
      text += `${dayData.day} ${dayData.date} => ${formatCurrency(dayData.total)}\n`;
    });

    text += `\nTotal semana: ${formatCurrency(totalWeekSales)}\n`;
    text += '-'.repeat(30) + '\n';
    text += 'Medias res recibidas\n';
    text += `Vacunas: ${totalVacunas}\n`;
    text += `Cerdo: ${totalCerdo}\n`;
  });

  return text;
}
