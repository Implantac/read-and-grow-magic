import type { UserRole } from '@/stores/useAppStore';
import type { OperationalChannel, OperationalScope, OperationalUnitType } from './operationalContext';

export interface ContextAccessCriteria {
  unitTypes?: OperationalUnitType[];
  channels?: OperationalChannel[];
  scopes?: OperationalScope[];
  roles?: UserRole[];
  permission?: string;
}

export interface OperationalAccessContext {
  unitType: OperationalUnitType | null;
  channel: OperationalChannel;
  scope: OperationalScope;
  role: UserRole | null;
  permissions: string[];
}

export type ContextAccessReason =
  | null
  | 'unit-type'
  | 'channel'
  | 'scope'
  | 'role'
  | 'permission';

export interface ContextAccessResult {
  allowed: boolean;
  reason: ContextAccessReason;
}

export function evaluateContextAccess(
  criteria: ContextAccessCriteria,
  context: OperationalAccessContext,
): ContextAccessResult {
  if (criteria.unitTypes?.length && (!context.unitType || !criteria.unitTypes.includes(context.unitType))) {
    return { allowed: false, reason: 'unit-type' };
  }

  if (criteria.channels?.length && !criteria.channels.includes(context.channel)) {
    return { allowed: false, reason: 'channel' };
  }

  if (criteria.scopes?.length && !criteria.scopes.includes(context.scope)) {
    return { allowed: false, reason: 'scope' };
  }

  if (criteria.roles?.length && (!context.role || !criteria.roles.includes(context.role))) {
    return { allowed: false, reason: 'role' };
  }

  if (
    criteria.permission
    && !context.permissions.includes('all')
    && !context.permissions.includes(criteria.permission)
  ) {
    return { allowed: false, reason: 'permission' };
  }

  return { allowed: true, reason: null };
}

const ROUTE_CRITERIA: Array<{ prefix: string; criteria: ContextAccessCriteria }> = [
  {
    prefix: '/comercial/pdv',
    criteria: { unitTypes: ['STORE'], channels: ['VAREJO_PDV'], scopes: ['SINGLE_UNIT'] },
  },
  {
    prefix: '/producao',
    criteria: { unitTypes: ['INDUSTRY'], channels: ['ATACADO_INDUSTRIA'], scopes: ['SINGLE_UNIT'] },
  },
  {
    prefix: '/wms',
    criteria: {
      unitTypes: ['DISTRIBUTION_CENTER', 'INDUSTRY'],
      channels: ['ATACADO_INDUSTRIA'],
      scopes: ['SINGLE_UNIT'],
    },
  },
  {
    prefix: '/rfid',
    criteria: {
      unitTypes: ['DISTRIBUTION_CENTER', 'INDUSTRY'],
      channels: ['ATACADO_INDUSTRIA'],
      scopes: ['SINGLE_UNIT'],
    },
  },
  {
    prefix: '/admin',
    criteria: { roles: ['admin', 'manager', 'system_admin', 'admin_matriz'] },
  },
];

export function getRouteContextCriteria(pathname: string): ContextAccessCriteria | null {
  return ROUTE_CRITERIA.find(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.criteria ?? null;
}