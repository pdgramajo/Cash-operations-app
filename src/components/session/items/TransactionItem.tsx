import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import {
  formatCurrency,
  formatDateTime,
  getTransactionTypeLabel,
  getTransactionSubTypeLabel,
  getRecipientTypeLabel,
} from '@/lib/formatters';
import type { Transaction } from '@/types';

interface TransactionItemProps {
  transaction: Transaction;
  onDelete?: () => void;
}

export function TransactionItem({ transaction, onDelete }: TransactionItemProps) {
  const isNegative =
    transaction.type === 'expense' ||
    (transaction.type === 'cash_withdrawal' && transaction.recipientType !== 'branch_transfer');

  const getAmountColor = () => {
    if (isNegative) return 'text-destructive';
    if (transaction.type === 'sale' && transaction.subType === 'cash') return 'text-green-600';
    if (transaction.type === 'sale' && transaction.subType === 'transfer') return 'text-blue-400';
    return '';
  };

  return (
    <Card className={isNegative ? 'border-destructive/50' : ''}>
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="font-medium">
              {getTransactionTypeLabel(transaction.type)}
              {transaction.subType && (
                <span
                  className={`ml-1 ${
                    transaction.subType === 'cash' ? 'text-green-600' : 'text-blue-400'
                  }`}
                >
                  ({getTransactionSubTypeLabel(transaction.subType)})
                </span>
              )}
            </p>
            {transaction.recipientType && (
              <p className="text-sm text-muted-foreground">
                {transaction.recipientName} ({getRecipientTypeLabel(transaction.recipientType)})
              </p>
            )}
            {transaction.note && (
              <p className="text-sm text-muted-foreground">{transaction.note}</p>
            )}
            <p className="text-xs text-muted-foreground">{formatDateTime(transaction.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-bold ${getAmountColor()}`}>
              {isNegative ? '-' : '+'}
              {formatCurrency(transaction.amount)}
            </span>
            {onDelete && (
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
