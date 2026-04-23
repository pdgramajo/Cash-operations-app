import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBranches } from '@/hooks/useBranches';
import { branchRepository } from '@/lib/repos';
import type { Branch } from '@/types';

vi.mock('@/lib/repos', () => ({
  branchRepository: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockBranch: Branch = {
  id: 'branch-1',
  name: 'Sucursal Central',
  createdAt: new Date('2026-04-01'),
};

function createMockBranch(overrides: Partial<Branch> = {}): Branch {
  return {
    ...mockBranch,
    ...overrides,
  };
}

describe('useBranches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(branchRepository.getAll).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should start with empty branches', async () => {
      vi.mocked(branchRepository.getAll).mockResolvedValue([]);
      const { result } = renderHook(() => useBranches());

      expect(result.current.branches).toEqual([]);
    });

    it('should start with loading true', async () => {
      vi.mocked(branchRepository.getAll).mockResolvedValue([]);
      const { result } = renderHook(() => useBranches());

      expect(result.current.loading).toBe(true);
    });
  });

  describe('loading branches', () => {
    it('should load branches from repository', async () => {
      const branches = [
        createMockBranch(),
        createMockBranch({ id: 'branch-2', name: 'Sucursal Norte' }),
      ];
      vi.mocked(branchRepository.getAll).mockResolvedValue(branches);

      const { result } = renderHook(() => useBranches());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.branches).toHaveLength(2);
    });
  });

  describe('createBranch', () => {
    it('should create a new branch', async () => {
      const newBranch = createMockBranch({ id: 'new-branch', name: 'Nueva Sucursal' });
      vi.mocked(branchRepository.create).mockResolvedValue(newBranch);

      const { result } = renderHook(() => useBranches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.createBranch('Nueva Sucursal');
      });

      expect(branchRepository.create).toHaveBeenCalledWith('Nueva Sucursal');
      expect(result.current.branches).toHaveLength(1);
      expect(result.current.branches[0].name).toBe('Nueva Sucursal');
    });

    it('should add new branch to list', async () => {
      const existingBranch = createMockBranch();
      vi.mocked(branchRepository.getAll).mockResolvedValue([existingBranch]);

      const newBranch = createMockBranch({ id: 'new-branch', name: 'Second Branch' });
      vi.mocked(branchRepository.create).mockResolvedValue(newBranch);

      const { result } = renderHook(() => useBranches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.createBranch('Second Branch');
      });

      expect(result.current.branches).toHaveLength(2);
    });
  });

  describe('updateBranch', () => {
    it('should update branch name', async () => {
      const branch = createMockBranch();
      vi.mocked(branchRepository.getAll).mockResolvedValue([branch]);
      vi.mocked(branchRepository.update).mockResolvedValue(undefined);

      const { result } = renderHook(() => useBranches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateBranch('branch-1', 'Nombre Actualizado');
      });

      expect(branchRepository.update).toHaveBeenCalledWith('branch-1', 'Nombre Actualizado');
      expect(result.current.branches[0].name).toBe('Nombre Actualizado');
    });

    it('should only update the specified branch', async () => {
      const branches = [createMockBranch(), createMockBranch({ id: 'branch-2', name: 'Branch 2' })];
      vi.mocked(branchRepository.getAll).mockResolvedValue(branches);
      vi.mocked(branchRepository.update).mockResolvedValue(undefined);

      const { result } = renderHook(() => useBranches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateBranch('branch-1', 'Updated Branch 1');
      });

      expect(result.current.branches[0].name).toBe('Updated Branch 1');
      expect(result.current.branches[1].name).toBe('Branch 2');
    });
  });

  describe('deleteBranch', () => {
    it('should remove branch from list', async () => {
      const branch = createMockBranch();
      vi.mocked(branchRepository.getAll).mockResolvedValue([branch]);
      vi.mocked(branchRepository.delete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useBranches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteBranch('branch-1');
      });

      expect(branchRepository.delete).toHaveBeenCalledWith('branch-1');
      expect(result.current.branches).toHaveLength(0);
    });

    it('should not affect other branches', async () => {
      const branches = [createMockBranch(), createMockBranch({ id: 'branch-2', name: 'Branch 2' })];
      vi.mocked(branchRepository.getAll).mockResolvedValue(branches);
      vi.mocked(branchRepository.delete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useBranches());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteBranch('branch-1');
      });

      expect(result.current.branches).toHaveLength(1);
      expect(result.current.branches[0].id).toBe('branch-2');
    });
  });

  describe('refetch', () => {
    it('should reload branches', async () => {
      vi.mocked(branchRepository.getAll)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([createMockBranch()]);

      const { result } = renderHook(() => useBranches());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.branches).toHaveLength(0);

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.branches).toHaveLength(1);
    });
  });
});
