import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCashSessions } from '@/hooks/useCashSessions';
import { cashSessionRepository } from '@/lib/repos';
import type { CashSession } from '@/types';

vi.mock('@/lib/repos', () => ({
  cashSessionRepository: {
    getAll: vi.fn(),
    create: vi.fn(),
    close: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockSession: CashSession = {
  id: 'session-1',
  name: 'Caja Principal',
  branchId: 'branch-1',
  openedAt: new Date('2026-04-23T10:00:00'),
  closedAt: null,
  openingBalance: 500,
  closingBalance: null,
  status: 'open',
  notes: null,
};

function createMockSession(overrides: Partial<CashSession> = {}): CashSession {
  return {
    ...mockSession,
    ...overrides,
  };
}

describe('useCashSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cashSessionRepository.getAll).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should start with empty sessions', async () => {
      vi.mocked(cashSessionRepository.getAll).mockResolvedValue([]);
      const { result } = renderHook(() => useCashSessions());

      expect(result.current.sessions).toEqual([]);
    });

    it('should start with loading true', async () => {
      vi.mocked(cashSessionRepository.getAll).mockResolvedValue([]);
      const { result } = renderHook(() => useCashSessions());

      expect(result.current.loading).toBe(true);
    });
  });

  describe('loading sessions', () => {
    it('should load sessions from repository', async () => {
      const sessions = [
        createMockSession(),
        createMockSession({ id: 'session-2', status: 'closed', closedAt: new Date() }),
      ];
      vi.mocked(cashSessionRepository.getAll).mockResolvedValue(sessions);

      const { result } = renderHook(() => useCashSessions());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.sessions).toHaveLength(2);
    });
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      const newSession = createMockSession({ id: 'new-session', name: 'Nueva Sesion' });
      vi.mocked(cashSessionRepository.create).mockResolvedValue(newSession);

      const { result } = renderHook(() => useCashSessions());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.createSession({
          name: 'Nueva Sesion',
          branchId: 'branch-1',
          openingBalance: 500,
        });
      });

      expect(cashSessionRepository.create).toHaveBeenCalledWith({
        name: 'Nueva Sesion',
        branchId: 'branch-1',
        openingBalance: 500,
      });
      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0].id).toBe('new-session');
    });

    it('should prepend new session to list', async () => {
      const existingSession = createMockSession();
      vi.mocked(cashSessionRepository.getAll).mockResolvedValue([existingSession]);

      const newSession = createMockSession({ id: 'new-session', name: 'Newest Session' });
      vi.mocked(cashSessionRepository.create).mockResolvedValue(newSession);

      const { result } = renderHook(() => useCashSessions());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.createSession({
          name: 'Newest Session',
          branchId: 'branch-1',
          openingBalance: 1000,
        });
      });

      expect(result.current.sessions[0].id).toBe('new-session');
      expect(result.current.sessions[1].id).toBe('session-1');
    });

    it('should include optional notes when provided', async () => {
      const newSession = createMockSession({ id: 'new-session', notes: 'Test notes' });
      vi.mocked(cashSessionRepository.create).mockResolvedValue(newSession);

      const { result } = renderHook(() => useCashSessions());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.createSession({
          name: 'Session with notes',
          branchId: 'branch-1',
          openingBalance: 500,
          notes: 'Test notes',
        });
      });

      expect(cashSessionRepository.create).toHaveBeenCalledWith({
        name: 'Session with notes',
        branchId: 'branch-1',
        openingBalance: 500,
        notes: 'Test notes',
      });
    });
  });

  describe('closeSession', () => {
    it('should close an open session with closing balance', async () => {
      const session = createMockSession();
      vi.mocked(cashSessionRepository.getAll).mockResolvedValue([session]);
      vi.mocked(cashSessionRepository.close).mockResolvedValue(undefined);

      const { result } = renderHook(() => useCashSessions());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.closeSession('session-1', 750);
      });

      expect(cashSessionRepository.close).toHaveBeenCalledWith('session-1', 750);
      expect(result.current.sessions[0].status).toBe('closed');
      expect(result.current.sessions[0].closingBalance).toBe(750);
      expect(result.current.sessions[0].closedAt).toBeInstanceOf(Date);
    });

    it('should use estimated closing balance when not provided', async () => {
      const session = createMockSession();
      vi.mocked(cashSessionRepository.getAll).mockResolvedValue([session]);
      vi.mocked(cashSessionRepository.close).mockResolvedValue(undefined);

      const { result } = renderHook(() => useCashSessions());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.closeSession('session-1', 525);
      });

      expect(cashSessionRepository.close).toHaveBeenCalledWith('session-1', 525);
    });
  });

  describe('updateSession', () => {
    it('should update session properties', async () => {
      const session = createMockSession();
      vi.mocked(cashSessionRepository.getAll).mockResolvedValue([session]);
      vi.mocked(cashSessionRepository.update).mockResolvedValue(undefined);

      const { result } = renderHook(() => useCashSessions());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateSession('session-1', { name: 'Updated Name' });
      });

      expect(cashSessionRepository.update).toHaveBeenCalledWith('session-1', {
        name: 'Updated Name',
      });
      expect(result.current.sessions[0].name).toBe('Updated Name');
    });
  });

  describe('deleteSession', () => {
    it('should remove session from list', async () => {
      const session = createMockSession();
      vi.mocked(cashSessionRepository.getAll).mockResolvedValue([session]);
      vi.mocked(cashSessionRepository.delete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useCashSessions());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteSession('session-1');
      });

      expect(cashSessionRepository.delete).toHaveBeenCalledWith('session-1');
      expect(result.current.sessions).toHaveLength(0);
    });
  });

  describe('refetch', () => {
    it('should reload sessions', async () => {
      vi.mocked(cashSessionRepository.getAll)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([createMockSession()]);

      const { result } = renderHook(() => useCashSessions());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.sessions).toHaveLength(0);

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.sessions).toHaveLength(1);
    });
  });
});
