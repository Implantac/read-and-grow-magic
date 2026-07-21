import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCanalStore } from '@/stores/useCanalStore';

export interface ReconcileRow {
  product_id: string;
  product_code: string | null;
  product_name: string | null;
  branch_id: string | null;
  canal_operacional: string | null;
  qty_faturado: number;
  qty_saida_fisica: number;
  divergencia: number;
}

export interface ReconcileParams {
  from: string; // ISO date
  to: string;   // ISO date
}

export function useBillingStockReconcile(params: ReconcileParams) {
  const { canal, lojaId } = useCanalStore();

  return useQuery({
    queryKey: ['billing-stock-reconcile', params.from, params.to, canal, lojaId],
    queryFn: async (): Promise<ReconcileRow[]> => {
      const fromIso = new Date(params.from).toISOString();
      const toIso = new Date(new Date(params.to).getTime() + 86400000 - 1).toISOString();

      // NFe items (Atacado)
      let nfeQ = supabase
        .from('nfe')
        .select('id, branch_id, canal_operacional, issue_date, status, nfe_items(product_id, product_code, product_name, quantity)')
        .in('status', ['authorized', 'autorizada'])
        .gte('issue_date', fromIso)
        .lte('issue_date', toIso);
      if (canal !== 'CONSOLIDADO') nfeQ = nfeQ.eq('canal_operacional', canal);
      if (lojaId) nfeQ = nfeQ.eq('branch_id', lojaId);

      // NFCe items (Varejo)
      let nfceQ = supabase
        .from('nfce')
        .select('id, branch_id, canal_operacional, issue_date, status, nfce_items(product_id, product_code, product_name, quantity)')
        .in('status', ['authorized', 'autorizada'])
        .gte('issue_date', fromIso)
        .lte('issue_date', toIso);
      if (canal !== 'CONSOLIDADO') nfceQ = nfceQ.eq('canal_operacional', canal);
      if (lojaId) nfceQ = nfceQ.eq('branch_id', lojaId);

      // Stock movements OUT
      let smQ = supabase
        .from('stock_movements')
        .select('product_id, product_code, product_name, quantity, direction, type, branch_id, canal_operacional, created_at')
        .eq('direction', 'out')
        .gte('created_at', fromIso)
        .lte('created_at', toIso);
      if (canal !== 'CONSOLIDADO') smQ = smQ.eq('canal_operacional', canal);
      if (lojaId) smQ = smQ.eq('branch_id', lojaId);

      const [nfeR, nfceR, smR] = await Promise.all([nfeQ, nfceQ, smQ]);
      if (nfeR.error) throw nfeR.error;
      if (nfceR.error) throw nfceR.error;
      if (smR.error) throw smR.error;

      const map = new Map<string, ReconcileRow>();
      const key = (pid: string, bid: string | null, canal: string | null) =>
        `${pid}::${bid ?? ''}::${canal ?? ''}`;

      const upsert = (
        pid: string,
        code: string | null,
        name: string | null,
        bid: string | null,
        canal: string | null,
        qty: number,
        field: 'qty_faturado' | 'qty_saida_fisica',
      ) => {
        const k = key(pid, bid, canal);
        const cur = map.get(k) ?? {
          product_id: pid,
          product_code: code,
          product_name: name,
          branch_id: bid,
          canal_operacional: canal,
          qty_faturado: 0,
          qty_saida_fisica: 0,
          divergencia: 0,
        };
        cur[field] += Number(qty) || 0;
        map.set(k, cur);
      };

      for (const doc of nfeR.data ?? []) {
        for (const it of (doc as any).nfe_items ?? []) {
          if (!it.product_id) continue;
          upsert(it.product_id, it.product_code, it.product_name, (doc as any).branch_id, (doc as any).canal_operacional, it.quantity, 'qty_faturado');
        }
      }
      for (const doc of nfceR.data ?? []) {
        for (const it of (doc as any).nfce_items ?? []) {
          if (!it.product_id) continue;
          upsert(it.product_id, it.product_code, it.product_name, (doc as any).branch_id, (doc as any).canal_operacional, it.quantity, 'qty_faturado');
        }
      }
      for (const m of smR.data ?? []) {
        if (!m.product_id) continue;
        upsert(m.product_id, m.product_code, m.product_name, m.branch_id, m.canal_operacional, m.quantity, 'qty_saida_fisica');
      }

      const rows = Array.from(map.values()).map((r) => ({
        ...r,
        divergencia: Number((r.qty_faturado - r.qty_saida_fisica).toFixed(4)),
      }));
      rows.sort((a, b) => Math.abs(b.divergencia) - Math.abs(a.divergencia));
      return rows;
    },
    staleTime: 60_000,
  });
}
