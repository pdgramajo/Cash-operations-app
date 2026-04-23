import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInventoryMovements } from '@/hooks/useInventoryMovements';
import { inventoryMovementRepository } from '@/lib/repos';
import type { InventoryMovement } from '@/types';

vi.mock('@/lib/repos', () => ({
  inventoryMovementRepository: {
    getBySession: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockMovement: InventoryMovement = {
  id: 'movement-1',
  sessionId: 'session-1',
  branchId: 'branch-1',
  type: 'incoming',
  description: 'Llegó media res',
  estimatedQuantity: 1,
  unit: 'half',
  targetBranchId: null,
  createdAt: new Date('2026-04-23T10:00:00'),
};

function createMockMovement(overrides: Partial<InventoryMovement> = {}): InventoryMovement {
  return {
    ...mockMovement,
    ...overrides,
  };
}

describe('useInventoryMovements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should start with empty movements when sessionId is provided', async () => {
      vi.mocked(inventoryMovementRepository.getBySession).mockResolvedValue([]);
      const { result } = renderHook(() => useInventoryMovements('session-1'));

      expect(result.current.movements).toEqual([]);
    });

    it('should start with loading true', async () => {
      vi.mocked(inventoryMovementRepository.getBySession).mockResolvedValue([]);
      const { result } = renderHook(() => useInventoryMovements('session-1'));

      expect(result.current.loading).toBe(true);
    });

    it('should handle null sessionId gracefully', () => {
      const { result } = renderHook(() => useInventoryMovements(null));

      expect(result.current.movements).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('loading movements', () => {
    it('should load movements from repository', async () => {
      const movements = [
        createMockMovement(),
        createMockMovement({ id: 'movement-2', type: 'outgoing' }),
      ];
      vi.mocked(inventoryMovementRepository.getBySession).mockResolvedValue(movements);

      const { result } = renderHook(() => useInventoryMovements('session-1'));

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.movements).toHaveLength(2);
    });

    it('should sort movements by createdAt descending', async () => {
      const oldMovement = createMockMovement({
        id: 'old',
        createdAt: new Date('2026-04-23T10:00:00'),
      });
      const newMovement = createMockMovement({
        id: 'new',
        createdAt: new Date('2026-04-23T12:00:00'),
      });
      vi.mocked(inventoryMovementRepository.getBySession).mockResolvedValue([
        oldMovement,
        newMovement,
      ]);

      const { result } = renderHook(() => useInventoryMovements('session-1'));

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.movements[0].id).toBe('new');
      expect(result.current.movements[1].id).toBe('old');
    });
  });

  describe('createMovement', () => {
    it('should create a new incoming movement', async () => {
      const newMovement = createMockMovement({
        id: 'new-movement',
        type: 'incoming',
        description: 'Nueva entrada',
      });
      vi.mocked(inventoryMovementRepository.create).mockResolvedValue(newMovement);
      vi.mocked(inventoryMovementRepository.getBySession).mockResolvedValue([]);

      const { result } = renderHook(() => useInventoryMovements('session-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.createMovement({
          sessionId: 'session-1',
          branchId: 'branch-1',
          type: 'incoming',
          description: 'Nueva entrada',
          estimatedQuantity: 5,
          unit: 'kg',
        });
      });

      expect(inventoryMovementRepository.create).toHaveBeenCalledWith({
        sessionId: 'session-1',
        branchId: 'branch-1',
        type: 'incoming',
        description: 'Nueva entrada',
        estimatedQuantity: 5,
        unit: 'kg',
      });
      expect(result.current.movements).toHaveLength(1);
    });

    it('should create a new outgoing movement', async () => {
      const newMovement = createMockMovement({
        id: 'new-movement',
        type: 'outgoing',
        description: 'Salida de mercaderia',
      });
      vi.mocked(inventoryMovementRepository.create).mockResolvedValue(newMovement);
      vi.mocked(inventoryMovementRepository.getBySession).mockResolvedValue([]);

      const { result } = renderHook(() => useInventoryMovements('session-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.createMovement({
          sessionId: 'session-1',
          branchId: 'branch-1',
          type: 'outgoing',
          description: 'Salida de mercaderia',
        });
      });

      expect(inventoryMovementRepository.create).toHaveBeenCalledWith({
        sessionId: 'session-1',
        branchId: 'branch-1',
        type: 'outgoing',
        description: 'Salida de mercaderia',
      });
    });

    it('should create a transfer movement with target branch', async () => {
      const newMovement = createMockMovement({
        id: 'new-movement',
        type: 'transfer',
        targetBranchId: 'branch-2',
      });
      vi.mocked(inventoryMovementRepository.create).mockResolvedValue(newMovement);
      vi.mocked(inventoryMovementRepository.getBySession).mockResolvedValue([]);

      const { result } = renderHook(() => useInventoryMovements('session-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.createMovement({
          sessionId: 'session-1',
          branchId: 'branch-1',
          type: 'transfer',
          description: 'Transferencia',
          targetBranchId: 'branch-2',
        });
      });

      expect(inventoryMovementRepository.create).toHaveBeenCalledWith({
        sessionId: 'session-1',
        branchId: 'branch-1',
        type: 'transfer',
        description: 'Transferencia',
        targetBranchId: 'branch-2',
      });
    });

    it('should prepend new movement to list', async () => {
      const existingMovement = createMockMovement({ id: 'existing' });
      vi.mocked(inventoryMovementRepository.getBySession).mockResolvedValue([existingMovement]);

      const newMovement = createMockMovement({
        id: 'new-movement',
        createdAt: new Date('2026-04-23T14:00:00'),
      });
      vi.mocked(inventoryMovementRepository.create).mockResolvedValue(newMovement);

      const { result } = renderHook(() => useInventoryMovements('session-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.createMovement({
          sessionId: 'session-1',
          branchId: 'branch-1',
          type: 'incoming',
          description: 'Newest',
        });
      });

      expect(result.current.movements[0].id).toBe('new-movement');
      expect(result.current.movements[1].id).toBe('existing');
    });
  });

  describe('deleteMovement', () => {
    it('should remove movement from list', async () => {
      const movement = createMockMovement();
      vi.mocked(inventoryMovementRepository.getBySession).mockResolvedValue([movement]);
      vi.mocked(inventoryMovementRepository.delete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useInventoryMovements('session-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteMovement('movement-1');
      });

      expect(inventoryMovementRepository.delete).toHaveBeenCalledWith('movement-1');
      expect(result.current.movements).toHaveLength(0);
    });

    it('should not affect other movements', async () => {
      const movements = [createMockMovement(), createMockMovement({ id: 'movement-2' })];
      vi.mocked(inventoryMovementRepository.getBySession).mockResolvedValue(movements);
      vi.mocked(inventoryMovementRepository.delete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useInventoryMovements('session-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteMovement('movement-1');
      });

      expect(result.current.movements).toHaveLength(1);
      expect(result.current.movements[0].id).toBe('movement-2');
    });
  });

  describe('refetch', () => {
    it('should reload movements', async () => {
      vi.mocked(inventoryMovementRepository.getBySession)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([createMockMovement()]);

      const { result } = renderHook(() => useInventoryMovements('session-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.movements).toHaveLength(0);

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.movements).toHaveLength(1);
    });
  });
});
