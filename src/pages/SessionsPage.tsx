import { useState, useRef } from 'react';
import { Plus, FileText, Sun, Moon, Trash2, Download, Upload, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NewSessionDialog } from '@/components/NewSessionDialog';
import { SessionPage } from './SessionPage';
import { ReportsPage } from './ReportsPage';
import { useBranches, useCashSessions, useTheme, useTransactions } from '@/hooks';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import {
  exportSession,
  parseExportFile,
  type ExportSessionData,
} from '@/lib/services/exportService';
import { importSession } from '@/lib/services/importService';
import { inventoryMovementRepository } from '@/lib/repos';
import type { CashSession, InventoryMovement } from '@/types';

type View = 'list' | 'session' | 'reports';

type ReceiptFilter = 'week' | 'month' | 'custom';

export function SessionsPage() {
  const [view, setView] = useState<View>('list');
  const [selectedSession, setSelectedSession] = useState<CashSession | null>(null);
  const [showNewSession, setShowNewSession] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<CashSession | null>(null);
  const [sessionToExport, setSessionToExport] = useState<CashSession | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState<ExportSessionData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [showReceiptsDialog, setShowReceiptsDialog] = useState(false);
  const [receipts, setReceipts] = useState<InventoryMovement[]>([]);
  const [receiptFilter, setReceiptFilter] = useState<ReceiptFilter>('week');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { branches, createBranch } = useBranches();
  const {
    sessions,
    loading: sessionsLoading,
    createSession,
    deleteSession,
    refetch: refetchSessions,
  } = useCashSessions();
  const { theme, toggleTheme } = useTheme();

  const { getBySession } = useTransactions('');

  const handleExport = async () => {
    if (!sessionToExport) return;
    const transactions = await getBySession(sessionToExport.id);
    exportSession(sessionToExport, transactions, branches);
    setSessionToExport(null);
  };

  const handleImportClick = () => {
    setImportError(null);
    setImportData(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const data = parseExportFile(content);

      if (!data) {
        setImportError('Archivo inválido. Seleccione un archivo JSON válido.');
      } else {
        setImportData(data);
        setImportError(null);
      }
    } catch {
      setImportError('Error al leer el archivo');
    }

    e.target.value = '';
    setShowImportDialog(true);
  };

  const handleImportConfirm = async () => {
    if (!importData) return;

    setImporting(true);
    const result = await importSession(importData);
    setImporting(false);

    if (result.success) {
      setShowImportDialog(false);
      setImportData(null);
      refetchSessions();
    } else {
      setImportError(result.error || 'Error al importar');
    }
  };

  const loadReceipts = async () => {
    const now = new Date();
    let startDate: Date;
    const endDate = new Date(now);

    switch (receiptFilter) {
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
    setReceipts(data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
  };

  const receiptSummary = receipts.reduce(
    (acc, r) => {
      const key = r.receiptType || 'Sin tipo';
      acc[key] = (acc[key] || 0) + (r.estimatedQuantity || 1);
      return acc;
    },
    {} as Record<string, number>
  );

  const summaryText = Object.entries(receiptSummary)
    .map(([type, count]) => `${type}: ${count}`)
    .join(' | ');

  if (view === 'reports') {
    return <ReportsPage onBack={() => setView('list')} />;
  }

  if (view === 'session' && selectedSession) {
    return (
      <SessionPage
        session={selectedSession}
        onBack={() => {
          setSelectedSession(null);
          setView('list');
          refetchSessions();
        }}
        branches={branches}
        onShowReports={() => setView('reports')}
      />
    );
  }

  const openSessions = sessions.filter(s => s.status === 'open');
  const closedSessions = sessions.filter(s => s.status === 'closed');

  const getBranchName = (branchId: string | null) => {
    if (!branchId) return 'Sin sucursal';
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || 'Sucursal desconocida';
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Caja</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={toggleTheme}>
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={() => setView('reports')}>
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setShowReceiptsDialog(true);
              loadReceipts();
            }}
          >
            <Package className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportClick}>
            <Upload className="h-4 w-4 mr-1" />
            Importar
          </Button>
          <Button onClick={() => setShowNewSession(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva
          </Button>
        </div>
      </div>

      {openSessions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-green-600">Abiertas</h2>
          <div className="space-y-2">
            {openSessions.map(session => (
              <Card
                key={session.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => {
                  setSelectedSession(session);
                  setView('session');
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{session.name}</CardTitle>
                      <CardDescription>
                        {getBranchName(session.branchId)} • {formatDateTime(session.openedAt)}
                      </CardDescription>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                      Abierta
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Saldo inicial: {formatCurrency(session.openingBalance)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="closed">
        <TabsList className="w-full">
          <TabsTrigger value="closed" className="flex-1">
            Historial ({closedSessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="closed" className="mt-4">
          {sessionsLoading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : closedSessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay sesiones cerradas</p>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2 pr-4">
                {closedSessions.map(session => (
                  <Card
                    key={session.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => {
                      setSelectedSession(session);
                      setView('session');
                    }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{session.name}</CardTitle>
                          <CardDescription>
                            {getBranchName(session.branchId)} • {formatDate(session.openedAt)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={e => {
                              e.stopPropagation();
                              setSessionToExport(session);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={e => {
                              e.stopPropagation();
                              setSessionToDelete(session);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Inicial: {formatCurrency(session.openingBalance)}
                        </span>
                        <span className="font-medium">
                          Cierre: {formatCurrency(session.closingBalance || 0)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      <NewSessionDialog
        open={showNewSession}
        onOpenChange={setShowNewSession}
        branches={branches}
        onCreateSession={createSession}
        onCreateBranch={createBranch}
      />

      <AlertDialog
        open={!!sessionToDelete}
        onOpenChange={open => !open && setSessionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Sesión</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar la sesión "{sessionToDelete?.name}"? Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (sessionToDelete) {
                  await deleteSession(sessionToDelete.id);
                  setSessionToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!sessionToExport}
        onOpenChange={open => !open && setSessionToExport(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exportar Sesión</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Exportar sesión "{sessionToExport?.name}"? Se incluirá con todas sus transacciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExport}>Exportar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Sesión</DialogTitle>
            <DialogDescription>
              {importError ? (
                <span className="text-red-500">{importError}</span>
              ) : importData ? (
                <div className="space-y-2 mt-2">
                  <p>
                    <strong>Nombre:</strong> {importData.session.name}
                  </p>
                  <p>
                    <strong>Fecha apertura:</strong> {formatDate(importData.session.openedAt)}
                  </p>
                  <p>
                    <strong>Monto apertura:</strong>{' '}
                    {formatCurrency(importData.session.openingBalance)}
                  </p>
                  <p>
                    <strong>Transacciones:</strong> {importData.transactions.length}
                  </p>
                  {importData.session.status === 'closed' && importData.session.closingBalance && (
                    <p>
                      <strong>Cierre:</strong> {formatCurrency(importData.session.closingBalance)}
                    </p>
                  )}
                </div>
              ) : (
                'Seleccione un archivo JSON para importar.'
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false);
                setImportData(null);
                setImportError(null);
              }}
            >
              Cancelar
            </Button>
            {importData && (
              <Button onClick={handleImportConfirm} disabled={importing}>
                {importing ? 'Importando...' : 'Importar'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReceiptsDialog} onOpenChange={setShowReceiptsDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Recepciones</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={receiptFilter === 'week' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => {
                  setReceiptFilter('week');
                  setTimeout(loadReceipts, 0);
                }}
              >
                Semana
              </Button>
              <Button
                variant={receiptFilter === 'month' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => {
                  setReceiptFilter('month');
                  setTimeout(loadReceipts, 0);
                }}
              >
                Mes
              </Button>
              <Button
                variant={receiptFilter === 'custom' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => {
                  setReceiptFilter('custom');
                  setTimeout(loadReceipts, 0);
                }}
              >
                7 días
              </Button>
            </div>

            {receipts.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{summaryText}</p>
              </div>
            )}

            {receipts.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No hay recepciones en este período
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {receipts.map(r => (
                  <Card key={r.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{r.receiptType || r.description}</p>
                        <p className="text-sm text-muted-foreground">{r.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        {r.estimatedQuantity && (
                          <p className="font-medium">
                            {r.estimatedQuantity} {r.unit}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
