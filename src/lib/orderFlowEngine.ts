/**
 * Order Flow Engine - Controlled status transitions with validation rules.
 * Enterprise-grade order lifecycle management.
 */

export type OrderStatus =
  | 'quote' | 'pending'
  | 'awaiting_commercial_approval' | 'awaiting_financial_approval'
  | 'blocked' | 'confirmed'
  | 'awaiting_separation' | 'in_separation'
  | 'awaiting_production' | 'in_production' | 'partial_production'
  | 'awaiting_conference' | 'conferenced'
  | 'awaiting_billing' | 'invoiced'
  | 'shipped' | 'delivered' | 'cancelled';

// Allowed transitions: from → to[]
const TRANSITIONS: Record<string, string[]> = {
  quote: ['pending', 'cancelled'],
  pending: ['awaiting_commercial_approval', 'awaiting_financial_approval', 'confirmed', 'cancelled'],
  awaiting_commercial_approval: ['awaiting_financial_approval', 'confirmed', 'blocked', 'cancelled'],
  awaiting_financial_approval: ['confirmed', 'blocked', 'cancelled'],
  blocked: ['confirmed', 'cancelled'],
  confirmed: ['awaiting_separation', 'awaiting_production', 'awaiting_billing', 'cancelled'],
  awaiting_separation: ['in_separation', 'cancelled'],
  in_separation: ['awaiting_conference', 'awaiting_separation', 'cancelled'],
  awaiting_production: ['in_production', 'cancelled'],
  in_production: ['partial_production', 'awaiting_conference', 'awaiting_separation', 'cancelled'],
  partial_production: ['in_production', 'awaiting_conference', 'awaiting_separation', 'cancelled'],
  awaiting_conference: ['conferenced', 'cancelled'],
  conferenced: ['awaiting_billing', 'cancelled'],
  awaiting_billing: ['invoiced', 'cancelled'],
  invoiced: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export function getAllowedTransitions(currentStatus: string): string[] {
  return TRANSITIONS[currentStatus] || [];
}

export function canTransition(from: string, to: string): boolean {
  return getAllowedTransitions(from).includes(to);
}

// Business rule validations
export interface TransitionValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateTransition(
  from: string,
  to: string,
  context?: {
    hasFinancialApproval?: boolean;
    hasCommercialApproval?: boolean;
    isSeparated?: boolean;
    isConferenced?: boolean;
    isBlocked?: boolean;
    hasStockForAllItems?: boolean;
    hasProductionItems?: boolean;
  }
): TransitionValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!canTransition(from, to)) {
    errors.push(`Transição de "${getStatusLabel(from)}" para "${getStatusLabel(to)}" não é permitida.`);
    return { valid: false, errors, warnings };
  }

  if (context) {
    // Blocked orders can only go to confirmed or cancelled
    if (context.isBlocked && to !== 'confirmed' && to !== 'cancelled') {
      errors.push('Pedido bloqueado - necessita liberação antes de prosseguir.');
    }

    // Can't invoice without financial approval
    if (to === 'awaiting_billing' || to === 'invoiced') {
      if (context.hasFinancialApproval === false) {
        errors.push('Pedido sem aprovação financeira não pode ser faturado.');
      }
    }

    // Can't go to conference without separation
    if (to === 'awaiting_conference' && context.isSeparated === false) {
      errors.push('Itens precisam ser separados antes da conferência.');
    }

    // Can't invoice without conference
    if (to === 'awaiting_billing' && context.isConferenced === false) {
      errors.push('Conferência precisa ser concluída antes do faturamento.');
    }

    // Warn if items need production
    if ((to === 'awaiting_separation') && context.hasProductionItems) {
      warnings.push('Existem itens que podem precisar de produção antes da separação.');
    }

    // Warn if stock insufficient
    if (to === 'awaiting_separation' && context.hasStockForAllItems === false) {
      warnings.push('Nem todos os itens possuem saldo em estoque suficiente.');
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// Status groups for filtering
export const STATUS_GROUPS = {
  approval: ['pending', 'awaiting_commercial_approval', 'awaiting_financial_approval', 'blocked'],
  production: ['awaiting_production', 'in_production', 'partial_production'],
  logistics: ['awaiting_separation', 'in_separation', 'awaiting_conference', 'conferenced'],
  billing: ['awaiting_billing', 'invoiced'],
  delivery: ['shipped', 'delivered'],
  closed: ['delivered', 'cancelled'],
} as const;

export function getStatusGroup(status: string): string {
  for (const [group, statuses] of Object.entries(STATUS_GROUPS)) {
    if ((statuses as readonly string[]).includes(status)) return group;
  }
  return 'other';
}

const STATUS_LABELS: Record<string, string> = {
  quote: 'Orçamento',
  pending: 'Digitado',
  awaiting_commercial_approval: 'Aguard. Aprov. Comercial',
  awaiting_financial_approval: 'Aguard. Aprov. Financeira',
  blocked: 'Bloqueado',
  confirmed: 'Liberado',
  awaiting_separation: 'Aguard. Separação',
  in_separation: 'Em Separação',
  awaiting_production: 'Aguard. Produção',
  in_production: 'Em Produção',
  partial_production: 'Produção Parcial',
  awaiting_conference: 'Aguard. Conferência',
  conferenced: 'Conferido',
  awaiting_billing: 'Aguard. Faturamento',
  invoiced: 'Faturado',
  shipped: 'Expedido',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

/**
 * Returns the visual flow steps for a progress indicator
 */
export const ORDER_FLOW_STEPS = [
  { key: 'pending', label: 'Digitado', group: 'approval' },
  { key: 'confirmed', label: 'Liberado', group: 'approval' },
  { key: 'awaiting_separation', label: 'Separação', group: 'logistics' },
  { key: 'awaiting_conference', label: 'Conferência', group: 'logistics' },
  { key: 'awaiting_billing', label: 'Faturamento', group: 'billing' },
  { key: 'shipped', label: 'Expedição', group: 'delivery' },
  { key: 'delivered', label: 'Entregue', group: 'delivery' },
];

export function getFlowStepIndex(status: string): number {
  const stepMap: Record<string, number> = {
    quote: -1, pending: 0,
    awaiting_commercial_approval: 0, awaiting_financial_approval: 0,
    blocked: 0, confirmed: 1,
    awaiting_separation: 2, in_separation: 2,
    awaiting_production: 2, in_production: 2, partial_production: 2,
    awaiting_conference: 3, conferenced: 3,
    awaiting_billing: 4, invoiced: 4,
    shipped: 5, delivered: 6, cancelled: -2,
  };
  return stepMap[status] ?? -1;
}
