import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { handleMutationError, mutationErrorHandler, toastSuccess } from '@/lib/toastHelpers';
export interface ParsedTx {
  date: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  bank_reference?: string;
}

// Parser CSV simples (formato: date,description,amount[,type])
export function parseCSV(text: string): ParsedTx[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const header = lines[0].toLowerCase().split(/[,;]/).map(h => h.trim());
  const idxDate = header.findIndex(h => /date|data/.test(h));
  const idxDesc = header.findIndex(h => /desc|histor|memo/.test(h));
  const idxAmt  = header.findIndex(h => /amount|valor/.test(h));
  const idxType = header.findIndex(h => /type|tipo|cred|deb/.test(h));
  if (idxDate < 0 || idxAmt < 0) throw new Error('Cabeçalho CSV inválido (espera date e amount)');

  return lines.slice(1).map(line => {
    const cols = line.split(/[,;]/).map(c => c.trim());
    const rawAmt = cols[idxAmt].replace(/\./g,'').replace(',', '.');
    const amount = parseFloat(rawAmt);
    const type: 'credit' | 'debit' = idxType >= 0
      ? (/cred|c|\+/i.test(cols[idxType]) ? 'credit' : 'debit')
      : (amount >= 0 ? 'credit' : 'debit');
    return {
      date: new Date(cols[idxDate]).toISOString(),
      amount: Math.abs(amount),
      type,
      description: idxDesc >= 0 ? cols[idxDesc] : 'Importado',
    };
  }).filter(t => !isNaN(t.amount) && t.amount > 0);
}

// Parser OFX básico
export function parseOFX(text: string): ParsedTx[] {
  const txs: ParsedTx[] = [];
  const re = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const block = m[1];
    const get = (tag: string) => {
      const r = new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i').exec(block);
      return r?.[1]?.trim();
    };
    const dt = get('DTPOSTED');
    const amt = parseFloat(get('TRNAMT') || '0');
    const memo = get('MEMO') || get('NAME') || 'OFX';
    const fitid = get('FITID');
    if (!dt || !amt) continue;
    const iso = `${dt.substring(0,4)}-${dt.substring(4,6)}-${dt.substring(6,8)}`;
    txs.push({
      date: new Date(iso).toISOString(),
      amount: Math.abs(amt),
      type: amt >= 0 ? 'credit' : 'debit',
      description: memo,
      bank_reference: fitid,
    });
  }
  return txs;
}

export function useImportBankStatement() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ txs, bankAccountId }: { txs: ParsedTx[]; bankAccountId?: string }) => {
      if (!bankAccountId) throw new Error('Selecione uma conta bancária');
      // 1) Importação em lote (idempotente via RPC)
      const { data: importData, error: impErr } = await supabase.rpc(
        'import_bank_statement_batch' as any,
        {
          p_bank_account_id: bankAccountId,
          p_transactions: txs.map(t => ({
            date: t.date,
            description: t.description,
            amount: t.amount,
            type: t.type,
            bank_reference: t.bank_reference ?? null,
            source: 'import',
          })),
        }
      );
      if (impErr) throw impErr;
      const row: any = Array.isArray(importData) ? importData[0] : importData;
      const inserted = row?.inserted ?? 0;
      const skipped = row?.skipped ?? 0;

      // 2) Match automático (ledger ↔ bank_transactions)
      const { data: matchData, error: matchErr } = await supabase.rpc(
        'auto_match_bank_transactions' as any,
        { p_bank_account_id: bankAccountId, p_tolerance_days: 3 }
      );
      if (matchErr) throw matchErr;
      const mrow: any = Array.isArray(matchData) ? matchData[0] : matchData;
      const matched = mrow?.matched ?? 0;

      return { inserted, skipped, matched };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['bank_transactions'] });
      qc.invalidateQueries({ queryKey: ['financial_ledger'] });
      qc.invalidateQueries({ queryKey: ['bank_accounts'] });
      toastSuccess('Extrato importado', `${r.inserted} novas · ${r.matched} conciliadas · ${r.skipped} duplicadas ignoradas`);
    },
    onError: mutationErrorHandler('Erro na importação'),
  });
}

export function useAutoMatch() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (bankAccountId?: string) => {
      const { data, error } = await supabase.rpc(
        'auto_match_bank_transactions' as any,
        { p_bank_account_id: bankAccountId ?? null, p_tolerance_days: 3 }
      );
      if (error) throw error;
      const row: any = Array.isArray(data) ? data[0] : data;
      return { matched: row?.matched ?? 0, total: row?.total_pending ?? 0 };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['bank_transactions'] });
      qc.invalidateQueries({ queryKey: ['financial_ledger'] });
      toastSuccess('Match automático', `${r.matched} de ${r.total} transações conciliadas`);
    },
    onError: handleMutationError,
  });
}

export function useManualReconcile() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ bankTxId, ledgerEntryId }: { bankTxId: string; ledgerEntryId: string }) => {
      const { error: e1 } = await supabase.from('bank_transactions')
        .update({ matched_entry_id: ledgerEntryId, status: 'matched' }).eq('id', bankTxId);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from('financial_ledger')
        .update({ reconciled: true, bank_transaction_id: bankTxId }).eq('id', ledgerEntryId);
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank_transactions'] });
      qc.invalidateQueries({ queryKey: ['financial_ledger'] });
      toastSuccess('Conciliado manualmente');
    },
    onError: handleMutationError,
  });
}
