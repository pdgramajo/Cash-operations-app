import { TransactionItem } from './items/TransactionItem';
import type { Transaction } from '@/types';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  canDelete: boolean;
}

export function TransactionList({ transactions, onDelete, canDelete }: TransactionListProps) {
  return (
    <div className="h-[calc(100vh-340px)] overflow-y-auto pr-4">
      <div className="space-y-2">
        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay transacciones</p>
        ) : (
          transactions.map(t => (
            <TransactionItem
              key={t.id}
              transaction={t}
              onDelete={canDelete ? () => onDelete?.(t.id) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
