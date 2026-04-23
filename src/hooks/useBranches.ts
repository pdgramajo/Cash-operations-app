import { useState, useCallback, useEffect } from 'react';
import { branchRepository } from '@/lib/repos';
import type { Branch } from '@/types';

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBranches = useCallback(async () => {
    const data = await branchRepository.getAll();
    setBranches(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createBranch = useCallback(async (name: string) => {
    const branch = await branchRepository.create(name);
    setBranches(prev => [...prev, branch]);
    return branch;
  }, []);

  const updateBranch = useCallback(async (id: string, name: string) => {
    await branchRepository.update(id, name);
    setBranches(prev => prev.map(b => (b.id === id ? { ...b, name } : b)));
  }, []);

  const deleteBranch = useCallback(async (id: string) => {
    await branchRepository.delete(id);
    setBranches(prev => prev.filter(b => b.id !== id));
  }, []);

  return {
    branches,
    loading,
    createBranch,
    updateBranch,
    deleteBranch,
    refetch: fetchBranches,
  };
}
