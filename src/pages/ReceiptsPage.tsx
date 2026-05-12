import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { inventoryMovementRepository, receiptTypeRepository } from '@/lib/repos';
import { formatDate } from '@/lib/formatters';
import type { InventoryMovement, ReceiptType } from '@/types';

type ReceiptTimeFilter = 'week' | 'month' | 'custom';

export default function ReceiptsPage() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<InventoryMovement[]>([]);
  const [receiptTypes, setReceiptTypes] = useState<ReceiptType[]>([]);
  const [timeFilter, setTimeFilter] = useState<ReceiptTimeFilter>('week');
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReceipts = useMemo(
    () => async () => {
      setLoading(true);
      const now = new Date();
      let startDate: Date;
      const endDate = new Date(now);

      switch (timeFilter) {
        case 'week': {
          const dayOfWeek = now.getDay();
          const daysToSubtract = dayOfWeek === 6 ? 7 : dayOfWeek === 0 ? 6 : dayOfWeek + 1;
          startDate = new Date(now);
          startDate.setDate(now.getDate() - daysToSubtract);
          startDate.setHours(0, 0, 0, 0);
          break;
        }
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'custom':
        default:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          break;
      }
      endDate.setHours(23, 59, 59, 999);

      const data = await inventoryMovementRepository.getIncomingByDateRange(startDate, endDate);
      const sorted = data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setReceipts(sorted);

      const types = await receiptTypeRepository.getAll();
      setReceiptTypes(types.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()));

      setLoading(false);
    },
    [timeFilter]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    const fn = loadReceipts();
    fn.then(() => {});
  }, [loadReceipts]);

  const filteredReceipts = useMemo(() => {
    if (selectedTypeId === null || selectedTypeId === 'all') {
      return receipts;
    }
    if (selectedTypeId === 'untyped') {
      return receipts.filter(r => !r.receiptType);
    }
    return receipts.filter(r => r.receiptType === selectedTypeId);
  }, [receipts, selectedTypeId]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    receipts.forEach(r => {
      const typeName = r.receiptType || 'Sin tipo';
      counts[typeName] = (counts[typeName] || 0) + 1;
    });
    return counts;
  }, [receipts]);

  const getFilterLabel = () => {
    switch (timeFilter) {
      case 'week':
        return 'Esta semana';
      case 'month':
        return 'Este mes';
      case 'custom':
        return 'Últimos 7 días';
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md h-screen flex flex-col">
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="size-10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Recepciones</h1>
          <p className="text-xs text-muted-foreground">{getFilterLabel()}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-3 flex-shrink-0">
        <Button
          variant={timeFilter === 'week' ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => setTimeFilter('week')}
        >
          Semana
        </Button>
        <Button
          variant={timeFilter === 'month' ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => setTimeFilter('month')}
        >
          Mes
        </Button>
        <Button
          variant={timeFilter === 'custom' ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => setTimeFilter('custom')}
        >
          7 días
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          className={`rounded-full px-3 h-8 text-xs ${
            selectedTypeId === null
              ? 'bg-gray-800 text-white border-gray-800 hover:bg-gray-700 hover:border-gray-700'
              : 'hover:bg-gray-100'
          }`}
          onClick={() => setSelectedTypeId(null)}
        >
          Todos
          <span className="ml-1.5 bg-white/20 px-1.5 rounded-full text-[10px]">
            {receipts.length}
          </span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={`rounded-full px-3 h-8 text-xs ${
            selectedTypeId === 'untyped'
              ? 'bg-gray-800 text-white border-gray-800 hover:bg-gray-700 hover:border-gray-700'
              : 'hover:bg-gray-100'
          }`}
          onClick={() => setSelectedTypeId('untyped')}
        >
          Otros
          <span className="ml-1.5 bg-white/20 px-1.5 rounded-full text-[10px]">
            {typeCounts['Sin tipo'] || 0}
          </span>
        </Button>
        {receiptTypes.map(type => {
          const count = typeCounts[type.name] || 0;
          const isSelected = selectedTypeId === type.name;
          return (
            <Button
              key={type.id}
              variant="outline"
              size="sm"
              className={`rounded-full px-3 h-8 text-xs ${
                isSelected
                  ? 'bg-gray-800 text-white border-gray-800 hover:bg-gray-700 hover:border-gray-700'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => setSelectedTypeId(type.name)}
            >
              {type.name}
              <span className="ml-1.5 bg-white/20 px-1.5 rounded-full text-[10px]">{count}</span>
            </Button>
          );
        })}
        {receiptTypes.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground py-2">Sin tipos de receipt registrados</p>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : filteredReceipts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay recepciones en este período
            </p>
          ) : (
            <div className="space-y-2 pr-4">
              {filteredReceipts.map(r => (
                <Card key={r.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{r.receiptType || 'Sin tipo'}</p>
                        <p className="text-sm text-muted-foreground">{r.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        {r.estimatedQuantity && (
                          <p className="font-semibold">
                            {r.estimatedQuantity} {r.unit}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
