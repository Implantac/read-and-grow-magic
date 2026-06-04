import { supabase } from '@/integrations/supabase/client';
import { JournalEntry, JournalEntryLine } from '@/types/accounting';

export const journalEntriesService = {
  async getAll() {
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

    return (entriesData || []).map((row) => ({
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
  },

  async postEntry(id: string) {
    const { error } = await supabase
      .from('journal_entries')
      .update({ status: 'posted' })
      .eq('id', id);
    if (error) throw error;
  }
};
