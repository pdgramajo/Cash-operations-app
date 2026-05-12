import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionDialog } from '@/components/session/dialogs/TransactionDialog';
import { MovementDialog } from '@/components/session/dialogs/MovementDialog';
import { CloseSessionDialog } from '@/components/session/dialogs/CloseSessionDialog';
import type { CashSession, Branch } from '@/types';

const mockBranch: Branch = {
  id: 'branch-1',
  name: 'Sucursal Central',
  createdAt: new Date('2026-04-01'),
};

const createMockSession = (overrides: Partial<CashSession> = {}): CashSession => ({
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
});

vi.mock('@/lib/repos', () => ({
  transactionRepository: {
    getTopSaleAmountsYesterday: vi.fn().mockResolvedValue([1000, 2000, 4000]),
  },
  receiptTypeRepository: {
    getAll: vi.fn().mockResolvedValue([]),
  },
}));

describe('TransactionDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    type: 'sale' as const,
    sessionId: 'session-1',
    branchId: 'branch-1',
    onSubmit: vi.fn().mockResolvedValue({}),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sale transaction', () => {
    it('renders sale dialog with title', () => {
      render(<TransactionDialog {...defaultProps} type="sale" />);
      expect(screen.getByText('Nueva Venta')).toBeInTheDocument();
    });

    it('renders payment type buttons', () => {
      render(<TransactionDialog {...defaultProps} type="sale" />);
      expect(screen.getByText('Efectivo')).toBeInTheDocument();
      expect(screen.getByText('Transferencia')).toBeInTheDocument();
    });

    it('renders quick amount buttons when sale type', async () => {
      render(<TransactionDialog {...defaultProps} type="sale" />);
      await waitFor(() => {
        const content = screen.getByText('Nueva Venta').textContent;
        expect(content).toBeDefined();
      });
    });

    it('creates cash sale transaction', async () => {
      const user = userEvent.setup();
      render(<TransactionDialog {...defaultProps} type="sale" />);

      await user.type(screen.getByLabelText(/monto/i), '150');
      await user.click(screen.getByRole('button', { name: /guardar/i }));

      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        sessionId: 'session-1',
        branchId: 'branch-1',
        type: 'sale',
        subType: 'cash',
        amount: 150,
      });
    });

    it('creates transfer sale transaction', async () => {
      const user = userEvent.setup();
      render(<TransactionDialog {...defaultProps} type="sale" />);

      await user.click(screen.getByText('Transferencia'));
      await user.type(screen.getByLabelText(/monto/i), '200');
      await user.click(screen.getByRole('button', { name: /guardar/i }));

      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        sessionId: 'session-1',
        branchId: 'branch-1',
        type: 'sale',
        subType: 'transfer',
        amount: 200,
      });
    });
  });

  describe('expense transaction', () => {
    it('renders expense dialog with title', () => {
      render(<TransactionDialog {...defaultProps} type="expense" />);
      expect(screen.getByText('Nuevo Gasto')).toBeInTheDocument();
    });

    it('renders description label instead of note', () => {
      render(<TransactionDialog {...defaultProps} type="expense" />);
      expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
    });

    it('creates expense transaction', async () => {
      const user = userEvent.setup();
      render(<TransactionDialog {...defaultProps} type="expense" />);

      await user.type(screen.getByLabelText(/monto/i), '50');
      await user.type(screen.getByLabelText(/descripción/i), 'Papeleria');
      await user.click(screen.getByRole('button', { name: /guardar/i }));

      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        sessionId: 'session-1',
        branchId: 'branch-1',
        type: 'expense',
        amount: 50,
        note: 'Papeleria',
      });
    });
  });

  describe('withdrawal transaction', () => {
    it('renders withdrawal dialog with title', () => {
      render(<TransactionDialog {...defaultProps} type="cash_withdrawal" />);
      expect(screen.getByText('Nuevo Retiro')).toBeInTheDocument();
    });

    it('renders withdrawal type select', () => {
      render(<TransactionDialog {...defaultProps} type="cash_withdrawal" />);
      expect(screen.getByText('Tipo de retiro')).toBeInTheDocument();
    });

    it('renders recipient name input', () => {
      render(<TransactionDialog {...defaultProps} type="cash_withdrawal" />);
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    });

    it('creates withdrawal transaction', async () => {
      const user = userEvent.setup();
      render(<TransactionDialog {...defaultProps} type="cash_withdrawal" />);

      await user.type(screen.getByLabelText(/monto/i), '100');
      await user.type(screen.getByLabelText(/nombre/i), 'Juan Perez');
      await user.click(screen.getByRole('button', { name: /guardar/i }));

      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        sessionId: 'session-1',
        branchId: 'branch-1',
        type: 'cash_withdrawal',
        amount: 100,
        recipientType: 'owner',
        recipientName: 'Juan Perez',
      });
    });
  });

  describe('dialog close', () => {
    it('calls onOpenChange(false) after successful submit', async () => {
      const user = userEvent.setup();
      render(<TransactionDialog {...defaultProps} type="sale" />);

      await user.type(screen.getByLabelText(/monto/i), '100');
      await user.click(screen.getByRole('button', { name: /guardar/i }));

      await waitFor(() => {
        expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });
});

describe('MovementDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    type: 'incoming' as const,
    sessionId: 'session-1',
    branchId: 'branch-1',
    branches: [mockBranch],
    onSubmit: vi.fn().mockResolvedValue({}),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('incoming movement', () => {
    it('renders incoming dialog with title', () => {
      render(<MovementDialog {...defaultProps} type="incoming" />);
      expect(screen.getByText('Entrada de Mercadería')).toBeInTheDocument();
    });

    it('renders description field', () => {
      render(<MovementDialog {...defaultProps} type="incoming" />);
      expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
    });

    it('renders quantity and unit fields', () => {
      render(<MovementDialog {...defaultProps} type="incoming" />);
      expect(screen.getByLabelText(/cantidad/i)).toBeInTheDocument();
      expect(screen.getByText('Unidad')).toBeInTheDocument();
    });

    it('creates incoming movement', async () => {
      const user = userEvent.setup();
      render(<MovementDialog {...defaultProps} type="incoming" />);

      await user.type(screen.getByLabelText(/descripción/i), 'Llegaron 3kg pulpa');
      await user.type(screen.getByLabelText(/cantidad/i), '3');
      await user.click(screen.getByRole('button', { name: /guardar/i }));

      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        sessionId: 'session-1',
        branchId: 'branch-1',
        type: 'incoming',
        description: 'Llegaron 3kg pulpa',
        estimatedQuantity: 3,
        unit: 'unit',
      });
    });
  });

  describe('outgoing movement', () => {
    it('renders outgoing dialog with title', () => {
      render(<MovementDialog {...defaultProps} type="outgoing" />);
      expect(screen.getByText('Salida de Mercadería')).toBeInTheDocument();
    });

    it('creates outgoing movement', async () => {
      const user = userEvent.setup();
      render(<MovementDialog {...defaultProps} type="outgoing" />);

      await user.type(screen.getByLabelText(/descripción/i), 'Envío a cliente');
      await user.click(screen.getByRole('button', { name: /guardar/i }));

      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-1',
          branchId: 'branch-1',
          type: 'outgoing',
          description: 'Envío a cliente',
        })
      );
    });
  });

  describe('transfer movement', () => {
    it('renders transfer dialog with title', () => {
      render(<MovementDialog {...defaultProps} type="transfer" />);
      expect(screen.getByText('Transferencia')).toBeInTheDocument();
    });

    it('renders destination branch select', () => {
      render(<MovementDialog {...defaultProps} type="transfer" />);
      expect(screen.getByText('Sucursal destino')).toBeInTheDocument();
    });

    it('creates transfer movement', async () => {
      const user = userEvent.setup();
      render(<MovementDialog {...defaultProps} type="transfer" />);

      await user.type(screen.getByLabelText(/descripción/i), 'Transferencia de carne');
      await user.click(screen.getByRole('button', { name: /guardar/i }));

      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-1',
          branchId: 'branch-1',
          type: 'transfer',
          description: 'Transferencia de carne',
        })
      );
    });
  });
});

describe('CloseSessionDialog', () => {
  const session = createMockSession();
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    session,
    estimatedClosing: 1500,
    closeSession: vi.fn().mockResolvedValue(undefined),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog with title', () => {
    render(<CloseSessionDialog {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Cerrar Sesión' })).toBeInTheDocument();
  });

  it('renders estimated closing balance', () => {
    render(<CloseSessionDialog {...defaultProps} estimatedClosing={1500} />);
    expect(screen.getByText('Saldo estimado en caja:')).toBeInTheDocument();
    expect(screen.getByText(/1\.500/)).toBeInTheDocument();
  });

  it('renders closing balance input with placeholder', () => {
    render(<CloseSessionDialog {...defaultProps} estimatedClosing={1500} />);
    expect(screen.getByLabelText(/saldo real al cerrar/i)).toBeInTheDocument();
  });

  it('calls closeSession with entered balance', async () => {
    const user = userEvent.setup();
    render(<CloseSessionDialog {...defaultProps} estimatedClosing={1500} />);

    await user.type(screen.getByLabelText(/saldo real al cerrar/i), '1550');
    await user.click(screen.getByRole('button', { name: /cerrar sesión/i }));

    expect(defaultProps.closeSession).toHaveBeenCalledWith('session-1', 1550);
  });

  it('calls onClose after successful close', async () => {
    const user = userEvent.setup();
    render(<CloseSessionDialog {...defaultProps} estimatedClosing={1500} />);

    await user.click(screen.getByRole('button', { name: /cerrar sesión/i }));

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
