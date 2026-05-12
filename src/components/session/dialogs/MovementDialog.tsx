import { useState } from 'react';
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
import { ReceiptTypeInput } from '@/components/ReceiptTypeInput';
import type { InventoryMovementType, MovementUnit } from '@/types';

type MovementDialogType = 'incoming' | 'outgoing' | 'transfer';

interface MovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: MovementDialogType;
  sessionId: string;
  branchId: string | null;
  branches: { id: string; name: string }[];
  onSubmit: (data: {
    sessionId: string;
    branchId: string | null;
    type: InventoryMovementType;
    description: string;
    receiptType?: string;
    estimatedQuantity?: number;
    unit?: MovementUnit;
    targetBranchId?: string;
  }) => Promise<unknown>;
}

export function MovementDialog({
  open,
  onOpenChange,
  type,
  sessionId,
  branchId,
  branches,
  onSubmit,
}: MovementDialogProps) {
  const [description, setDescription] = useState('');
  const [receiptType, setReceiptType] = useState('');
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
        receiptType: type === 'incoming' && receiptType.trim() ? receiptType.trim() : undefined,
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
    setReceiptType('');
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
          {type === 'incoming' && (
            <div className="space-y-2">
              <Label>Tipo (opcional)</Label>
              <ReceiptTypeInput value={receiptType} onChange={setReceiptType} />
            </div>
          )}

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
