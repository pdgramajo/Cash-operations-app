import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useTransactions, useInventoryMovements, useCashSessions, useBranches } from '@/hooks';
import {
  SessionHeader,
  SessionStats,
  TransactionActions,
  MovementActions,
  TransactionFilters,
  TransactionList,
  MovementList,
  TransactionDialog,
  MovementDialog,
  CloseSessionDialog,
} from '@/components/session';

type TransactionDialogType = 'sale' | 'expense' | 'cash_withdrawal';
type MovementDialogType = 'incoming' | 'outgoing' | 'transfer';
type TransactionFilter = 'all' | 'cash' | 'transfer' | 'expense';

export default function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { sessions } = useCashSessions();
  const { branches } = useBranches();

  const session = sessions.find(s => s.id === sessionId);

  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [transactionDialogType, setTransactionDialogType] = useState<TransactionDialogType>('sale');
  const [movementDialogType, setMovementDialogType] = useState<MovementDialogType>('incoming');
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>('all');

  const { transactions, createTransaction, deleteTransaction, getTotals } = useTransactions(
    session?.id || ''
  );
  const { movements, createMovement, deleteMovement } = useInventoryMovements(session?.id || '');
  const { closeSession, updateSession } = useCashSessions();

  if (!session) {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            ←
          </Button>
          <h1 className="text-2xl font-semibold">Sesión no encontrada</h1>
        </div>
      </div>
    );
  }

  const totals = getTotals();

  const estimatedClosingBalance =
    session.openingBalance + totals.cashSales - totals.expenses - totals.withdrawals || 0;

  const cashSales = totals.cashSales;
  const transferSales = totals.transferSales || 0;
  const totalSales = cashSales + transferSales;
  const dineroEnCaja = session.openingBalance + cashSales - totals.expenses - totals.withdrawals;

  const transactionsByFilter = transactions.filter(t => {
    if (transactionFilter === 'all') return true;
    if (transactionFilter === 'cash') return t.type === 'sale' && t.subType === 'cash';
    if (transactionFilter === 'transfer') return t.type === 'sale' && t.subType === 'transfer';
    if (transactionFilter === 'expense') return t.type === 'expense';
    return true;
  });

  const filterCounts = {
    all: transactions.length,
    cash: transactions.filter(t => t.type === 'sale' && t.subType === 'cash').length,
    transfer: transactions.filter(t => t.type === 'sale' && t.subType === 'transfer').length,
    expense: transactions.filter(t => t.type === 'expense').length,
  };

  return (
    <div className="container mx-auto p-4 max-w-md h-screen flex flex-col">
      <div className="flex-shrink-0">
        <SessionHeader session={session} branches={branches} updateSession={updateSession} />

        <SessionStats
          cashSales={cashSales}
          transferSales={transferSales}
          totalSales={totalSales}
          dineroEnCaja={dineroEnCaja}
        />

        {session.status === 'open' && (
          <TransactionActions
            onOpenTransactionDialog={type => {
              setTransactionDialogType(type);
              setShowTransactionDialog(true);
            }}
          />
        )}
      </div>

      <div className="flex-1 min-h-0">
        <Tabs defaultValue="transactions">
          <TabsList className="w-full">
            <TabsTrigger value="transactions" className="flex-1">
              Movimientos ({transactions.length})
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex-1">
              Inventario ({movements.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="mt-4 h-full">
            <TransactionFilters
              filter={transactionFilter}
              onFilterChange={setTransactionFilter}
              counts={filterCounts}
            />
            <TransactionList
              transactions={transactionsByFilter}
              onDelete={deleteTransaction}
              canDelete={session.status === 'open'}
            />
          </TabsContent>

          <TabsContent value="inventory" className="mt-4 h-full">
            {session.status === 'open' && (
              <MovementActions
                onOpenMovementDialog={type => {
                  setMovementDialogType(type);
                  setShowMovementDialog(true);
                }}
              />
            )}
            <MovementList
              movements={movements}
              onDelete={deleteMovement}
              canDelete={session.status === 'open'}
              branches={branches}
            />
          </TabsContent>
        </Tabs>
      </div>

      <TransactionDialog
        key={showTransactionDialog ? 'open' : 'closed'}
        open={showTransactionDialog}
        onOpenChange={setShowTransactionDialog}
        type={transactionDialogType}
        sessionId={session.id}
        branchId={session.branchId}
        onSubmit={createTransaction}
      />

      <MovementDialog
        open={showMovementDialog}
        onOpenChange={setShowMovementDialog}
        type={movementDialogType}
        sessionId={session.id}
        branchId={session.branchId}
        branches={branches}
        onSubmit={createMovement}
      />

      <CloseSessionDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        session={session}
        estimatedClosing={estimatedClosingBalance}
        closeSession={closeSession}
        onClose={() => navigate('/')}
      />
    </div>
  );
}
