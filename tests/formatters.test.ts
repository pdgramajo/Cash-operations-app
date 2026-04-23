import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, getTransactionTypeLabel } from '@/lib/formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers', () => {
      const formatted = formatCurrency(1000);
      expect(formatted).toContain('1');
      expect(formatted).toContain('000');
    });

    it('should format zero', () => {
      const formatted = formatCurrency(0);
      expect(formatted).toContain('0');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2026-04-17');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/2026/);
    });
  });

  describe('getTransactionTypeLabel', () => {
    it('should return correct labels for sale', () => {
      expect(getTransactionTypeLabel('sale')).toBe('Venta');
    });

    it('should return correct labels for expense', () => {
      expect(getTransactionTypeLabel('expense')).toBe('Gasto');
    });

    it('should return correct labels for cash_withdrawal', () => {
      expect(getTransactionTypeLabel('cash_withdrawal')).toBe('Retiro');
    });
  });
});
