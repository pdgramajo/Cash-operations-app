import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface TransactionActionsProps {
  onOpenTransactionDialog: (type: 'sale' | 'expense' | 'cash_withdrawal') => void;
}

export function TransactionActions({ onOpenTransactionDialog }: TransactionActionsProps) {
  return (
    <div className="grid grid-cols-3 gap-1 mb-3">
      <Button
        variant="outline"
        size="sm"
        className="text-xs py-1 h-7"
        onClick={() => onOpenTransactionDialog('sale')}
      >
        <Plus className="h-3 w-3 mr-1" />
        Venta
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-xs py-1 h-7"
        onClick={() => onOpenTransactionDialog('expense')}
      >
        <Plus className="h-3 w-3 mr-1" />
        Gasto
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-xs py-1 h-7"
        onClick={() => onOpenTransactionDialog('cash_withdrawal')}
      >
        <Plus className="h-3 w-3 mr-1" />
        Retiro
      </Button>
    </div>
  );
}
