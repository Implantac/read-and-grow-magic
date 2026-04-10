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
  in_production: ['partial_production', 'awaiting_conference', 'cancelled'],
  partial_production: ['in_production', 'awaiting_conference', 'cancelled'],
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
  }
): TransitionValidation {
  const errors: string[] = [];

  if (!canTransition(from, to)) {
    errors.push(`Transição de "${from}" para "${to}" não é permitida.`);
    return { valid: false, errors };
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
  }

  return { valid: errors.length === 0, errors };
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
