import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, FileText, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTransactions, useInventoryMovements, useCashSessions } from '@/hooks';
import { transactionRepository } from '@/lib/repos';
import {
  formatCurrency,
  formatDateTime,
  getTransactionTypeLabel,
  getTransactionSubTypeLabel,
  getRecipientTypeLabel,
  getMovementTypeLabel,
  getMovementUnitLabel,
} from '@/lib/formatters';
import type {
  Branch,
  CashSession,
  Transaction,
  InventoryMovement,
  TransactionType,
  InventoryMovementType,
  MovementUnit,
  RecipientType,
} from '@/types';

interface SessionPageProps {
  session: CashSession;
  onBack: () => void;
  branches: Branch[];
  onShowReports: () => void;
}

type TransactionDialogType = 'sale' | 'expense' | 'cash_withdrawal';
type MovementDialogType = 'incoming' | 'outgoing' | 'transfer';
type TransactionFilter = 'all' | 'cash' | 'transfer' | 'expense';

export function SessionPage({ session, onBack, branches, onShowReports }: SessionPageProps) {
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [transactionDialogType, setTransactionDialogType] = useState<TransactionDialogType>('sale');
  const [movementDialogType, setMovementDialogType] = useState<MovementDialogType>('incoming');
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>('all');

  const { transactions, createTransaction, deleteTransaction, getTotals } = useTransactions(
    session.id
  );
  const { movements, createMovement, deleteMovement } = useInventoryMovements(session.id);
  const { closeSession, updateSession } = useCashSessions();
  const [editingOpeningBalance, setEditingOpeningBalance] = useState(false);
  const [tempOpeningBalance, setTempOpeningBalance] = useState(session.openingBalance.toString());
  const [currentSession, setCurrentSession] = useState(session);

  const totals = getTotals();

  const estimatedClosingBalance =
    currentSession.openingBalance + totals.cashSales - totals.expenses - totals.withdrawals;

  const cashSales = totals.cashSales;
  const transferSales = totals.transferSales || 0;
  const totalSales = cashSales + transferSales;
  const dineroEnCaja = currentSession.openingBalance + cashSales - totals.expenses;

  const transactionsByFilter = transactions.filter(t => {
    if (transactionFilter === 'all') return true;
    if (transactionFilter === 'cash') return t.type === 'sale' && t.subType === 'cash';
    if (transactionFilter === 'transfer') return t.type === 'sale' && t.subType === 'transfer';
    if (transactionFilter === 'expense') return t.type === 'expense';
    return true;
  });

  const filterCounts = {
    all: transactions.length,
    cash: transactions.filter(t => t.type === 'sale' && t.subType === 'cash').length,
    transfer: transactions.filter(t => t.type === 'sale' && t.subType === 'transfer').length,
    expense: transactions.filter(t => t.type === 'expense').length,
  };

  const getBranchName = (branchId: string | null) => {
    if (!branchId) return 'Sin sucursal';
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || 'Sucursal desconocida';
  };

  return (
    <div className="container mx-auto p-4 max-w-md h-screen flex flex-col">
      <div className="flex-shrink-0">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 relative">
            <h1 className="text-2xl font-bold pr-16">{session.name}</h1>
            <p className="text-sm text-muted-foreground">
              {getBranchName(session.branchId)} • {formatDateTime(session.openedAt)}
            </p>
            {session.status === 'open' && !editingOpeningBalance && (
              <button
                type="button"
                className="text-xs text-blue-500 underline mt-1"
                onClick={() => setEditingOpeningBalance(true)}
              >
                Saldo inicial: {formatCurrency(currentSession.openingBalance)}
              </button>
            )}
            {session.status === 'open' && editingOpeningBalance && (
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="number"
                  className="text-xs border rounded px-1 py-0.5 w-20"
                  value={tempOpeningBalance}
                  onChange={e => setTempOpeningBalance(e.target.value)}
                />
                <button
                  type="button"
                  className="text-xs text-green-600"
                  onClick={async () => {
                    const newBalance = parseFloat(tempOpeningBalance);
                    if (!isNaN(newBalance)) {
                      await updateSession(currentSession.id, { openingBalance: newBalance });
                      setCurrentSession(prev => ({ ...prev, openingBalance: newBalance }));
                    }
                    setEditingOpeningBalance(false);
                  }}
                >
                  ✓
                </button>
                <button
                  type="button"
                  className="text-xs text-red-500"
                  onClick={() => {
                    setTempOpeningBalance(session.openingBalance.toString());
                    setEditingOpeningBalance(false);
                  }}
                >
                  ✕
                </button>
              </div>
            )}
            {session.status === 'closed' && (
              <p className="text-xs text-muted-foreground mt-1">
                Saldo inicial: {formatCurrency(currentSession.openingBalance)}
              </p>
            )}
            {session.status === 'open' && (
              <Button
                variant="outline"
                size="sm"
                className="absolute right-0 top-0 h-7 text-sm"
                onClick={() => setShowCloseDialog(true)}
              >
                <Lock className="h-3 w-3 mr-1" />
                Cerrar
              </Button>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onShowReports}>
            <FileText className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <Card className="h-12 flex flex-col justify-center">
            <p className="text-xs font-medium text-green-600 text-center">Efectivo</p>
            <p className="text-base font-bold text-green-600 text-center">
              {formatCurrency(cashSales)}
            </p>
          </Card>
          <Card className="h-12 flex flex-col justify-center">
            <p className="text-xs font-medium text-blue-400 text-center">Transferencias</p>
            <p className="text-base font-bold text-blue-400 text-center">
              {formatCurrency(transferSales)}
            </p>
          </Card>
          <Card className="h-12 flex flex-col justify-center">
            <p className="text-xs font-medium text-center">Total Ventas</p>
            <p className="text-base font-bold text-center">{formatCurrency(totalSales)}</p>
          </Card>
          <Card className="h-12 flex flex-col justify-center">
            <p className="text-xs font-medium text-center">Dinero Caja</p>
            <p className="text-base font-bold text-center">{formatCurrency(dineroEnCaja)}</p>
          </Card>
        </div>

        {session.status === 'open' && (
          <div className="grid grid-cols-3 gap-1 mb-3">
            <Button
              variant="outline"
              size="sm"
              className="text-xs py-1 h-7"
              onClick={() => {
                setTransactionDialogType('sale');
                setShowTransactionDialog(true);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Venta
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs py-1 h-7"
              onClick={() => {
                setTransactionDialogType('expense');
                setShowTransactionDialog(true);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Gasto
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs py-1 h-7"
              onClick={() => {
                setTransactionDialogType('cash_withdrawal');
                setShowTransactionDialog(true);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Retiro
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <Tabs defaultValue="transactions">
          <TabsList className="w-full">
            <TabsTrigger value="transactions" className="flex-1">
              Movimientos ({transactions.length})
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex-1">
              Inventario ({movements.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="mt-4 h-full">
            <div className="grid grid-cols-4 gap-1 mb-3">
              <Button
                variant="outline"
                size="sm"
                className={`text-xs py-1 h-7 ${transactionFilter === 'all' ? 'bg-gray-600 text-white border-gray-600' : ''}`}
                onClick={() => setTransactionFilter('all')}
              >
                Todos ({filterCounts.all})
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`text-xs py-1 h-7 ${transactionFilter === 'cash' ? 'bg-green-600 text-white border-green-600' : ''}`}
                onClick={() => setTransactionFilter('cash')}
              >
                Efectivo ({filterCounts.cash})
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`text-xs py-1 h-7 ${transactionFilter === 'transfer' ? 'bg-blue-400 text-white border-blue-400' : ''}`}
                onClick={() => setTransactionFilter('transfer')}
              >
                Transf ({filterCounts.transfer})
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`text-xs py-1 h-7 ${transactionFilter === 'expense' ? 'bg-red-600 text-white border-red-600' : ''}`}
                onClick={() => setTransactionFilter('expense')}
              >
                Gastos ({filterCounts.expense})
              </Button>
            </div>
            <div className="h-[calc(100vh-340px)] overflow-y-auto pr-4">
              <div className="space-y-2">
                {transactionsByFilter.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay transacciones</p>
                ) : (
                  transactionsByFilter.map(t => (
                    <TransactionItem
                      key={t.id}
                      transaction={t}
                      onDelete={
                        session.status === 'open' ? () => deleteTransaction(t.id) : undefined
                      }
                    />
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="mt-4 h-full">
            {session.status === 'open' && (
              <div className="grid grid-cols-3 gap-1 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs py-1 h-7"
                  onClick={() => {
                    setMovementDialogType('incoming');
                    setShowMovementDialog(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Entrada
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs py-1 h-7"
                  onClick={() => {
                    setMovementDialogType('outgoing');
                    setShowMovementDialog(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Salida
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs py-1 h-7"
                  onClick={() => {
                    setMovementDialogType('transfer');
                    setShowMovementDialog(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Transferir
                </Button>
              </div>
            )}
            <div className="h-[calc(100vh-380px)] overflow-y-auto pr-4">
              <div className="space-y-2">
                {movements.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay movimientos</p>
                ) : (
                  movements.map(m => (
                    <MovementItem
                      key={m.id}
                      movement={m}
                      onDelete={session.status === 'open' ? () => deleteMovement(m.id) : undefined}
                      branches={branches}
                    />
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <TransactionDialog
        key={showTransactionDialog ? 'open' : 'closed'}
        open={showTransactionDialog}
        onOpenChange={setShowTransactionDialog}
        type={transactionDialogType}
        sessionId={session.id}
        branchId={session.branchId}
        onSubmit={createTransaction}
      />

      <MovementDialog
        open={showMovementDialog}
        onOpenChange={setShowMovementDialog}
        type={movementDialogType}
        sessionId={session.id}
        branchId={session.branchId}
        branches={branches}
        onSubmit={createMovement}
      />

      <CloseSessionDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        session={session}
        estimatedClosing={estimatedClosingBalance}
        closeSession={closeSession}
        onClose={onBack}
      />
    </div>
  );
}

function TransactionItem({
  transaction,
  onDelete,
}: {
  transaction: Transaction;
  onDelete?: () => void;
}) {
  const isNegative =
    transaction.type === 'expense' ||
    (transaction.type === 'cash_withdrawal' && transaction.recipientType !== 'branch_transfer');

  const getAmountColor = () => {
    if (isNegative) return 'text-destructive';
    if (transaction.type === 'sale' && transaction.subType === 'cash') return 'text-green-600';
    if (transaction.type === 'sale' && transaction.subType === 'transfer') return 'text-blue-400';
    return '';
  };

  return (
    <Card className={isNegative ? 'border-destructive/50' : ''}>
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="font-medium">
              {getTransactionTypeLabel(transaction.type)}
              {transaction.subType && (
                <span
                  className={`ml-1 ${
                    transaction.subType === 'cash' ? 'text-green-600' : 'text-blue-400'
                  }`}
                >
                  ({getTransactionSubTypeLabel(transaction.subType)})
                </span>
              )}
            </p>
            {transaction.recipientType && (
              <p className="text-sm text-muted-foreground">
                {transaction.recipientName} ({getRecipientTypeLabel(transaction.recipientType)})
              </p>
            )}
            {transaction.note && (
              <p className="text-sm text-muted-foreground">{transaction.note}</p>
            )}
            <p className="text-xs text-muted-foreground">{formatDateTime(transaction.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-bold ${getAmountColor()}`}>
              {isNegative ? '-' : '+'}
              {formatCurrency(transaction.amount)}
            </span>
            {onDelete && (
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MovementItem({
  movement,
  onDelete,
  branches,
}: {
  movement: InventoryMovement;
  onDelete?: () => void;
  branches: Branch[];
}) {
  const getTargetBranchName = (branchId: string | undefined) => {
    if (!branchId) return '';
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || '';
  };

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="font-medium">{movement.description}</p>
            {movement.targetBranchId && (
              <p className="text-sm text-muted-foreground">
                → {getTargetBranchName(movement.targetBranchId)}
              </p>
            )}
            {movement.estimatedQuantity && (
              <p className="text-sm text-muted-foreground">
                {movement.estimatedQuantity} {getMovementUnitLabel(movement.unit)}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{formatDateTime(movement.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{getMovementTypeLabel(movement.type)}</span>
            {onDelete && (
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionDialog({
  open,
  onOpenChange,
  type,
  sessionId,
  branchId,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: TransactionDialogType;
  sessionId: string;
  branchId: string | null;
  onSubmit: (
    data: Parameters<ReturnType<typeof useTransactions>['createTransaction']>[0]
  ) => Promise<Transaction>;
}) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [subType, setSubType] = useState<'cash' | 'transfer'>('cash');
  const [recipientType, setRecipientType] = useState<RecipientType>('owner');
  const [recipientName, setRecipientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickAmounts, setQuickAmounts] = useState<number[]>([]);

  const defaultQuickAmounts = [1000, 2000, 4000, 5000, 10000];

  useEffect(() => {
    if (type !== 'sale' || !branchId) return;

    let cancelled = false;
    transactionRepository.getTopSaleAmountsYesterday(branchId).then(amounts => {
      if (!cancelled) {
        setQuickAmounts(amounts.length > 0 ? amounts : defaultQuickAmounts);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [branchId, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    setLoading(true);
    try {
      await onSubmit({
        sessionId,
        branchId,
        type: type as TransactionType,
        subType: type === 'sale' ? subType : undefined,
        amount: parseFloat(amount),
        note: note.trim() || undefined,
        recipientType: type === 'cash_withdrawal' ? recipientType : undefined,
        recipientName: type === 'cash_withdrawal' ? recipientName.trim() || undefined : undefined,
      });
      resetForm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setNote('');
    setSubType('cash');
    setRecipientType('owner');
    setRecipientName('');
  };

  const getTitle = () => {
    switch (type) {
      case 'sale':
        return 'Nueva Venta';
      case 'expense':
        return 'Nuevo Gasto';
      case 'cash_withdrawal':
        return 'Nuevo Retiro';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'sale' && (
            <div className="space-y-2">
              <Label>Tipo de pago</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className={`text-xs py-1 h-9 ${
                    subType === 'cash' ? 'bg-green-600 text-white border-green-600' : ''
                  }`}
                  onClick={() => setSubType('cash')}
                >
                  Efectivo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={`text-xs py-1 h-9 ${
                    subType === 'transfer' ? 'bg-blue-400 text-white border-blue-400' : ''
                  }`}
                  onClick={() => setSubType('transfer')}
                >
                  Transferencia
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
            {type === 'sale' && quickAmounts.length > 0 && (
              <div className="flex gap-1">
                {quickAmounts.map(quickAmount => (
                  <Button
                    key={quickAmount}
                    type="button"
                    variant="outline"
                    className="flex-1 h-7 px-1 py-0 text-xs"
                    onClick={() => setAmount(quickAmount.toString())}
                  >
                    {formatCurrency(quickAmount)}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {type === 'cash_withdrawal' && (
            <>
              <div className="space-y-2">
                <Label>Tipo de retiro</Label>
                <Select
                  value={recipientType}
                  onValueChange={v => setRecipientType(v as RecipientType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Dueño</SelectItem>
                    <SelectItem value="employee">Empleado</SelectItem>
                    <SelectItem value="messenger">Mensajero</SelectItem>
                    <SelectItem value="supplier">Proveedor</SelectItem>
                    <SelectItem value="branch_transfer">Transferencia a sucursal</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientName">Nombre</Label>
                <Input
                  id="recipientName"
                  placeholder="Nombre de quien retira"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="note">{type === 'expense' ? 'Descripción' : 'Nota'} (opcional)</Label>
            <Input
              id="note"
              placeholder={type === 'expense' ? 'Ej: Papel, Transporte' : 'Nota'}
              value={note}
              onChange={e => setNote(e.target.value)}
              required={type === 'expense'}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MovementDialog({
  open,
  onOpenChange,
  type,
  sessionId,
  branchId,
  branches,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: MovementDialogType;
  sessionId: string;
  branchId: string | null;
  branches: Branch[];
  onSubmit: (
    data: Parameters<ReturnType<typeof useInventoryMovements>['createMovement']>[0]
  ) => Promise<InventoryMovement>;
}) {
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<MovementUnit>('unit');
  const [targetBranchId, setTargetBranchId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        sessionId,
        branchId,
        type: type as InventoryMovementType,
        description: description.trim(),
        estimatedQuantity: quantity ? parseFloat(quantity) : undefined,
        unit: unit || undefined,
        targetBranchId: type === 'transfer' ? targetBranchId || undefined : undefined,
      });
      resetForm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setQuantity('');
    setUnit('unit');
    setTargetBranchId('');
  };

  const getTitle = () => {
    switch (type) {
      case 'incoming':
        return 'Entrada de Mercadería';
      case 'outgoing':
        return 'Salida de Mercadería';
      case 'transfer':
        return 'Transferencia';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              placeholder="Ej: Llegó media res, 3kg pulpa"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad (opcional)</Label>
              <Input
                id="quantity"
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Select value={unit} onValueChange={v => setUnit(v as MovementUnit)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="unit">unidades</SelectItem>
                  <SelectItem value="half">media res</SelectItem>
                  <SelectItem value="quarter">cuarto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === 'transfer' && (
            <div className="space-y-2">
              <Label>Sucursal destino</Label>
              <Select value={targetBranchId} onValueChange={setTargetBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CloseSessionDialog({
  open,
  onOpenChange,
  session,
  estimatedClosing,
  closeSession,
  onClose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: CashSession;
  estimatedClosing: number;
  closeSession: (id: string, closingBalance: number) => Promise<void>;
  onClose: () => void;
}) {
  const [closingBalance, setClosingBalance] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      await closeSession(session.id, parseFloat(closingBalance) || estimatedClosing);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cerrar Sesión</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Saldo estimado en caja:</p>
              <p className="text-2xl font-bold">{formatCurrency(estimatedClosing)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="closingBalance">Saldo real al cerrar</Label>
              <Input
                id="closingBalance"
                type="number"
                inputMode="decimal"
                placeholder={String(estimatedClosing)}
                value={closingBalance}
                onChange={e => setClosingBalance(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">Ingresá el monto real contado en caja</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Cerrando...' : 'Cerrar Sesión'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
