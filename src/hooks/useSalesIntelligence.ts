import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';
import { differenceInDays, subDays, format } from 'date-fns';

import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
// ─── Types ───────────────────────────────────────────────────────────────
export interface DbOpportunity {
  id: string;
  client_id: string;
  sales_rep_id: string | null;
  opportunity_type: string;
  title: string;
  description: string | null;
  priority: string;
  suggested_products: any;
  estimated_value: number;
  status: string;
  contacted_at: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbFollowUp {
  id: string;
  client_id: string;
  sales_rep_id: string | null;
  funnel_id: string | null;
  order_id: string | null;
  type: string;
  subject: string;
  description: string | null;
  scheduled_date: string;
  completed_at: string | null;
  status: string;
  result: string | null;
  next_action: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCampaign {
  id: string;
  name: string;
  description: string | null;
  campaign_type: string;
  target_products: any;
  target_segments: any;
  goal_type: string;
  goal_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  incentive_description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DbDailyTarget {
  id: string;
  sales_rep_id: string;
  target_date: string;
  daily_target: number;
  achieved_value: number;
  orders_count: number;
  contacts_made: number;
  opportunities_converted: number;
  created_at: string;
  updated_at: string;
}

// ─── Opportunities ───────────────────────────────────────────────────────
export function useOpportunities(status?: string) {
  return useQuery({
    queryKey: ['sales_opportunities', status],
    queryFn: async () => {
      let q = supabase.from('sales_opportunities').select('*').order('priority', { ascending: true }).order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return data as DbOpportunity[];
    },
  });
}

export function useCreateOpportunity() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (item: Partial<DbOpportunity>) => {
      const { data, error } = await supabase.from('sales_opportunities').insert(item as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales_opportunities'] });
      toastSuccess('Oportunidade criada');
    },
    onError: handleMutationError,
  });
}

export function useUpdateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbOpportunity> & { id: string }) => {
      const { data, error } = await supabase.from('sales_opportunities').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales_opportunities'] }),
  });
}

// ─── Follow-ups ──────────────────────────────────────────────────────────
export function useFollowUps(status?: string) {
  return useQuery({
    queryKey: ['follow_ups', status],
    queryFn: async () => {
      let q = supabase.from('follow_ups').select('*').order('scheduled_date', { ascending: true });
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return data as DbFollowUp[];
    },
  });
}

export function useCreateFollowUp() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (item: Partial<DbFollowUp>) => {
      const { data, error } = await supabase.from('follow_ups').insert(item as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follow_ups'] });
      toastSuccess('Follow-up agendado');
    },
    onError: handleMutationError,
  });
}

export function useUpdateFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbFollowUp> & { id: string }) => {
      const { data, error } = await supabase.from('follow_ups').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['follow_ups'] }),
  });
}

// ─── Campaigns ───────────────────────────────────────────────────────────
export function useCampaigns(status?: string) {
  return useQuery({
    queryKey: ['sales_campaigns', status],
    queryFn: async () => {
      let q = supabase.from('sales_campaigns').select('*').order('start_date', { ascending: false });
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return data as DbCampaign[];
    },
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (item: Partial<DbCampaign>) => {
      const { data, error } = await supabase.from('sales_campaigns').insert(item as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales_campaigns'] });
      toastSuccess('Campanha criada');
    },
    onError: handleMutationError,
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbCampaign> & { id: string }) => {
      const { data, error } = await supabase.from('sales_campaigns').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales_campaigns'] }),
  });
}

// ─── Daily Targets ───────────────────────────────────────────────────────
export function useDailyTargets(repId?: string) {
  return useQuery({
    queryKey: ['seller_daily_targets', repId],
    queryFn: async () => {
      let q = supabase.from('seller_daily_targets').select('*').order('target_date', { ascending: false });
      if (repId) q = q.eq('sales_rep_id', repId);
      const { data, error } = await q;
      if (error) throw error;
      return data as DbDailyTarget[];
    },
  });
}

// ─── Client Intelligence (computed from existing data) ───────────────────
export interface ClientInsight {
  clientId: string;
  clientName: string;
  clientCode: string;
  segment: string | null;
  lastPurchaseDate: string | null;
  daysSinceLastPurchase: number;
  totalPurchases: number;
  avgTicket: number;
  purchaseFrequency: number;
  estimatedPotential: number;
  classification: string | null;
  score: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'none';
  opportunityType: string;
  suggestedAction: string;
  salesRepId: string | null;
}

export function useClientInsights(clients: any[], orders: any[], sales: any[]) {
  return useMemo(() => {
    const now = new Date();
    const insights: ClientInsight[] = [];

    clients.forEach(client => {
      // Calculate metrics from orders
      const clientOrders = orders.filter((o: any) => o.client_id === client.id && o.status !== 'cancelled');
      const clientSales = sales.filter((s: any) => s.client_id === client.id && s.status !== 'cancelled');
      
      const allTransactions = [
        ...clientOrders.map((o: any) => ({ date: o.date, total: o.total })),
        ...clientSales.map((s: any) => ({ date: s.date, total: s.total })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const lastDate = client.last_purchase_date || (allTransactions[0]?.date ?? null);
      const daysSince = lastDate ? differenceInDays(now, new Date(lastDate)) : 999;
      const totalValue = allTransactions.reduce((s: number, t: any) => s + t.total, 0);
      const avgTicket = allTransactions.length > 0 ? totalValue / allTransactions.length : 0;
      const frequency = client.purchase_frequency || 0;
      const potential = client.estimated_potential || 0;

      // Risk assessment
      let riskLevel: ClientInsight['riskLevel'] = 'none';
      let opportunityType = '';
      let suggestedAction = '';

      if (daysSince > 90) {
        riskLevel = 'critical';
        opportunityType = 'reactivation';
        suggestedAction = `Cliente inativo há ${daysSince} dias. Ligar para reativar.`;
      } else if (daysSince > 60) {
        riskLevel = 'high';
        opportunityType = 'winback';
        suggestedAction = `Sem compra há ${daysSince} dias. Oferecer condição especial.`;
      } else if (daysSince > 30) {
        riskLevel = 'medium';
        opportunityType = 'follow_up';
        suggestedAction = `Último pedido há ${daysSince} dias. Fazer follow-up.`;
      } else if (potential > avgTicket * 2) {
        riskLevel = 'low';
        opportunityType = 'upsell';
        suggestedAction = `Potencial de R$ ${potential.toFixed(0)} vs ticket médio R$ ${avgTicket.toFixed(0)}. Oferecer upgrade.`;
      } else if (avgTicket > 0) {
        riskLevel = 'none';
        opportunityType = 'cross_sell';
        suggestedAction = 'Cliente ativo. Sugerir produtos complementares.';
      }

      if (client.status === 'active' && (riskLevel !== 'none' || potential > 0)) {
        insights.push({
          clientId: client.id,
          clientName: client.name,
          clientCode: client.code,
          segment: client.segment,
          lastPurchaseDate: lastDate,
          daysSinceLastPurchase: daysSince,
          totalPurchases: totalValue,
          avgTicket,
          purchaseFrequency: frequency,
          estimatedPotential: potential,
          classification: client.abc_classification,
          score: client.client_score || 'C',
          riskLevel,
          opportunityType,
          suggestedAction,
          salesRepId: client.sales_rep_id,
        });
      }
    });

    // Sort: critical first, then by potential
    insights.sort((a, b) => {
      const riskOrder = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
      const rDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      if (rDiff !== 0) return rDiff;
      return b.estimatedPotential - a.estimatedPotential;
    });

    return insights;
  }, [clients, orders, sales]);
}

// ─── Product Suggestions (cross-sell / upsell) ──────────────────────────
export interface ProductSuggestion {
  productId: string;
  productName: string;
  productCode: string;
  reason: string;
  estimatedValue: number;
  confidence: 'high' | 'medium' | 'low';
}

export function useProductSuggestions(clientId: string | null, orders: any[], sales: any[], products: any[]) {
  return useMemo(() => {
    if (!clientId || products.length === 0) return [];

    // Collect all items this client has purchased
    const purchasedProductIds = new Set<string>();
    const purchasedCategories = new Set<string>();
    const itemFrequency: Record<string, number> = {};

    const clientOrders = orders.filter((o: any) => o.client_id === clientId && o.status !== 'cancelled');
    const clientSales = sales.filter((s: any) => s.client_id === clientId && s.status !== 'cancelled');

    [...clientOrders, ...clientSales].forEach((o: any) => {
      (o.items || []).forEach((item: any) => {
        if (item.product_id) {
          purchasedProductIds.add(item.product_id);
          itemFrequency[item.product_id] = (itemFrequency[item.product_id] || 0) + 1;
        }
      });
    });

    // Find product categories the client buys
    products.forEach(p => {
      if (purchasedProductIds.has(p.id) && p.category_id) {
        purchasedCategories.add(p.category_id);
      }
    });

    const suggestions: ProductSuggestion[] = [];

    // Cross-sell: same category, not purchased
    products.forEach(p => {
      if (purchasedProductIds.has(p.id) || p.status !== 'active') return;

      if (p.category_id && purchasedCategories.has(p.category_id)) {
        suggestions.push({
          productId: p.id,
          productName: p.name,
          productCode: p.code,
          reason: 'Mesmo segmento de produtos que o cliente já compra',
          estimatedValue: p.sale_price,
          confidence: 'high',
        });
      }
    });

    // Upsell: higher-margin products in same categories
    const avgPrice = products.filter(p => purchasedProductIds.has(p.id))
      .reduce((s, p) => s + p.sale_price, 0) / Math.max(purchasedProductIds.size, 1);

    products.forEach(p => {
      if (purchasedProductIds.has(p.id) || p.status !== 'active') return;
      if (suggestions.find(s => s.productId === p.id)) return;

      const margin = p.cost_price > 0 ? ((p.sale_price - p.cost_price) / p.sale_price) * 100 : 0;
      if (margin > 40 && p.sale_price > avgPrice) {
        suggestions.push({
          productId: p.id,
          productName: p.name,
          productCode: p.code,
          reason: `Alta margem (${margin.toFixed(0)}%) — produto premium`,
          estimatedValue: p.sale_price,
          confidence: 'medium',
        });
      }
    });

    return suggestions.slice(0, 10);
  }, [clientId, orders, sales, products]);
}

// ─── Sales Script Generator ──────────────────────────────────────────────
export interface SalesScript {
  approach: string;
  openingLine: string;
  keyPoints: string[];
  objectionHandlers: string[];
  closingTechnique: string;
}

export function useSalesScript(client: any | null, insight: ClientInsight | null): SalesScript | null {
  return useMemo(() => {
    if (!client || !insight) return null;

    const isHighValue = insight.avgTicket > 5000;
    const isInactive = insight.daysSinceLastPurchase > 60;
    const isPriceOriented = (client.default_payment_condition || '').includes('prazo');
    const classification = insight.classification || 'C';

    if (isInactive) {
      return {
        approach: '🔄 Reativação — tom amigável e consultivo',
        openingLine: `Olá! Sentimos sua falta. Faz ${insight.daysSinceLastPurchase} dias desde seu último pedido.`,
        keyPoints: [
          'Perguntar o motivo da pausa',
          'Apresentar novidades desde a última compra',
          'Oferecer condição exclusiva de retorno',
        ],
        objectionHandlers: [
          '"Preço alto" → Destacar condições de pagamento flexíveis',
          '"Sem necessidade" → Perguntar sobre estoque e reposição',
          '"Mudou de fornecedor" → Pedir feedback e oferecer teste',
        ],
        closingTechnique: 'Oferecer pedido inicial com desconto especial de reativação.',
      };
    }

    if (classification === 'A' || isHighValue) {
      return {
        approach: '👑 VIP — foco em valor e relacionamento',
        openingLine: `Como um dos nossos clientes mais importantes, tenho uma proposta especial.`,
        keyPoints: [
          'Reforçar parceria de longo prazo',
          'Apresentar lançamentos em primeira mão',
          'Sugerir aumento de mix de produtos',
        ],
        objectionHandlers: [
          '"Já tenho estoque" → Sugerir agendamento futuro com preço travado',
          '"Concorrente ofereceu melhor" → Destacar qualidade e pós-venda',
        ],
        closingTechnique: 'Fechar com exclusividade: "Essa condição é só para nossos parceiros principais."',
      };
    }

    if (isPriceOriented) {
      return {
        approach: '💰 Sensível a preço — focar economia e condições',
        openingLine: `Tenho uma oportunidade de economia que pode interessar.`,
        keyPoints: [
          'Mostrar economia em volume',
          'Destacar condições de pagamento',
          'Comparar custo-benefício',
        ],
        objectionHandlers: [
          '"Muito caro" → Parcelar ou oferecer desconto progressivo',
          '"Vou pensar" → Criar urgência com prazo da oferta',
        ],
        closingTechnique: 'Ancoragem: mostrar preço cheio e depois o desconto especial.',
      };
    }

    return {
      approach: '📋 Padrão — consultivo e focado em necessidades',
      openingLine: `Vim verificar se posso ajudar com alguma necessidade.`,
      keyPoints: [
        'Entender necessidades atuais',
        'Sugerir produtos complementares',
        'Apresentar novidades do catálogo',
      ],
      objectionHandlers: [
        '"Sem orçamento" → Sugerir quantidade menor ou parcelamento',
        '"Preciso de aprovação" → Enviar proposta formal para decisor',
      ],
      closingTechnique: 'Fechar com pergunta direta: "Posso incluir no pedido?"',
    };
  }, [client, insight]);
}

// ─── Lost Sales Alerts ───────────────────────────────────────────────────
export interface LostSaleAlert {
  type: 'stagnant_funnel' | 'no_followup' | 'expired_quote' | 'cancelled_order';
  title: string;
  description: string;
  estimatedLoss: number;
  referenceId: string;
  daysSince: number;
  clientName: string;
}

export function useLostSalesAlerts(funnel: any[], orders: any[], followUps: any[]) {
  return useMemo(() => {
    const now = new Date();
    const alerts: LostSaleAlert[] = [];

    // Stagnant funnel items (> 14 days no update)
    funnel.filter(f => f.status === 'open').forEach(f => {
      const days = differenceInDays(now, new Date(f.updated_at || f.created_at));
      if (days > 14) {
        alerts.push({
          type: 'stagnant_funnel',
          title: `Oportunidade parada: ${f.title}`,
          description: `Parada há ${days} dias na etapa atual. Valor: R$ ${f.value.toFixed(2)}`,
          estimatedLoss: f.value,
          referenceId: f.id,
          daysSince: days,
          clientName: f.contact_name || 'N/A',
        });
      }
    });

    // Cancelled orders
    orders.filter(o => o.status === 'cancelled').forEach(o => {
      const days = differenceInDays(now, new Date(o.date));
      if (days <= 30) {
        alerts.push({
          type: 'cancelled_order',
          title: `Pedido cancelado: ${o.number}`,
          description: `Cancelado há ${days} dias. Cliente: ${o.client_name}`,
          estimatedLoss: o.total,
          referenceId: o.id,
          daysSince: days,
          clientName: o.client_name,
        });
      }
    });

    // Overdue follow-ups without completion
    followUps.filter(f => f.status === 'pending').forEach(f => {
      const days = differenceInDays(now, new Date(f.scheduled_date));
      if (days > 3) {
        alerts.push({
          type: 'no_followup',
          title: `Follow-up atrasado: ${f.subject}`,
          description: `Atrasado há ${days} dias sem retorno`,
          estimatedLoss: 0,
          referenceId: f.id,
          daysSince: days,
          clientName: f.subject,
        });
      }
    });

    alerts.sort((a, b) => b.estimatedLoss - a.estimatedLoss);
    return alerts;
  }, [funnel, orders, followUps]);
}

// ─── Performance Metrics ─────────────────────────────────────────────────
export interface RepPerformance {
  repId: string;
  repName: string;
  totalSales: number;
  ordersCount: number;
  avgTicket: number;
  conversionRate: number;
  avgCycleTime: number;
  lostDeals: number;
  wonDeals: number;
  clientsServed: number;
  ranking: number;
  monthlyTarget: number;
  targetPct: number;
}

export function useRepPerformance(reps: any[], orders: any[], funnel: any[]) {
  return useMemo(() => {
    const performances: RepPerformance[] = reps.map(rep => {
      const repOrders = orders.filter((o: any) => o.sales_rep_id === rep.id && o.status !== 'cancelled');
      const total = repOrders.reduce((s: number, o: any) => s + o.total, 0);
      const repFunnel = funnel.filter((f: any) => f.sales_rep_id === rep.id);
      const won = repFunnel.filter((f: any) => f.status === 'won').length;
      const lost = repFunnel.filter((f: any) => f.status === 'lost').length;
      const conversion = (won + lost) > 0 ? (won / (won + lost)) * 100 : 0;
      const uniqueClients = new Set(repOrders.map((o: any) => o.client_id)).size;
      const target = rep.monthly_target || 0;

      return {
        repId: rep.id,
        repName: rep.name,
        totalSales: total,
        ordersCount: repOrders.length,
        avgTicket: repOrders.length > 0 ? total / repOrders.length : 0,
        conversionRate: conversion,
        avgCycleTime: 0,
        lostDeals: lost,
        wonDeals: won,
        clientsServed: uniqueClients,
        ranking: 0,
        monthlyTarget: target,
        targetPct: target > 0 ? (total / target) * 100 : 0,
      };
    });

    performances.sort((a, b) => b.totalSales - a.totalSales);
    performances.forEach((p, i) => { p.ranking = i + 1; });

    return performances;
  }, [reps, orders, funnel]);
}
