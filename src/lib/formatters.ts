const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return dateFormatter.format(d);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return dateTimeFormatter.format(d);
}

export function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    sale: 'Venta',
    expense: 'Gasto',
    cash_withdrawal: 'Retiro',
    opening_balance: 'Saldo Inicial',
    refund: 'Reembolso',
    adjustment: 'Ajuste',
  };
  return labels[type] || type;
}

export function getTransactionSubTypeLabel(subType: string | undefined): string {
  if (!subType) return '';
  const labels: Record<string, string> = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
  };
  return labels[subType] || subType;
}

export function getRecipientTypeLabel(recipientType: string | undefined): string {
  if (!recipientType) return '';
  const labels: Record<string, string> = {
    owner: 'Dueño',
    employee: 'Empleado',
    messenger: 'Mensajero',
    supplier: 'Proveedor',
    branch_transfer: 'Transferencia',
    other: 'Otro',
  };
  return labels[recipientType] || recipientType;
}

export function getMovementTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    incoming: 'Entrada',
    outgoing: 'Salida',
    transfer: 'Transferencia',
    adjustment: 'Ajuste',
    damaged: 'Dañado',
    return: 'Devolución',
  };
  return labels[type] || type;
}

export function getMovementUnitLabel(unit: string | undefined): string {
  if (!unit) return '';
  const labels: Record<string, string> = {
    kg: 'kg',
    unit: 'unidades',
    half: 'media res',
    quarter: 'cuarto',
  };
  return labels[unit] || unit;
}
