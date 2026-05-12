import { useState, useEffect } from 'react';
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
import { transactionRepository } from '@/lib/repos';
import { formatCurrency } from '@/lib/formatters';
import type { TransactionType, RecipientType } from '@/types';

type TransactionDialogType = 'sale' | 'expense' | 'cash_withdrawal';

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: TransactionDialogType;
  sessionId: string;
  branchId: string | null;
  onSubmit: (data: {
    sessionId: string;
    branchId: string | null;
    type: TransactionType;
    subType?: 'cash' | 'transfer';
    amount: number;
    note?: string;
    recipientType?: RecipientType;
    recipientName?: string;
  }) => Promise<unknown>;
}

export function TransactionDialog({
  open,
  onOpenChange,
  type,
  sessionId,
  branchId,
  onSubmit,
}: TransactionDialogProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [subType, setSubType] = useState<'cash' | 'transfer'>('cash');
  const [recipientType, setRecipientType] = useState<RecipientType>('owner');
  const [recipientName, setRecipientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickAmounts, setQuickAmounts] = useState<number[]>([]);

  useEffect(() => {
    if (type !== 'sale' || !branchId) return;

    let cancelled = false;
    transactionRepository.getTopSaleAmountsYesterday(branchId).then(amounts => {
      if (!cancelled) {
        setQuickAmounts(amounts.length > 0 ? amounts : [1000, 2000, 4000, 5000, 10000]);
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
