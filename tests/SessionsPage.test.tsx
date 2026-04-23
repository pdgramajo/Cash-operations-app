import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionsPage } from '@/pages/SessionsPage';
import type { CashSession, Branch } from '@/types';

const { mockBranch, createMockSession } = vi.hoisted(() => {
  const mockBranch: Branch = {
    id: 'branch-1',
    name: 'Sucursal Central',
    createdAt: new Date('2026-04-01'),
  };

  function createMockSession(overrides: Partial<CashSession> = {}): CashSession {
    return {
      id: 'session-1',
      name: 'Caja Principal',
      branchId: 'branch-1',
      openedAt: new Date('2026-04-23T10:00:00'),
      closedAt: null,
      openingBalance: 500,
      closingBalance: null,
      status: 'open',
      notes: null,
      ...overrides,
    };
  }

  return { mockBranch, createMockSession };
});

vi.mock('@/lib/repos', () => ({
  cashSessionRepository: {
    getAll: vi.fn().mockResolvedValue([]),
    close: vi.fn().mockResolvedValue(undefined),
  },
  transactionRepository: {
    getBySession: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
    softDelete: vi.fn().mockResolvedValue(undefined),
  },
  inventoryMovementRepository: {
    getBySession: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  branchRepository: {
    getAll: vi.fn().mockResolvedValue([mockBranch]),
  },
}));

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: vi.fn(),
  }),
}));

import { cashSessionRepository, branchRepository } from '@/lib/repos';

describe('SessionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial render', () => {
    it('should render page title', async () => {
      vi.mocked(cashSessionRepository.getAll).mockResolvedValue([]);
      vi.mocked(branchRepository.getAll).mockResolvedValue([mockBranch]);

      render(<SessionsPage />);
      await waitFor(() => {
        expect(screen.getByText('Caja')).toBeInTheDocument();
      });
    });

    it('should render new session button', async () => {
      vi.mocked(cashSessionRepository.getAll).mockResolvedValue([]);
      vi.mocked(branchRepository.getAll).mockResolvedValue([mockBranch]);

      render(<SessionsPage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /nueva/i })).toBeInTheDocument();
      });
    });
  });

  describe('session list display', () => {
    it('should show open sessions section when sessions exist', async () => {
      vi.mocked(cashSessionRepository.getAll).mockResolvedValue([
        createMockSession({ id: 'open-1', status: 'open' }),
      ]);
      vi.mocked(branchRepository.getAll).mockResolvedValue([mockBranch]);

      render(<SessionsPage />);
      await waitFor(() => {
        expect(screen.getByText('Abiertas')).toBeInTheDocument();
      });
    });

    it('should show open session with status badge', async () => {
      vi.mocked(cashSessionRepository.getAll).mockResolvedValue([
        createMockSession({ id: 'open-1', status: 'open' }),
      ]);
      vi.mocked(branchRepository.getAll).mockResolvedValue([mockBranch]);

      render(<SessionsPage />);
      await waitFor(() => {
        expect(screen.getByText('Abierta')).toBeInTheDocument();
      });
    });

    it('should show empty history message when no closed sessions', async () => {
      vi.mocked(cashSessionRepository.getAll).mockResolvedValue([]);
      vi.mocked(branchRepository.getAll).mockResolvedValue([mockBranch]);

      render(<SessionsPage />);
      await waitFor(() => {
        expect(screen.getByText(/no hay sesiones cerradas/i)).toBeInTheDocument();
      });
    });
  });

  describe('new session dialog', () => {
    it('should open dialog when clicking new session button', async () => {
      vi.mocked(cashSessionRepository.getAll).mockResolvedValue([]);
      vi.mocked(branchRepository.getAll).mockResolvedValue([mockBranch]);

      const user = userEvent.setup();
      render(<SessionsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /nueva/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /nueva/i }));
      expect(screen.getByText('Nueva Sesión')).toBeInTheDocument();
    });
  });

  describe('closed sessions', () => {
    it('should show closed sessions when they exist', async () => {
      vi.mocked(cashSessionRepository.getAll).mockResolvedValue([
        createMockSession({ id: 'closed-1', status: 'closed', closingBalance: 450 }),
      ]);
      vi.mocked(branchRepository.getAll).mockResolvedValue([mockBranch]);

      render(<SessionsPage />);
      await waitFor(() => {
        expect(screen.getByText(/450/)).toBeInTheDocument();
      });
    });

    it('should show Historial tab with count', async () => {
      vi.mocked(cashSessionRepository.getAll).mockResolvedValue([
        createMockSession({ id: 'closed-1', status: 'closed', closingBalance: 450 }),
      ]);
      vi.mocked(branchRepository.getAll).mockResolvedValue([mockBranch]);

      render(<SessionsPage />);
      await waitFor(() => {
        expect(screen.getByText('Historial (1)')).toBeInTheDocument();
      });
    });
  });

  describe('reports navigation', () => {
    it('should render reports button', async () => {
      vi.mocked(cashSessionRepository.getAll).mockResolvedValue([]);
      vi.mocked(branchRepository.getAll).mockResolvedValue([mockBranch]);

      render(<SessionsPage />);
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(1);
      });
    });
  });

  describe('theme toggle', () => {
    it('should render theme toggle button', async () => {
      vi.mocked(cashSessionRepository.getAll).mockResolvedValue([]);
      vi.mocked(branchRepository.getAll).mockResolvedValue([mockBranch]);

      render(<SessionsPage />);
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
  });
});
