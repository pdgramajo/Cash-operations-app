import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewSessionDialog } from '@/components/NewSessionDialog';
import type { Branch, CashSession } from '@/types';

const mockBranch: Branch = {
  id: 'branch-1',
  name: 'Sucursal Central',
  createdAt: new Date('2026-04-01'),
};

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  branches: [mockBranch],
  onCreateSession: vi.fn().mockResolvedValue({} as CashSession),
  onCreateBranch: vi.fn().mockResolvedValue(mockBranch),
};

describe('NewSessionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render dialog with title', () => {
      render(<NewSessionDialog {...defaultProps} />);
      expect(screen.getByText('Nueva Sesión')).toBeInTheDocument();
    });

    it('should render form fields', () => {
      render(<NewSessionDialog {...defaultProps} />);
      expect(screen.getByLabelText(/nombre de sesión/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/saldo inicial/i)).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<NewSessionDialog {...defaultProps} />);
      expect(screen.getByRole('button', { name: /crear sesión/i })).toBeInTheDocument();
    });
  });

  describe('form interaction', () => {
    it('should allow entering session name', async () => {
      const user = userEvent.setup();
      render(<NewSessionDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/nombre de sesión/i), 'Sesion Manana');
      expect(screen.getByLabelText(/nombre de sesión/i)).toHaveValue('Sesion Manana');
    });

    it('should allow entering opening balance', async () => {
      const user = userEvent.setup();
      render(<NewSessionDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/saldo inicial/i), '1000');
      expect(screen.getByLabelText(/saldo inicial/i)).toHaveValue(1000);
    });
  });

  describe('create branch flow', () => {
    it('should show new branch input when clicked', async () => {
      const user = userEvent.setup();
      render(<NewSessionDialog {...defaultProps} />);

      await user.click(screen.getByText('+ Crear nueva sucursal'));
      expect(screen.getByPlaceholderText('Nombre de la nueva sucursal')).toBeInTheDocument();
    });

    it('should hide new branch input when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<NewSessionDialog {...defaultProps} />);

      await user.click(screen.getByText('+ Crear nueva sucursal'));
      await user.click(screen.getByText('Cancelar'));

      expect(screen.queryByPlaceholderText('Nombre de la nueva sucursal')).not.toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('should call onCreateSession with form data', async () => {
      const user = userEvent.setup();
      render(<NewSessionDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/nombre de sesión/i), 'Sesion Manana');
      await user.type(screen.getByLabelText(/saldo inicial/i), '1000');

      await user.click(screen.getByRole('button', { name: /crear sesión/i }));

      expect(defaultProps.onCreateSession).toHaveBeenCalledWith({
        name: 'Sesion Manana',
        branchId: 'branch-1',
        openingBalance: 1000,
      });
    });

    it('should close dialog after successful submission', async () => {
      const user = userEvent.setup();
      render(<NewSessionDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/nombre de sesión/i), 'Sesion Manana');
      await user.type(screen.getByLabelText(/saldo inicial/i), '1000');

      await user.click(screen.getByRole('button', { name: /crear sesión/i }));

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('validation', () => {
    it('should not submit without session name', async () => {
      const user = userEvent.setup();
      render(<NewSessionDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/saldo inicial/i), '1000');

      await user.click(screen.getByRole('button', { name: /crear sesión/i }));

      expect(defaultProps.onCreateSession).not.toHaveBeenCalled();
    });

    it('should not submit without opening balance', async () => {
      const user = userEvent.setup();
      render(<NewSessionDialog {...defaultProps} />);

      await user.type(screen.getByLabelText(/nombre de sesión/i), 'Sesion Manana');

      await user.click(screen.getByRole('button', { name: /crear sesión/i }));

      expect(defaultProps.onCreateSession).not.toHaveBeenCalled();
    });
  });
});
