import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CanalKey = 'atacado' | 'varejo' | 'ecommerce' | 'outros' | 'sem_canal';

export interface ChannelReconcileRow {
  canal: CanalKey;
  ledgerInflow: number;
  ledgerOutflow: number;
  ledgerNet: number;
  ledgerReconciled: number;
  ledgerPending: number;
  entries: number;
}

export interface BankReconcileSummary {
  bankInflow: number;
  bankOutflow: number;
  bankNet: number;
  bankMatched: number;
  bankUnmatched: number;
  bankTxCount: number;
  channels: ChannelReconcileRow[];
  divergenceAbs: number;
}

interface Params { from: string; to: string; bankAccountId?: string | null }

const CANAIS: CanalKey[] = ['atacado', 'varejo', 'ecommerce', 'outros', 'sem_canal'];

export function useBankChannelReconcile({ from, to, bankAccountId }: Params) {
  return useQuery({
    queryKey: ['bank-channel-reconcile', from, to, bankAccountId],
    queryFn: async (): Promise<BankReconcileSummary> => {
      let ledgerQ = supabase
        .from('financial_ledger')
        .select('amount, type, canal_operacional, reconciled, bank_account_id')
        .gte('entry_date', from)
        .lte('entry_date', to);
      if (bankAccountId) ledgerQ = ledgerQ.eq('bank_account_id', bankAccountId);

      let bankQ = supabase
        .from('bank_transactions')
        .select('amount, type, matched_entry_id, bank_account_id')
        .gte('date', from)
        .lte('date', to);
      if (bankAccountId) bankQ = bankQ.eq('bank_account_id', bankAccountId);

      const [{ data: ledger, error: le }, { data: bank, error: be }] = await Promise.all([ledgerQ, bankQ]);
      if (le) throw le;
      if (be) throw be;

      const map = new Map<CanalKey, ChannelReconcileRow>();
      CANAIS.forEach((c) => map.set(c, {
        canal: c, ledgerInflow: 0, ledgerOutflow: 0, ledgerNet: 0,
        ledgerReconciled: 0, ledgerPending: 0, entries: 0,
      }));

      (ledger || []).forEach((r: any) => {
        const key: CanalKey = (r.canal_operacional as CanalKey) || 'sem_canal';
        const row = map.get(key)!;
        const amt = Number(r.amount) || 0;
        row.entries += 1;
        if (r.type === 'inflow' || r.type === 'credit' || r.type === 'in') row.ledgerInflow += amt;
        else row.ledgerOutflow += amt;
        if (r.reconciled) row.ledgerReconciled += amt; else row.ledgerPending += amt;
      });
      map.forEach((r) => { r.ledgerNet = r.ledgerInflow - r.ledgerOutflow; });

      let bankInflow = 0, bankOutflow = 0, bankMatched = 0, bankUnmatched = 0;
      (bank || []).forEach((t: any) => {
        const amt = Number(t.amount) || 0;
        if (t.type === 'credit' || t.type === 'inflow' || t.type === 'in') bankInflow += amt;
        else bankOutflow += amt;
        if (t.matched_entry_id) bankMatched += amt; else bankUnmatched += amt;
      });

      const channels = CANAIS.map((c) => map.get(c)!).filter((r) => r.entries > 0);
      const ledgerNetTotal = channels.reduce((s, r) => s + r.ledgerNet, 0);
      const bankNet = bankInflow - bankOutflow;

      return {
        bankInflow, bankOutflow, bankNet,
        bankMatched, bankUnmatched,
        bankTxCount: (bank || []).length,
        channels,
        divergenceAbs: Math.abs(bankNet - ledgerNetTotal),
      };
    },
    staleTime: 60_000,
  });
}
