import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { JournalEntry, JournalEntryLine } from '@/types/accounting';
import { toast } from 'sonner';

export function useJournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const { data: entriesData, error: entriesError } = await supabase
        .from('journal_entries')
        .select('*')
        .order('date', { ascending: false });

      if (entriesError) throw entriesError;

      const { data: linesData, error: linesError } = await supabase
        .from('journal_entry_lines')
        .select('*');

      if (linesError) throw linesError;

      const linesMap = new Map<string, JournalEntryLine[]>();
      (linesData || []).forEach((line) => {
        const arr = linesMap.get(line.journal_entry_id) || [];
        arr.push({
          id: line.id,
          accountId: line.account_id || '',
          accountCode: line.account_code,
          accountName: line.account_name,
          debit: Number(line.debit),
          credit: Number(line.credit),
          description: line.description || '',
        });
        linesMap.set(line.journal_entry_id, arr);
      });

      const mapped: JournalEntry[] = (entriesData || []).map((row) => ({
        id: row.id,
        number: row.number,
        date: row.date,
        description: row.description,
        status: row.status as JournalEntry['status'],
        lines: linesMap.get(row.id) || [],
        totalDebit: Number(row.total_debit),
        totalCredit: Number(row.total_credit),
        createdBy: row.created_by || 'Sistema',
        createdAt: row.created_at,
      }));

      setEntries(mapped);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      toast.error('Erro ao carregar lançamentos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const postEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .update({ status: 'posted' })
        .eq('id', id);
      if (error) throw error;
      toast.success('Lançamento lançado com sucesso');
      await fetchEntries();
    } catch (error) {
      console.error('Error posting entry:', error);
      toast.error('Erro ao lançar');
    }
  };

  return { entries, loading, refetch: fetchEntries, postEntry };
}
