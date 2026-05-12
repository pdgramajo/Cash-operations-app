import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import type { CashSession } from '@/types';

interface SessionHeaderProps {
  session: CashSession;
  branches: { id: string; name: string }[];
  updateSession: (id: string, data: Partial<CashSession>) => Promise<void>;
  onCloseClick?: () => void;
}

export function SessionHeader({
  session,
  branches,
  updateSession,
  onCloseClick,
}: SessionHeaderProps) {
  const navigate = useNavigate();
  const [editingOpeningBalance, setEditingOpeningBalance] = useState(false);
  const [tempOpeningBalance, setTempOpeningBalance] = useState(session.openingBalance.toString());

  const getBranchName = (branchId: string | null) => {
    if (!branchId) return 'Sin sucursal';
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || 'Sucursal desconocida';
  };

  const startEditingBalance = () => {
    setTempOpeningBalance(session.openingBalance.toString());
    setEditingOpeningBalance(true);
  };

  return (
    <div className="flex items-center gap-4 mb-6">
      <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="flex-1 relative">
        <h1 className="text-2xl font-semibold pr-16">{session.name}</h1>
        <p className="text-sm text-muted-foreground">
          {getBranchName(session.branchId)} • {formatDateTime(session.openedAt)}
        </p>
        {session.status === 'open' && !editingOpeningBalance && (
          <button
            type="button"
            className="text-xs text-blue-500 underline mt-1"
            onClick={startEditingBalance}
          >
            Saldo inicial: {formatCurrency(session.openingBalance)}
          </button>
        )}
        {session.status === 'open' && editingOpeningBalance && (
          <div className="flex items-center gap-1 mt-1">
            <input
              type="number"
              className="text-xs border rounded px-1 py-0.5 w-20"
              value={tempOpeningBalance}
              onChange={e => setTempOpeningBalance(e.target.value)}
            />
            <button
              type="button"
              className="text-xs text-green-600"
              onClick={async () => {
                const newBalance = parseFloat(tempOpeningBalance);
                if (!isNaN(newBalance)) {
                  await updateSession(session.id, { openingBalance: newBalance });
                }
                setEditingOpeningBalance(false);
              }}
            >
              {'\u2713'}
            </button>
            <button
              type="button"
              className="text-xs text-red-500"
              onClick={() => {
                setTempOpeningBalance(session.openingBalance.toString());
                setEditingOpeningBalance(false);
              }}
            >
              {'\u2715'}
            </button>
          </div>
        )}
        {session.status === 'closed' && (
          <p className="text-xs text-muted-foreground mt-1">
            Saldo inicial: {formatCurrency(session.openingBalance)}
          </p>
        )}
        {session.status === 'open' && (
          <Button
            variant="outline"
            size="sm"
            className="absolute right-0 top-0 h-7 text-sm"
            onClick={onCloseClick}
          >
            <Lock className="h-3 w-3 mr-1" />
            Cerrar
          </Button>
        )}
      </div>
      <Button variant="ghost" size="icon" onClick={() => navigate('/reports')}>
        <FileText className="h-5 w-5" />
      </Button>
    </div>
  );
}
