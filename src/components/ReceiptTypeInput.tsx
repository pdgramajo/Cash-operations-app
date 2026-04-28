import { useState, useMemo, useEffect } from 'react';
import { XCircle, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReceiptTypes } from '@/hooks';
import type { ReceiptType } from '@/types';

interface ReceiptTypeInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ReceiptTypeInput({ value, onChange }: ReceiptTypeInputProps) {
  const { receiptTypes, createReceiptType, deleteReceiptType, refetch } = useReceiptTypes();
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const filteredTypes = useMemo(() => {
    return receiptTypes;
  }, [receiptTypes]);

  const exactMatch = useMemo(() => {
    if (!inputValue.trim()) return null;
    return receiptTypes.find(t => t.name.toLowerCase() === inputValue.toLowerCase());
  }, [receiptTypes, inputValue]);

  const handleSelect = (type: ReceiptType) => {
    if (exactMatch?.id === type.id) {
      onChange('');
      setInputValue('');
    } else {
      onChange(type.name);
      setInputValue(type.name);
    }
  };

  const handleAddNew = async () => {
    if (!inputValue.trim()) return;
    const newType = await createReceiptType(inputValue.trim());
    onChange(newType.name);
    setInputValue(newType.name);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteReceiptType(id);
    if (exactMatch?.id === id) {
      onChange('');
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !exactMatch) {
      e.preventDefault();
      handleAddNew();
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          placeholder="Seleccionar o crear tipo..."
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value);
            onChange(e.target.value);
          }}
          onKeyDown={handleKeyDown}
        />
        {inputValue.trim() && !exactMatch && (
          <button
            type="button"
            onClick={handleAddNew}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <PlusCircle className="h-3 w-3" />
            Agregar
          </button>
        )}
        {inputValue && exactMatch && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setInputValue('');
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>

      {filteredTypes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {filteredTypes.slice(0, 10).map(type => (
            <div key={type.id} className="relative group">
              <Button
                type="button"
                variant={exactMatch?.id === type.id ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs py-0 px-2 pr-6"
                onClick={() => handleSelect(type)}
              >
                {type.name}
              </Button>
              <button
                type="button"
                onClick={e => handleDelete(e, type.id)}
                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
              >
                <XCircle className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
