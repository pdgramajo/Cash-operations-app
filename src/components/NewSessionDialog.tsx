import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Branch, CashSession } from '@/types';

interface NewSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: Branch[];
  onCreateSession: (data: {
    name: string;
    branchId: string | null;
    openingBalance: number;
    notes?: string;
  }) => Promise<CashSession>;
  onCreateBranch?: (name: string) => Promise<Branch>;
}

export function NewSessionDialog({
  open,
  onOpenChange,
  branches,
  onCreateSession,
  onCreateBranch,
}: NewSessionDialogProps) {
  const [name, setName] = useState('');
  const defaultBranchId = branches.length === 1 ? branches[0]!.id : '';
  const [branchId, setBranchId] = useState<string>(defaultBranchId);
  const [openingBalance, setOpeningBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [showNewBranch, setShowNewBranch] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !openingBalance) return;

    setLoading(true);
    try {
      const branch =
        showNewBranch && newBranchName.trim() ? await onCreateBranch?.(newBranchName.trim()) : null;

      await onCreateSession({
        name: name.trim(),
        branchId: showNewBranch && branch ? branch.id : branchId || null,
        openingBalance: parseFloat(openingBalance),
        notes: notes.trim() || undefined,
      });

      resetForm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setBranchId('');
    setOpeningBalance('');
    setNotes('');
    setNewBranchName('');
    setShowNewBranch(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nueva Sesión</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de sesión</Label>
            <Input
              id="name"
              placeholder="Ej: Mañana, Tarde, Noche"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Sucursal</Label>
            {!showNewBranch ? (
              <div className="space-y-2">
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewBranch(true)}
                >
                  + Crear nueva sucursal
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Nombre de la nueva sucursal"
                  value={newBranchName}
                  onChange={e => setNewBranchName(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNewBranch(false);
                    setNewBranchName('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="openingBalance">Saldo inicial</Label>
            <Input
              id="openingBalance"
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={openingBalance}
              onChange={e => setOpeningBalance(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input
              id="notes"
              placeholder="Notas adicionales"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Sesión'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
