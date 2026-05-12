import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SessionStats } from '@/components/session/SessionStats';
import { SessionHeader } from '@/components/session/SessionHeader';
import { TransactionActions } from '@/components/session/TransactionActions';
import { MovementActions } from '@/components/session/MovementActions';
import { TransactionFilters } from '@/components/session/TransactionFilters';
import { TransactionItem } from '@/components/session/items/TransactionItem';
import { MovementItem } from '@/components/session/items/MovementItem';
import type { CashSession, Branch, Transaction, InventoryMovement } from '@/types';

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

const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
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
});

const createMockMovement = (overrides: Partial<InventoryMovement> = {}): InventoryMovement => ({
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
});

describe('SessionStats', () => {
  it('renders all four stat cards with correct labels', () => {
    render(
      <SessionStats cashSales={100} transferSales={200} totalSales={300} dineroEnCaja={400} />
    );

    expect(screen.getByText('Efectivo')).toBeInTheDocument();
    expect(screen.getByText('Transferencias')).toBeInTheDocument();
    expect(screen.getByText('Total Ventas')).toBeInTheDocument();
    expect(screen.getByText('Dinero Caja')).toBeInTheDocument();
  });
});

describe('TransactionActions', () => {
  it('renders all action buttons', () => {
    const onOpenTransactionDialog = vi.fn();
    render(<TransactionActions onOpenTransactionDialog={onOpenTransactionDialog} />);

    expect(screen.getByText('Venta')).toBeInTheDocument();
    expect(screen.getByText('Gasto')).toBeInTheDocument();
    expect(screen.getByText('Retiro')).toBeInTheDocument();
  });

  it('calls onOpenTransactionDialog with sale when venta clicked', async () => {
    const user = userEvent.setup();
    const onOpenTransactionDialog = vi.fn();
    render(<TransactionActions onOpenTransactionDialog={onOpenTransactionDialog} />);

    await user.click(screen.getByText('Venta'));
    expect(onOpenTransactionDialog).toHaveBeenCalledWith('sale');
  });

  it('calls onOpenTransactionDialog with expense when gasto clicked', async () => {
    const user = userEvent.setup();
    const onOpenTransactionDialog = vi.fn();
    render(<TransactionActions onOpenTransactionDialog={onOpenTransactionDialog} />);

    await user.click(screen.getByText('Gasto'));
    expect(onOpenTransactionDialog).toHaveBeenCalledWith('expense');
  });

  it('calls onOpenTransactionDialog with cash_withdrawal when retiro clicked', async () => {
    const user = userEvent.setup();
    const onOpenTransactionDialog = vi.fn();
    render(<TransactionActions onOpenTransactionDialog={onOpenTransactionDialog} />);

    await user.click(screen.getByText('Retiro'));
    expect(onOpenTransactionDialog).toHaveBeenCalledWith('cash_withdrawal');
  });
});

describe('MovementActions', () => {
  it('renders all action buttons', () => {
    const onOpenMovementDialog = vi.fn();
    render(<MovementActions onOpenMovementDialog={onOpenMovementDialog} />);

    expect(screen.getByText('Entrada')).toBeInTheDocument();
    expect(screen.getByText('Salida')).toBeInTheDocument();
    expect(screen.getByText('Transferir')).toBeInTheDocument();
  });

  it('calls onOpenMovementDialog with incoming when entrada clicked', async () => {
    const user = userEvent.setup();
    const onOpenMovementDialog = vi.fn();
    render(<MovementActions onOpenMovementDialog={onOpenMovementDialog} />);

    await user.click(screen.getByText('Entrada'));
    expect(onOpenMovementDialog).toHaveBeenCalledWith('incoming');
  });

  it('calls onOpenMovementDialog with outgoing when salida clicked', async () => {
    const user = userEvent.setup();
    const onOpenMovementDialog = vi.fn();
    render(<MovementActions onOpenMovementDialog={onOpenMovementDialog} />);

    await user.click(screen.getByText('Salida'));
    expect(onOpenMovementDialog).toHaveBeenCalledWith('outgoing');
  });

  it('calls onOpenMovementDialog with transfer when transferir clicked', async () => {
    const user = userEvent.setup();
    const onOpenMovementDialog = vi.fn();
    render(<MovementActions onOpenMovementDialog={onOpenMovementDialog} />);

    await user.click(screen.getByText('Transferir'));
    expect(onOpenMovementDialog).toHaveBeenCalledWith('transfer');
  });
});

describe('TransactionFilters', () => {
  it('renders all filter buttons with counts', () => {
    const counts = { all: 10, cash: 5, transfer: 3, expense: 2 };
    render(<TransactionFilters filter="all" onFilterChange={vi.fn()} counts={counts} />);

    expect(screen.getByText('Todos (10)')).toBeInTheDocument();
    expect(screen.getByText('Efectivo (5)')).toBeInTheDocument();
    expect(screen.getByText('Transf (3)')).toBeInTheDocument();
    expect(screen.getByText('Gastos (2)')).toBeInTheDocument();
  });

  it('calls onFilterChange when clicking cash filter', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    const counts = { all: 10, cash: 5, transfer: 3, expense: 2 };
    render(<TransactionFilters filter="all" onFilterChange={onFilterChange} counts={counts} />);

    await user.click(screen.getByText('Efectivo (5)'));
    expect(onFilterChange).toHaveBeenCalledWith('cash');
  });

  it('calls onFilterChange when clicking transfer filter', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    const counts = { all: 10, cash: 5, transfer: 3, expense: 2 };
    render(<TransactionFilters filter="all" onFilterChange={onFilterChange} counts={counts} />);

    await user.click(screen.getByText('Transf (3)'));
    expect(onFilterChange).toHaveBeenCalledWith('transfer');
  });

  it('calls onFilterChange when clicking expense filter', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    const counts = { all: 10, cash: 5, transfer: 3, expense: 2 };
    render(<TransactionFilters filter="all" onFilterChange={onFilterChange} counts={counts} />);

    await user.click(screen.getByText('Gastos (2)'));
    expect(onFilterChange).toHaveBeenCalledWith('expense');
  });
});

describe('TransactionItem', () => {
  it('renders cash sale transaction with positive sign', () => {
    const transaction = createMockTransaction({ type: 'sale', subType: 'cash', amount: 100 });
    render(<TransactionItem transaction={transaction} />);

    expect(screen.getByText(/\+.*100/)).toBeInTheDocument();
  });

  it('renders transfer sale transaction with positive sign', () => {
    const transaction = createMockTransaction({ type: 'sale', subType: 'transfer', amount: 200 });
    render(<TransactionItem transaction={transaction} />);

    expect(screen.getByText(/\+.*200/)).toBeInTheDocument();
  });

  it('renders expense transaction with negative sign', () => {
    const transaction = createMockTransaction({ type: 'expense', amount: 50 });
    render(<TransactionItem transaction={transaction} />);

    expect(screen.getByText(/-.*50/)).toBeInTheDocument();
  });

  it('renders withdrawal transaction with negative sign', () => {
    const transaction = createMockTransaction({ type: 'cash_withdrawal', amount: 100 });
    render(<TransactionItem transaction={transaction} />);

    expect(screen.getByText(/-.*100/)).toBeInTheDocument();
  });

  it('renders recipient name and type when present', () => {
    const transaction = createMockTransaction({
      type: 'cash_withdrawal',
      recipientName: 'Juan Perez',
      recipientType: 'employee',
    });
    render(<TransactionItem transaction={transaction} />);

    expect(screen.getByText(/Juan Perez/)).toBeInTheDocument();
  });

  it('renders note when present', () => {
    const transaction = createMockTransaction({ note: 'Test note' });
    render(<TransactionItem transaction={transaction} />);

    expect(screen.getByText('Test note')).toBeInTheDocument();
  });

  it('shows delete button when onDelete is provided', () => {
    const transaction = createMockTransaction();
    render(<TransactionItem transaction={transaction} onDelete={vi.fn()} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('does not show delete button when onDelete is undefined', () => {
    const transaction = createMockTransaction();
    render(<TransactionItem transaction={transaction} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const transaction = createMockTransaction();
    render(<TransactionItem transaction={transaction} onDelete={onDelete} />);

    await user.click(screen.getByRole('button'));
    expect(onDelete).toHaveBeenCalled();
  });
});

describe('MovementItem', () => {
  it('renders movement description', () => {
    const movement = createMockMovement({ description: 'Llegó media res' });
    render(<MovementItem movement={movement} branches={[]} />);

    expect(screen.getByText('Llegó media res')).toBeInTheDocument();
  });

  it('renders quantity and unit when present', () => {
    const movement = createMockMovement({ estimatedQuantity: 3, unit: 'kg' });
    render(<MovementItem movement={movement} branches={[]} />);

    expect(screen.getByText('3 kg')).toBeInTheDocument();
  });

  it('renders target branch name when present', () => {
    const movement = createMockMovement({ targetBranchId: 'branch-1' });
    render(<MovementItem movement={movement} branches={[mockBranch]} />);

    expect(screen.getByText('→ Sucursal Central')).toBeInTheDocument();
  });

  it('shows delete button when onDelete is provided', () => {
    const movement = createMockMovement();
    render(<MovementItem movement={movement} onDelete={vi.fn()} branches={[]} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('does not show delete button when onDelete is undefined', () => {
    const movement = createMockMovement();
    render(<MovementItem movement={movement} branches={[]} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const movement = createMockMovement();
    render(<MovementItem movement={movement} onDelete={onDelete} branches={[]} />);

    await user.click(screen.getByRole('button'));
    expect(onDelete).toHaveBeenCalled();
  });
});

describe('SessionHeader', () => {
  const defaultProps = {
    session: createMockSession(),
    branches: [mockBranch],
    updateSession: vi.fn().mockResolvedValue(undefined),
  };

  const renderHeader = (props = defaultProps) => {
    return render(
      <MemoryRouter>
        <SessionHeader {...props} />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders session name', () => {
    renderHeader();
    expect(screen.getByText('Caja Principal')).toBeInTheDocument();
  });

  it('renders branch name and date', () => {
    renderHeader();
    expect(screen.getByText(/Sucursal Central/)).toBeInTheDocument();
  });

  it('shows opening balance edit link for open session', () => {
    const session = createMockSession({ status: 'open' });
    renderHeader({ ...defaultProps, session });

    expect(screen.getByText(/Saldo inicial/)).toBeInTheDocument();
  });

  it('does not show opening balance edit link for closed session', () => {
    const session = createMockSession({ status: 'closed' });
    renderHeader({ ...defaultProps, session });

    expect(screen.getByText(/Saldo inicial/)).toBeInTheDocument();
  });
});
