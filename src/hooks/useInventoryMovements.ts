import { useState, useCallback, useEffect } from 'react';
import { inventoryMovementRepository } from '@/lib/repos';
import type { InventoryMovement } from '@/types';

export function useInventoryMovements(sessionId: string | null) {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMovements = useCallback(async () => {
    if (!sessionId) {
      setMovements([]);
      setLoading(false);
      return;
    }
    const data = await inventoryMovementRepository.getBySession(sessionId);
    setMovements(data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMovements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const createMovement = useCallback(
    async (data: {
      sessionId: string;
      branchId: string | null;
      type: InventoryMovement['type'];
      description: string;
      receiptType?: string;
      estimatedQuantity?: number;
      unit?: InventoryMovement['unit'];
      targetBranchId?: string;
    }) => {
      const movement = await inventoryMovementRepository.create(data);
      setMovements(prev => [movement, ...prev]);
      return movement;
    },
    []
  );

  const deleteMovement = useCallback(async (id: string) => {
    await inventoryMovementRepository.delete(id);
    setMovements(prev => prev.filter(m => m.id !== id));
  }, []);

  return {
    movements,
    loading,
    createMovement,
    deleteMovement,
    refetch: fetchMovements,
  };
}
