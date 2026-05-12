import { Button } from '@/components/ui/button';

type TransactionFilter = 'all' | 'cash' | 'transfer' | 'expense';

interface TransactionFiltersProps {
  filter: TransactionFilter;
  onFilterChange: (filter: TransactionFilter) => void;
  counts: {
    all: number;
    cash: number;
    transfer: number;
    expense: number;
  };
}

export function TransactionFilters({ filter, onFilterChange, counts }: TransactionFiltersProps) {
  return (
    <div className="grid grid-cols-4 gap-1 mb-3">
      <Button
        variant="outline"
        size="sm"
        className={`text-xs py-1 h-7 ${filter === 'all' ? 'bg-gray-600 text-white border-gray-600' : ''}`}
        onClick={() => onFilterChange('all')}
      >
        Todos ({counts.all})
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={`text-xs py-1 h-7 ${filter === 'cash' ? 'bg-green-600 text-white border-green-600' : ''}`}
        onClick={() => onFilterChange('cash')}
      >
        Efectivo ({counts.cash})
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={`text-xs py-1 h-7 ${filter === 'transfer' ? 'bg-blue-400 text-white border-blue-400' : ''}`}
        onClick={() => onFilterChange('transfer')}
      >
        Transf ({counts.transfer})
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={`text-xs py-1 h-7 ${filter === 'expense' ? 'bg-red-600 text-white border-red-600' : ''}`}
        onClick={() => onFilterChange('expense')}
      >
        Gastos ({counts.expense})
      </Button>
    </div>
  );
}
