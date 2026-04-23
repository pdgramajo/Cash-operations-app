import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NewSessionDialog } from '@/components/NewSessionDialog';
import { SessionPage } from './SessionPage';
import { ReportsPage } from './ReportsPage';
import { useBranches, useCashSessions } from '@/hooks';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import type { CashSession } from '@/types';

type View = 'list' | 'session' | 'reports';

export function SessionsPage() {
  const [view, setView] = useState<View>('list');
  const [selectedSession, setSelectedSession] = useState<CashSession | null>(null);
  const [showNewSession, setShowNewSession] = useState(false);

  const { branches, createBranch } = useBranches();
  const {
    sessions,
    loading: sessionsLoading,
    createSession,
    refetch: refetchSessions,
  } = useCashSessions();

  if (view === 'reports') {
    return <ReportsPage />;
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
          <Button variant="outline" size="icon" onClick={() => setView('reports')}>
            <FileText className="h-4 w-4" />
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
    </div>
  );
}
