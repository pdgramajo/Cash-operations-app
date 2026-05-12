import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface MovementActionsProps {
  onOpenMovementDialog: (type: 'incoming' | 'outgoing' | 'transfer') => void;
}

export function MovementActions({ onOpenMovementDialog }: MovementActionsProps) {
  return (
    <div className="grid grid-cols-3 gap-1 mb-3">
      <Button
        variant="outline"
        size="sm"
        className="text-xs py-1 h-7"
        onClick={() => onOpenMovementDialog('incoming')}
      >
        <Plus className="h-3 w-3 mr-1" />
        Entrada
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-xs py-1 h-7"
        onClick={() => onOpenMovementDialog('outgoing')}
      >
        <Plus className="h-3 w-3 mr-1" />
        Salida
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-xs py-1 h-7"
        onClick={() => onOpenMovementDialog('transfer')}
      >
        <Plus className="h-3 w-3 mr-1" />
        Transferir
      </Button>
    </div>
  );
}
