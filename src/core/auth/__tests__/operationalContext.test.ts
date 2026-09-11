import { describe, expect, it } from 'vitest';
import {
  getDefaultChannel,
  normalizeUnitType,
  resolveContextSelection,
  type OperationalUnit,
} from '../operationalContext';

const units: OperationalUnit[] = [
  {
    id: 'store-1',
    name: 'Loja Centro',
    unitType: 'STORE',
    defaultChannel: 'VAREJO_PDV',
    allowedChannels: ['VAREJO_PDV'],
  },
  {
    id: 'factory-1',
    name: 'Indústria Matriz',
    unitType: 'INDUSTRY',
    defaultChannel: 'ATACADO_INDUSTRIA',
    allowedChannels: ['ATACADO_INDUSTRIA'],
  },
];

describe('contexto operacional canônico', () => {
  it.each([
    ['filial', 'STORE'],
    ['factory', 'INDUSTRY'],
    ['indústria', 'INDUSTRY'],
    ['cd', 'DISTRIBUTION_CENTER'],
    ['office', 'OFFICE'],
    ['atacado', 'WHOLESALE'],
  ])('normaliza %s como %s', (legacy, expected) => {
    expect(normalizeUnitType(legacy)).toBe(expected);
  });

  it('define o canal padrão pelo tipo da unidade', () => {
    expect(getDefaultChannel('STORE')).toBe('VAREJO_PDV');
    expect(getDefaultChannel('INDUSTRY')).toBe('ATACADO_INDUSTRIA');
  });

  it('seleciona somente uma unidade autorizada', () => {
    const result = resolveContextSelection(units, { unitId: 'factory-1', scope: 'SINGLE_UNIT' }, false);
    expect(result).toEqual({ unit: units[1], channel: 'ATACADO_INDUSTRIA', scope: 'SINGLE_UNIT' });
  });

  it('recusa canal incompatível com a unidade', () => {
    expect(() => resolveContextSelection(
      units,
      { unitId: 'store-1', channel: 'ATACADO_INDUSTRIA', scope: 'SINGLE_UNIT' },
      false,
    )).toThrow('não é compatível');
  });

  it('restringe visão consolidada a perfil autorizado', () => {
    expect(() => resolveContextSelection(units, { unitId: null, scope: 'CONSOLIDATED' }, false))
      .toThrow('não possui acesso');
    expect(resolveContextSelection(units, { unitId: null, scope: 'CONSOLIDATED' }, true))
      .toEqual({ unit: null, channel: 'CONSOLIDADO', scope: 'CONSOLIDATED' });
  });
});
