import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
      // Inserir bank_transactions evitando duplicidade por bank_reference
      let inserted = 0;
      let skipped = 0;
      for (const tx of txs) {
        if (tx.bank_reference) {
          const { data: dup } = await supabase.from('bank_transactions')
            .select('id').eq('bank_reference', tx.bank_reference).maybeSingle();
          if (dup) { skipped++; continue; }
        }
        const { error } = await supabase.from('bank_transactions').insert({
          date: tx.date, amount: tx.amount, type: tx.type,
          description: tx.description, bank_reference: tx.bank_reference ?? null, status: 'unmatched',
        });
        if (!error) inserted++;
      }
      // Tentar match automático
      const { data: pendings } = await supabase.from('bank_transactions')
        .select('id').eq('status', 'unmatched').order('created_at', { ascending: false }).limit(inserted);
      let matched = 0;
      for (const p of pendings ?? []) {
        const { data: r } = await supabase.rpc('match_bank_transaction', { _bank_tx_id: p.id });
        if ((r as any)?.ok) matched++;
      }
      return { inserted, skipped, matched };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['bank_transactions'] });
      qc.invalidateQueries({ queryKey: ['financial_ledger'] });
      toast({ title: 'Extrato importado', description: `${r.inserted} transações · ${r.matched} conciliadas · ${r.skipped} duplicadas ignoradas` });
    },
    onError: (e: any) => toast({ title: 'Erro na importação', description: e.message, variant: 'destructive' }),
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
      toast({ title: 'Conciliado manualmente' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}
