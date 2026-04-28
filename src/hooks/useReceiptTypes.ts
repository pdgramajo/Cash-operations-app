import { useState, useCallback, useEffect } from 'react';
import { receiptTypeRepository } from '@/lib/repos';
import type { ReceiptType } from '@/types';

export function useReceiptTypes() {
  const [receiptTypes, setReceiptTypes] = useState<ReceiptType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReceiptTypes = useCallback(async () => {
    const data = await receiptTypeRepository.getAll();
    setReceiptTypes(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReceiptTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createReceiptType = useCallback(async (name: string) => {
    const receiptType = await receiptTypeRepository.create(name);
    setReceiptTypes(prev => {
      const exists = prev.find(r => r.id === receiptType.id);
      if (exists) return prev;
      return [...prev, receiptType];
    });
    return receiptType;
  }, []);

  const deleteReceiptType = useCallback(async (id: string) => {
    await receiptTypeRepository.delete(id);
    setReceiptTypes(prev => prev.filter(r => r.id !== id));
  }, []);

  return {
    receiptTypes,
    loading,
    createReceiptType,
    deleteReceiptType,
    refetch: fetchReceiptTypes,
  };
}
