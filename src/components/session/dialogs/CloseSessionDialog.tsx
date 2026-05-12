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
import { formatCurrency } from '@/lib/formatters';
import type { CashSession } from '@/types';

interface CloseSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: CashSession;
  estimatedClosing: number;
  closeSession: (id: string, closingBalance: number) => Promise<void>;
  onClose: () => void;
}

export function CloseSessionDialog({
  open,
  onOpenChange,
  session,
  estimatedClosing,
  closeSession,
  onClose,
}: CloseSessionDialogProps) {
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
