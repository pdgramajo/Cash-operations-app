import { useState, useCallback, useEffect } from 'react';
import { cashSessionRepository } from '@/lib/repos';
import type { CashSession } from '@/types';

export function useCashSessions() {
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    const data = await cashSessionRepository.getAll();
    setSessions(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createSession = useCallback(
    async (data: {
      name: string;
      branchId: string | null;
      openingBalance: number;
      notes?: string;
    }) => {
      const session = await cashSessionRepository.create(data);
      setSessions(prev => [session, ...prev]);
      return session;
    },
    []
  );

  const closeSession = useCallback(async (id: string, closingBalance: number) => {
    await cashSessionRepository.close(id, closingBalance);
    setSessions(prev =>
      prev.map(s =>
        s.id === id ? { ...s, status: 'closed' as const, closedAt: new Date(), closingBalance } : s
      )
    );
  }, []);

  const updateSession = useCallback(async (id: string, data: Partial<CashSession>) => {
    await cashSessionRepository.update(id, data);
    setSessions(prev => prev.map(s => (s.id === id ? { ...s, ...data } : s)));
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    await cashSessionRepository.delete(id);
    setSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  return {
    sessions,
    loading,
    createSession,
    closeSession,
    updateSession,
    deleteSession,
    refetch: fetchSessions,
  };
}
