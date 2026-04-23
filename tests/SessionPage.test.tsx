import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionPage } from '@/pages/SessionPage';
import type { CashSession, Branch, Transaction, InventoryMovement } from '@/types';

const { mockBranch, createMockSession, createMockTransaction, createMockMovement } = vi.hoisted(
  () => {
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

    function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
      return {
        id: 'tx-1',
        sessionId: 'session-1',
        branchId: 'branch-1',
        type: 'sale',
        subType: 'cash',
        amount: 100,
        note: null,
        createdAt: new Date('2026-04-23T10:30:00'),
        isDeleted: false,
        ...overrides,
      };
    }

    function createMockMovement(overrides: Partial<InventoryMovement> = {}): InventoryMovement {
      return {
        id: 'mov-1',
        sessionId: 'session-1',
        branchId: 'branch-1',
        type: 'incoming',
        description: 'Llegó media res',
        estimatedQuantity: 1,
        unit: 'half',
        targetBranchId: null,
        createdAt: new Date('2026-04-23T10:30:00'),
        ...overrides,
      };
    }

    return { mockBranch, createMockSession, createMockTransaction, createMockMovement };
  }
);

vi.mock('@/lib/repos', () => ({
  cashSessionRepository: {
    getAll: vi.fn().mockResolvedValue([]),
    close: vi.fn().mockResolvedValue(undefined),
  },
  transactionRepository: {
    getBySession: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(createMockTransaction()),
    softDelete: vi.fn().mockResolvedValue(undefined),
  },
  inventoryMovementRepository: {
    getBySession: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(createMockMovement()),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  branchRepository: {
    getAll: vi.fn().mockResolvedValue([mockBranch]),
  },
}));

import { transactionRepository, inventoryMovementRepository } from '@/lib/repos';

describe('SessionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial render', () => {
    it('should render session header with name', () => {
      const session = createMockSession();
      render(
        <SessionPage
          session={session}
          onBack={vi.fn()}
          branches={[mockBranch]}
          onShowReports={vi.fn()}
        />
      );

      expect(screen.getByText('Caja Principal')).toBeInTheDocument();
    });

    it('should render summary cards', () => {
      const session = createMockSession();
      render(
        <SessionPage
          session={session}
          onBack={vi.fn()}
          branches={[mockBranch]}
          onShowReports={vi.fn()}
        />
      );

      expect(screen.getByText('Efectivo')).toBeInTheDocument();
      expect(screen.getByText('Transferencias')).toBeInTheDocument();
      expect(screen.getByText('Total Ventas')).toBeInTheDocument();
      expect(screen.getByText('Dinero Caja')).toBeInTheDocument();
    });
  });

  describe('open session UI', () => {
    it('should show action buttons for open session', () => {
      const session = createMockSession({ status: 'open' });
      render(
        <SessionPage
          session={session}
          onBack={vi.fn()}
          branches={[mockBranch]}
          onShowReports={vi.fn()}
        />
      );

      expect(screen.getByText('Venta')).toBeInTheDocument();
      expect(screen.getByText('Gasto')).toBeInTheDocument();
      expect(screen.getByText('Retiro')).toBeInTheDocument();
    });

    it('should show close button for open session', () => {
      const session = createMockSession({ status: 'open' });
      render(
        <SessionPage
          session={session}
          onBack={vi.fn()}
          branches={[mockBranch]}
          onShowReports={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /cerrar/i })).toBeInTheDocument();
    });

    it('should not show action buttons for closed session', () => {
      const session = createMockSession({ status: 'closed', closedAt: new Date() });
      render(
        <SessionPage
          session={session}
          onBack={vi.fn()}
          branches={[mockBranch]}
          onShowReports={vi.fn()}
        />
      );

      expect(screen.queryByText('Venta')).not.toBeInTheDocument();
      expect(screen.queryByText('Gasto')).not.toBeInTheDocument();
      expect(screen.queryByText('Retiro')).not.toBeInTheDocument();
    });
  });

  describe('new sale dialog', () => {
    it('should open sale dialog when clicking venta button', async () => {
      const user = userEvent.setup();
      const session = createMockSession({ status: 'open' });
      render(
        <SessionPage
          session={session}
          onBack={vi.fn()}
          branches={[mockBranch]}
          onShowReports={vi.fn()}
        />
      );

      await user.click(screen.getByText('Venta'));
      expect(screen.getByText('Nueva Venta')).toBeInTheDocument();
    });

    it('should create cash sale transaction', async () => {
      const user = userEvent.setup();
      vi.mocked(transactionRepository.create).mockResolvedValue(
        createMockTransaction({ amount: 150 })
      );

      const session = createMockSession({ status: 'open' });
      render(
        <SessionPage
          session={session}
          onBack={vi.fn()}
          branches={[mockBranch]}
          onShowReports={vi.fn()}
        />
      );

      await user.click(screen.getByText('Venta'));
      await user.type(screen.getByLabelText(/monto/i), '150');
      await user.click(screen.getByRole('button', { name: /guardar/i }));

      expect(transactionRepository.create).toHaveBeenCalledWith({
        sessionId: 'session-1',
        branchId: 'branch-1',
        type: 'sale',
        subType: 'cash',
        amount: 150,
      });
    });
  });

  describe('new expense dialog', () => {
    it('should open expense dialog when clicking gasto button', async () => {
      const user = userEvent.setup();
      const session = createMockSession({ status: 'open' });
      render(
        <SessionPage
          session={session}
          onBack={vi.fn()}
          branches={[mockBranch]}
          onShowReports={vi.fn()}
        />
      );

      await user.click(screen.getByText('Gasto'));
      expect(screen.getByText('Nuevo Gasto')).toBeInTheDocument();
    });

    it('should create expense transaction', async () => {
      const user = userEvent.setup();
      vi.mocked(transactionRepository.create).mockResolvedValue(
        createMockTransaction({ type: 'expense', amount: 50 })
      );

      const session = createMockSession({ status: 'open' });
      render(
        <SessionPage
          session={session}
          onBack={vi.fn()}
          branches={[mockBranch]}
          onShowReports={vi.fn()}
        />
      );

      await user.click(screen.getByText('Gasto'));
      await user.type(screen.getByLabelText(/monto/i), '50');
      await user.type(screen.getByLabelText(/descripción/i), 'Papeleria');
      await user.click(screen.getByRole('button', { name: /guardar/i }));

      expect(transactionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-1',
          type: 'expense',
          amount: 50,
        })
      );
    });
  });

  describe('new withdrawal dialog', () => {
    it('should open withdrawal dialog when clicking retiro button', async () => {
      const user = userEvent.setup();
      const session = createMockSession({ status: 'open' });
      render(
        <SessionPage
          session={session}
          onBack={vi.fn()}
          branches={[mockBranch]}
          onShowReports={vi.fn()}
        />
      );

      await user.click(screen.getByText('Retiro'));
      expect(screen.getByText('Nuevo Retiro')).toBeInTheDocument();
    });

    it('should create withdrawal transaction', async () => {
      const user = userEvent.setup();
      vi.mocked(transactionRepository.create).mockResolvedValue(
        createMockTransaction({ type: 'cash_withdrawal', amount: 100 })
      );

      const session = createMockSession({ status: 'open' });
      render(
        <SessionPage
          session={session}
          onBack={vi.fn()}
          branches={[mockBranch]}
          onShowReports={vi.fn()}
        />
      );

      await user.click(screen.getByText('Retiro'));
      await user.type(screen.getByLabelText(/monto/i), '100');
      await user.click(screen.getByRole('button', { name: /guardar/i }));

      expect(transactionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-1',
          branchId: 'branch-1',
          type: 'cash_withdrawal',
          amount: 100,
        })
      );
    });
  });

  describe('inventory management', () => {
    it('should switch to inventory tab', async () => {
      const user = userEvent.setup();
      const session = createMockSession({ status: 'open' });
      render(
        <SessionPage
          session={session}
          onBack={vi.fn()}
          branches={[mockBranch]}
          onShowReports={vi.fn()}
        />
      );

      await user.click(screen.getByRole('tab', { name: /inventario/i }));
      expect(screen.getByText('Entrada')).toBeInTheDocument();
      expect(screen.getByText('Salida')).toBeInTheDocument();
      expect(screen.getByText('Transferir')).toBeInTheDocument();
    });

    it('should create incoming movement', async () => {
      const user = userEvent.setup();
      vi.mocked(inventoryMovementRepository.create).mockResolvedValue(
        createMockMovement({ type: 'incoming' })
      );

      const session = createMockSession({ status: 'open' });
      render(
        <SessionPage
          session={session}
          onBack={vi.fn()}
          branches={[mockBranch]}
          onShowReports={vi.fn()}
        />
      );

      await user.click(screen.getByRole('tab', { name: /inventario/i }));
      await user.click(screen.getByText('Entrada'));
      await user.type(screen.getByLabelText(/descripción/i), 'Llegaron 3kg pulpa');
      await user.click(screen.getByRole('button', { name: /guardar/i }));

      expect(inventoryMovementRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-1',
          branchId: 'branch-1',
          type: 'incoming',
          description: 'Llegaron 3kg pulpa',
        })
      );
    });
  });

  describe('close session', () => {
    it('should open close dialog when clicking cerrar', async () => {
      const user = userEvent.setup();
      const session = createMockSession({ status: 'open' });
      render(
        <SessionPage
          session={session}
          onBack={vi.fn()}
          branches={[mockBranch]}
          onShowReports={vi.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: /cerrar/i }));
      expect(screen.getAllByText('Cerrar Sesión').length).toBeGreaterThan(0);
    });
  });

  describe('delete transaction', () => {
    it('should show delete button for transactions', async () => {
      const tx = createMockTransaction();
      vi.mocked(transactionRepository.getBySession).mockResolvedValue([tx]);

      const session = createMockSession({ status: 'open' });
      render(
        <SessionPage
          session={session}
          onBack={vi.fn()}
          branches={[mockBranch]}
          onShowReports={vi.fn()}
        />
      );

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button');
        const deleteButton = deleteButtons.find(btn => btn.textContent === '');
        expect(deleteButton).toBeInTheDocument();
      });
    });
  });
});
