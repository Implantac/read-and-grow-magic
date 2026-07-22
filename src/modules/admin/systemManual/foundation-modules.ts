import type { ModuleFoundation } from './foundation-types';
import { CORE_FOUNDATION } from './foundation-modules-core';
import { ADMIN_FOUNDATION } from './foundation-modules-admin';

export const MODULE_FOUNDATION: Record<string, ModuleFoundation> = {
  ...CORE_FOUNDATION,
  ...ADMIN_FOUNDATION,
};

const FALLBACK_FOUNDATION: ModuleFoundation = {
  concept: 'Este módulo integra-se aos demais para automatizar processos e preservar a integridade de dados por RLS multi-tenant.',
  businessRules: [
    { rule: 'Toda operação crítica pede confirmação explícita.', reason: 'Reduz erro humano.', severity: 'warning' },
    { rule: 'Toda alteração é auditada.', reason: 'Rastreabilidade.', severity: 'info' },
  ],
  keyMetrics: [],
  routines: [],
  integrations: [],
  antipatterns: ['Operar sem cadastros mestres completos.'],
};

export function getFoundation(slug: string): ModuleFoundation {
  return MODULE_FOUNDATION[slug] ?? FALLBACK_FOUNDATION;
}
