import { useMemo } from 'react';
import { type DbClient } from './useClients';
import { type DbOrder } from './useOrders';

export interface CommercialValidation {
  type: 'block' | 'approval' | 'warning';
  code: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

interface OrderValidationInput {
  client: DbClient | null;
  subtotal: number;
  discount: number;
  discountPct: number;
  maxDiscountPct: number;
  paymentCondition: string;
  isNewClient: boolean;
}

const MARGIN_MINIMUM_PCT = 15;
const INACTIVE_DAYS_THRESHOLD = 90;

export function validateOrder(input: OrderValidationInput): CommercialValidation[] {
  const validations: CommercialValidation[] = [];
  const { client, subtotal, discount, discountPct, maxDiscountPct, isNewClient } = input;

  if (!client) return validations;

  // Block: Client is blocked
  if (client.status === 'blocked') {
    validations.push({
      type: 'block',
      code: 'CLIENT_BLOCKED',
      message: `Cliente "${client.name}" está bloqueado. Pedido não pode ser emitido.`,
      severity: 'high',
    });
  }

  // Block: Credit limit exceeded
  const totalWithBalance = (client.current_balance || 0) + subtotal - discount;
  if (client.credit_limit > 0 && totalWithBalance > client.credit_limit) {
    validations.push({
      type: 'block',
      code: 'CREDIT_LIMIT_EXCEEDED',
      message: `Limite de crédito excedido. Saldo atual: R$ ${client.current_balance?.toFixed(2)} + pedido R$ ${(subtotal - discount).toFixed(2)} > Limite R$ ${client.credit_limit.toFixed(2)}`,
      severity: 'high',
    });
  }

  // Block: Discount above allowed
  if (maxDiscountPct > 0 && discountPct > maxDiscountPct) {
    validations.push({
      type: 'block',
      code: 'DISCOUNT_EXCEEDED',
      message: `Desconto de ${discountPct.toFixed(1)}% excede o máximo permitido de ${maxDiscountPct}%.`,
      severity: 'high',
    });
  }

  // Approval: High discount
  if (discountPct > 5 && discountPct <= maxDiscountPct) {
    validations.push({
      type: 'approval',
      code: 'HIGH_DISCOUNT',
      message: `Desconto de ${discountPct.toFixed(1)}% requer aprovação comercial.`,
      severity: 'medium',
    });
  }

  // Approval: New client
  if (isNewClient) {
    validations.push({
      type: 'approval',
      code: 'NEW_CLIENT',
      message: 'Primeiro pedido do cliente. Requer aprovação especial.',
      severity: 'medium',
    });
  }

  // Warning: Inactive client
  if (client.last_purchase_date) {
    const daysSince = Math.floor((Date.now() - new Date(client.last_purchase_date).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > INACTIVE_DAYS_THRESHOLD) {
      validations.push({
        type: 'warning',
        code: 'INACTIVE_CLIENT',
        message: `Cliente sem compra há ${daysSince} dias.`,
        severity: 'low',
      });
    }
  }

  // Warning: Client near credit limit (>80%)
  if (client.credit_limit > 0) {
    const usage = ((client.current_balance || 0) + subtotal - discount) / client.credit_limit;
    if (usage > 0.8 && usage <= 1) {
      validations.push({
        type: 'warning',
        code: 'NEAR_CREDIT_LIMIT',
        message: `Cliente está usando ${(usage * 100).toFixed(0)}% do limite de crédito.`,
        severity: 'low',
      });
    }
  }

  return validations;
}

export function useCommercialInsights(clients: DbClient[], orders: DbOrder[]) {
  return useMemo(() => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

    // Clients without purchase in 90+ days
    const inactiveClients = clients.filter(c => {
      if (c.status === 'blocked') return false;
      if (!c.last_purchase_date) return true;
      return new Date(c.last_purchase_date).getTime() < ninetyDaysAgo;
    });

    // Stuck orders (pending for >3 days)
    const stuckOrders = orders.filter(o => {
      if (['delivered', 'cancelled'].includes(o.status)) return false;
      const created = new Date(o.created_at).getTime();
      const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
      return created < threeDaysAgo && ['pending'].includes(o.status);
    });

    // Pending approvals
    const pendingApprovals = orders.filter(o =>
      o.status === 'pending' && (o.commercial_approval === 'pending' || o.financial_approval === 'pending')
    );

    // Orders by region
    const regionMap: Record<string, { count: number; total: number }> = {};
    orders.filter(o => o.status !== 'cancelled').forEach(o => {
      const client = clients.find(c => c.id === o.client_id);
      const region = client?.region || 'Sem Região';
      if (!regionMap[region]) regionMap[region] = { count: 0, total: 0 };
      regionMap[region].count++;
      regionMap[region].total += o.total;
    });
    const topRegions = Object.entries(regionMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Revenue forecast (based on pending + confirmed orders)
    const revenueForecast = orders
      .filter(o => ['pending', 'confirmed', 'processing', 'separated'].includes(o.status))
      .reduce((s, o) => s + o.total, 0);

    // ABC distribution
    const abcDist = {
      A: clients.filter(c => c.abc_classification === 'A').length,
      B: clients.filter(c => c.abc_classification === 'B').length,
      C: clients.filter(c => !c.abc_classification || c.abc_classification === 'C').length,
    };

    return {
      inactiveClients,
      stuckOrders,
      pendingApprovals,
      topRegions,
      revenueForecast,
      abcDist,
    };
  }, [clients, orders]);
}
