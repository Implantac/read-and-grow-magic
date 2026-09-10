import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnterprise } from '@/core/auth/EnterpriseContext';

export type PendingSeverity = 'critical' | 'attention' | 'pending' | 'info';

export interface PendingItem {
  id: string;
  severity: PendingSeverity;
  title: string;
  description: string;
  count: number;
  actionLabel: string;
  href: string;
}

const LATE_TRANSIT_DAYS = 3;

/**
 * Lê pendências reais da operação (sem números fictícios).
 * Quando não há dado, o item simplesmente não aparece.
 */
async function loadPendingWork(companyId: string): Promise<PendingItem[]> {
  const lateLimit = new Date(Date.now() - LATE_TRANSIT_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [ordersRes, balancesRes] = await Promise.all([
    (supabase as any)
      .from('stock_transfer_orders')
      .select('id, current_status, shipped_at')
      .eq('company_id', companyId)
      .limit(2000),
    (supabase as any)
      .from('stock_balances')
      .select('product_id, quantity, reserved_qty, in_transit_qty, products(min_stock)')
      .eq('company_id', companyId)
      .limit(3000),
  ]);

  const orders: any[] = ordersRes?.data || [];
  const balances: any[] = balancesRes?.data || [];

  const byStatus = (statuses: string[]) =>
    orders.filter((o) => statuses.includes(String(o.current_status || '')));

  const awaitingApproval = byStatus(['SUGERIDA']).length;
  const toReceive = byStatus(['EXPEDIDA', 'EM TRÂNSITO']).length;
  const late = orders.filter(
    (o) => String(o.current_status || '') === 'EM TRÂNSITO' && o.shipped_at && o.shipped_at < lateLimit
  ).length;
  const divergent = byStatus(['RECEBIDA COM DIVERGÊNCIA', 'RECEBIDA PARCIAL']).length;

  let ruptureRisk = 0;
  for (const row of balances) {
    const min = Number(row?.products?.min_stock ?? 0);
    if (min <= 0) continue;
    const available =
      Number(row.quantity || 0) - Number(row.reserved_qty || 0) + Number(row.in_transit_qty || 0);
    if (available < min) ruptureRisk += 1;
  }

  const items: PendingItem[] = [];

  if (ruptureRisk > 0) {
    items.push({
      id: 'rupture',
      severity: 'critical',
      title: `${ruptureRisk} ${ruptureRisk === 1 ? 'produto abaixo do mínimo' : 'produtos abaixo do mínimo'}`,
      description: 'O estoque disponível não cobre o mínimo definido. Peça reposição antes de faltar.',
      count: ruptureRisk,
      actionLabel: 'Pedir reposição',
      href: '/operacional/rede/ressuprimento',
    });
  }

  if (divergent > 0) {
    items.push({
      id: 'divergence',
      severity: 'critical',
      title: `${divergent} ${divergent === 1 ? 'recebimento com divergência' : 'recebimentos com divergência'}`,
      description: 'Faltou, sobrou ou chegou avariado. Trate antes de encerrar a transferência.',
      count: divergent,
      actionLabel: 'Tratar divergência',
      href: '/operacional/rede/transferencias',
    });
  }

  if (late > 0) {
    items.push({
      id: 'late',
      severity: 'attention',
      title: `${late} ${late === 1 ? 'mercadoria atrasada' : 'mercadorias atrasadas'}`,
      description: `Saiu há mais de ${LATE_TRANSIT_DAYS} dias e ainda não foi recebida.`,
      count: late,
      actionLabel: 'Acompanhar',
      href: '/operacional/rede/transferencias',
    });
  }

  if (awaitingApproval > 0) {
    items.push({
      id: 'approval',
      severity: 'attention',
      title: `${awaitingApproval} ${awaitingApproval === 1 ? 'transferência aguardando aprovação' : 'transferências aguardando aprovação'}`,
      description: 'Alguém pediu mercadoria e está esperando sua liberação.',
      count: awaitingApproval,
      actionLabel: 'Revisar',
      href: '/operacional/rede/transferencias',
    });
  }

  if (toReceive > 0) {
    items.push({
      id: 'receive',
      severity: 'pending',
      title: `${toReceive} ${toReceive === 1 ? 'mercadoria a receber' : 'mercadorias a receber'}`,
      description: 'Confira item a item e registre falta, sobra ou avaria.',
      count: toReceive,
      actionLabel: 'Receber',
      href: '/operacional/rede/receber',
    });
  }

  return items;
}

export function usePendingWork() {
  const { currentCompany } = useEnterprise();
  const companyId = currentCompany?.id;

  const query = useQuery({
    queryKey: ['pending-work', companyId],
    queryFn: () => loadPendingWork(companyId as string),
    enabled: !!companyId,
    staleTime: 60 * 1000,
  });

  return {
    items: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    hasCompany: !!companyId,
  };
}
