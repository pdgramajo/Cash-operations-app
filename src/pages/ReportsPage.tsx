import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, Download, Clipboard, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBranches, useCashSessions } from '@/hooks';
import { formatCurrency, formatDate } from '@/lib/formatters';
import {
  generateSessionReport,
  generateDailyReport,
  generateWeeklyReport,
  generateWeeklyReportText,
  downloadReport,
} from '@/lib/services/reportService';
import {
  exportAllData,
  downloadBackup,
  importBackup,
  validateBackupFile,
} from '@/lib/services/backupService';

export default function ReportsPage() {
  const navigate = useNavigate();
  const getLastMonday = (): Date => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const formatDateForInput = (date: Date): string => {
    const iso = date.toISOString();
    return iso.split('T')[0] || '';
  };

  const lastMonday = getLastMonday();
  const [selectedDate, setSelectedDate] = useState(() => formatDateForInput(lastMonday));
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const getWeekStart = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const getWeekEnd = (startDate: Date): Date => {
    const end = new Date(startDate);
    end.setDate(startDate.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };

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

  const handleWeeklyReport = useCallback(async () => {
    if (!selectedDate) return;

    setGenerating(true);
    try {
      const { transactionRepository, inventoryMovementRepository, cashSessionRepository } =
        await import('@/lib/repos');

      const startOfWeek = getWeekStart(selectedDate);
      const endOfWeek = getWeekEnd(startOfWeek!);

      const allSessionsInRange = await cashSessionRepository.getByDateRange(
        startOfWeek!,
        endOfWeek
      );

      const weekSessions = allSessionsInRange.filter(s => s.status === 'closed');

      if (weekSessions.length === 0) {
        alert('No hay sesiones cerradas para la semana seleccionada');
        return;
      }

      const allTransactions = await transactionRepository.getByDateRange(startOfWeek!, endOfWeek);
      const allMovements = await inventoryMovementRepository.getByDateRange(
        startOfWeek!,
        endOfWeek
      );

      const doc = generateWeeklyReport(
        weekSessions,
        allTransactions,
        allMovements,
        branches,
        startOfWeek!,
        endOfWeek
      );

      const dateStr = selectedDate.replace(/-/g, '');
      downloadReport(doc, `reporte-semanal-${dateStr}.pdf`);
    } finally {
      setGenerating(false);
    }
  }, [selectedDate, branches]);

  const handleCopyWeeklyReport = useCallback(async () => {
    if (!selectedDate) return;

    setGenerating(true);
    try {
      const { transactionRepository, inventoryMovementRepository, cashSessionRepository } =
        await import('@/lib/repos');

      const startOfWeek = getWeekStart(selectedDate);
      const endOfWeek = getWeekEnd(startOfWeek!);

      const allSessionsInRange = await cashSessionRepository.getByDateRange(
        startOfWeek!,
        endOfWeek
      );

      const weekSessions = allSessionsInRange.filter(s => s.status === 'closed');

      if (weekSessions.length === 0) {
        alert('No hay sesiones cerradas para la semana seleccionada');
        return;
      }

      const allTransactions = await transactionRepository.getByDateRange(startOfWeek!, endOfWeek);
      const allMovements = await inventoryMovementRepository.getByDateRange(
        startOfWeek!,
        endOfWeek
      );

      const reportText = generateWeeklyReportText(
        weekSessions,
        allTransactions,
        allMovements,
        branches,
        startOfWeek!,
        endOfWeek
      );

      await navigator.clipboard.writeText(reportText);
      alert('Reporte copiado al portapapeles');
    } finally {
      setGenerating(false);
    }
  }, [selectedDate, branches]);

  const handleExportBackup = useCallback(async () => {
    setGenerating(true);
    try {
      const data = await exportAllData();
      downloadBackup(data);
    } finally {
      setGenerating(false);
    }
  }, []);

  const handleImportBackup = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setGenerating(true);
    setImportResult(null);
    try {
      const data = await validateBackupFile(file);
      if (!data) {
        setImportResult({ success: false, message: 'Archivo de backup inválido' });
        return;
      }

      const result = await importBackup(data);
      if (result.success) {
        setImportResult({
          success: true,
          message: `Importado: ${result.branches} sucursales, ${result.cashSessions} sesiones, ${result.transactions} transacciones, ${result.inventoryMovements} movimientos, ${result.receiptTypes} tipos, ${result.reports} reportes`,
        });
      } else {
        setImportResult({ success: false, message: result.error || 'Error desconocido' });
      }
    } catch {
      setImportResult({ success: false, message: 'Error al importar archivo' });
    } finally {
      setGenerating(false);
      if (e.target) e.target.value = '';
    }
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-md">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
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
          <TabsTrigger value="weekly" className="flex-1">
            <Calendar className="h-4 w-4 mr-2" />
            Semanal
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex-1">
            <Database className="h-4 w-4 mr-2" />
            Backup
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
                <label htmlFor="report-date" className="text-sm font-medium">
                  Fecha
                </label>
                <input
                  id="report-date"
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="report-branch" className="text-sm font-medium">
                  Sucursal (opcional)
                </label>
                <select
                  id="report-branch"
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

        <TabsContent value="weekly" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Reporte Semanal</CardTitle>
              <CardDescription>
                Ventas por día (lunes-domingo) y recepciones de medias res por sucursal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="report-week" className="text-sm font-medium">
                  Semana (lunes)
                </label>
                <input
                  id="report-week"
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleWeeklyReport}
                  disabled={!selectedDate || generating}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopyWeeklyReport}
                  disabled={!selectedDate || generating}
                >
                  <Clipboard className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup y Restauración</CardTitle>
              <CardDescription>
                Exportá todos los datos o importá un backup anterior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-medium">Exportar datos</h3>
                <p className="text-sm text-muted-foreground">
                  Descargá un archivo JSON con todos los datos: sucursales, sesiones, transacciones,
                  movimientos de inventario y más.
                </p>
                <Button onClick={handleExportBackup} disabled={generating} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  {generating ? 'Exportando...' : 'Exportar Backup'}
                </Button>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h3 className="font-medium">Importar datos</h3>
                <p className="text-sm text-muted-foreground">
                  Restaurá los datos desde un archivo de backup previamente exportado.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  disabled={generating}
                  className="flex w-full text-sm"
                />
              </div>

              {importResult && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    importResult.success
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {importResult.message}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
