import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { formatDateTime, getMovementTypeLabel, getMovementUnitLabel } from '@/lib/formatters';
import type { InventoryMovement } from '@/types';

interface MovementItemProps {
  movement: InventoryMovement;
  onDelete?: () => void;
  branches: { id: string; name: string }[];
}

export function MovementItem({ movement, onDelete, branches }: MovementItemProps) {
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
