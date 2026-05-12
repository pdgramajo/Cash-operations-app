import { MovementItem } from './items/MovementItem';
import type { InventoryMovement } from '@/types';

interface MovementListProps {
  movements: InventoryMovement[];
  onDelete?: (id: string) => void;
  canDelete: boolean;
  branches: { id: string; name: string }[];
}

export function MovementList({ movements, onDelete, canDelete, branches }: MovementListProps) {
  return (
    <div className="h-[calc(100vh-380px)] overflow-y-auto pr-4">
      <div className="space-y-2">
        {movements.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay movimientos</p>
        ) : (
          movements.map(m => (
            <MovementItem
              key={m.id}
              movement={m}
              onDelete={canDelete ? () => onDelete?.(m.id) : undefined}
              branches={branches}
            />
          ))
        )}
      </div>
    </div>
  );
}
