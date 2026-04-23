import { useState, useCallback } from 'react';
import { ArrowLeft, FileText, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBranches, useCashSessions } from '@/hooks';
import { formatCurrency, formatDate } from '@/lib/formatters';
import {
  generateSessionReport,
  generateDailyReport,
  downloadReport,
} from '@/lib/services/reportService';

interface ReportsPageProps {
  onBack: () => void;
}

export function ReportsPage({ onBack }: ReportsPageProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const { branches } = useBranches();
  const { sessions } = useCashSessions();

  const closedSessions = sessions
    .filter(s => s.status === 'closed')
    .sort((a, b) => b.openedAt.getTime() - a.openedAt.getTime());

  const getBranchName = (branchId: string | null) => {
    if (!branchId) return 'Sin sucursal';
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || 'Sucursal desconocida';
  };

  const handleSessionReport = useCallback(
    async (sessionId: string) => {
      setGenerating(true);
      try {
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return;

        const { transactionRepository, inventoryMovementRepository } = await import('@/lib/repos');

        const [transactions, movements] = await Promise.all([
          transactionRepository.getBySession(sessionId),
          inventoryMovementRepository.getBySession(sessionId),
        ]);

        const doc = generateSessionReport(session, transactions, movements, branches);

        const dateStr = formatDate(session.openedAt).replace(/\//g, '-');
        downloadReport(doc, `reporte-${session.name}-${dateStr}.pdf`);
      } finally {
        setGenerating(false);
      }
    },
    [sessions, branches]
  );

  const handleDailyReport = useCallback(async () => {
    if (!selectedDate) return;

    setGenerating(true);
    try {
      const { transactionRepository, inventoryMovementRepository } = await import('@/lib/repos');

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      let daySessions = closedSessions.filter(s => {
        const sessionDate = new Date(s.openedAt);
        return sessionDate >= startOfDay && sessionDate <= endOfDay;
      });

      if (selectedBranchId) {
        daySessions = daySessions.filter(s => s.branchId === selectedBranchId);
      }

      if (daySessions.length === 0) {
        alert('No hay sesiones para la fecha seleccionada');
        return;
      }

      const allTransactions = await transactionRepository.getByDateRange(startOfDay, endOfDay);

      const allMovements = await inventoryMovementRepository.getByDateRange(startOfDay, endOfDay);

      const filteredTransactions = allTransactions.filter(t =>
        daySessions.some(s => s.id === t.sessionId)
      );

      const filteredMovements = allMovements.filter(m =>
        daySessions.some(s => s.id === m.sessionId)
      );

      const doc = generateDailyReport(
        daySessions,
        filteredTransactions,
        filteredMovements,
        branches
      );

      downloadReport(doc, `reporte-diario-${selectedDate}.pdf`);
    } finally {
      setGenerating(false);
    }
  }, [selectedDate, selectedBranchId, closedSessions, branches]);

  return (
    <div className="container mx-auto p-4 max-w-md">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="text-sm text-muted-foreground">Generá reportes en PDF</p>
        </div>
      </div>

      <Tabs defaultValue="session">
        <TabsList className="w-full">
          <TabsTrigger value="session" className="flex-1">
            <FileText className="h-4 w-4 mr-2" />
            Por Sesión
          </TabsTrigger>
          <TabsTrigger value="daily" className="flex-1">
            <Calendar className="h-4 w-4 mr-2" />
            Diario
          </TabsTrigger>
        </TabsList>

        <TabsContent value="session" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Reportes por Sesión</CardTitle>
              <CardDescription>Descargá el reporte de una sesión específica</CardDescription>
            </CardHeader>
            <CardContent>
              {closedSessions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay sesiones cerradas</p>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2 pr-4">
                    {closedSessions.map(session => (
                      <Card
                        key={session.id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => handleSessionReport(session.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{session.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {getBranchName(session.branchId)} • {formatDate(session.openedAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">
                                {formatCurrency(session.closingBalance || 0)}
                              </p>
                              <Download className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Reporte Diario</CardTitle>
              <CardDescription>Consolidá todas las sesiones de un día</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha</label>
                <input
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sucursal (opcional)</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={selectedBranchId || ''}
                  onChange={e => setSelectedBranchId(e.target.value || null)}
                >
                  <option value="">Todas las sucursales</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                className="w-full"
                onClick={handleDailyReport}
                disabled={!selectedDate || generating}
              >
                <Download className="h-4 w-4 mr-2" />
                {generating ? 'Generando...' : 'Descargar Reporte'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
