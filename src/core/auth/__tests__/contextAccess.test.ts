import { describe, expect, it } from 'vitest';
import { evaluateContextAccess, getRouteContextCriteria } from '../contextAccess';

const storeContext = {
  unitType: 'STORE' as const,
  channel: 'VAREJO_PDV' as const,
  scope: 'SINGLE_UNIT' as const,
  role: 'operator' as const,
  permissions: ['sales.read'],
};

describe('contextAccess', () => {
  it('permite o PDV no contexto de loja e varejo', () => {
    const criteria = getRouteContextCriteria('/comercial/pdv');
    expect(criteria).not.toBeNull();
    expect(evaluateContextAccess(criteria ?? {}, storeContext)).toEqual({ allowed: true, reason: null });
  });

  it('bloqueia produção no contexto de loja', () => {
    const criteria = getRouteContextCriteria('/producao/pcp');
    expect(evaluateContextAccess(criteria ?? {}, storeContext)).toEqual({ allowed: false, reason: 'unit-type' });
  });

  it('bloqueia página unitária na visão consolidada', () => {
    const criteria = getRouteContextCriteria('/wms/recebimento');
    const result = evaluateContextAccess(criteria ?? {}, {
      ...storeContext,
      unitType: 'DISTRIBUTION_CENTER',
      channel: 'CONSOLIDADO',
      scope: 'CONSOLIDATED',
    });
    expect(result.allowed).toBe(false);
  });

  it('permite área administrativa somente aos perfis autorizados', () => {
    const criteria = getRouteContextCriteria('/admin/usuarios');
    expect(evaluateContextAccess(criteria ?? {}, storeContext).reason).toBe('role');
    expect(evaluateContextAccess(criteria ?? {}, { ...storeContext, role: 'admin' }).allowed).toBe(true);
  });

  it('mantém rotas gerais sem restrição contextual', () => {
    expect(getRouteContextCriteria('/dashboard')).toBeNull();
    expect(getRouteContextCriteria('/financeiro/dashboard')).toBeNull();
  });
});