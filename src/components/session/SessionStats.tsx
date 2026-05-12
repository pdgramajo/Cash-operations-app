import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';

interface SessionStatsProps {
  cashSales: number;
  transferSales: number;
  totalSales: number;
  dineroEnCaja: number;
}

export function SessionStats({
  cashSales,
  transferSales,
  totalSales,
  dineroEnCaja,
}: SessionStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      <Card className="h-12 flex flex-col justify-center">
        <p className="text-xs font-medium text-green-600 text-center">Efectivo</p>
        <p className="text-base font-bold text-green-600 text-center">
          {formatCurrency(cashSales)}
        </p>
      </Card>
      <Card className="h-12 flex flex-col justify-center">
        <p className="text-xs font-medium text-blue-400 text-center">Transferencias</p>
        <p className="text-base font-bold text-blue-400 text-center">
          {formatCurrency(transferSales)}
        </p>
      </Card>
      <Card className="h-12 flex flex-col justify-center">
        <p className="text-xs font-medium text-center">Total Ventas</p>
        <p className="text-base font-bold text-center">{formatCurrency(totalSales)}</p>
      </Card>
      <Card className="h-12 flex flex-col justify-center">
        <p className="text-xs font-medium text-center">Dinero Caja</p>
        <p className="text-base font-bold text-center">{formatCurrency(dineroEnCaja)}</p>
      </Card>
    </div>
  );
}
