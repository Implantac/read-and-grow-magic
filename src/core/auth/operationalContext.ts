export type OperationalUnitType =
  | 'STORE'
  | 'INDUSTRY'
  | 'DISTRIBUTION_CENTER'
  | 'OFFICE'
  | 'WHOLESALE';

export type OperationalChannel = 'CONSOLIDADO' | 'VAREJO_PDV' | 'ATACADO_INDUSTRIA';
export type OperationalScope = 'CONSOLIDATED' | 'SINGLE_UNIT' | 'MULTI_UNIT';

export interface OperationalUnit {
  id: string;
  name: string;
  code?: string;
  unitType: OperationalUnitType;
  defaultChannel: Exclude<OperationalChannel, 'CONSOLIDADO'>;
  allowedChannels: Array<Exclude<OperationalChannel, 'CONSOLIDADO'>>;
}

export interface SwitchContextInput {
  companyId: string;
  unitId?: string | null;
  channel?: OperationalChannel;
  scope?: OperationalScope;
}

const UNIT_TYPE_ALIASES: Record<string, OperationalUnitType> = {
  STORE: 'STORE',
  LOJA: 'STORE',
  FILIAL: 'STORE',
  INDUSTRY: 'INDUSTRY',
  INDUSTRIA: 'INDUSTRY',
  FACTORY: 'INDUSTRY',
  FABRICA: 'INDUSTRY',
  DISTRIBUTION_CENTER: 'DISTRIBUTION_CENTER',
  CD: 'DISTRIBUTION_CENTER',
  OFFICE: 'OFFICE',
  ESCRITORIO: 'OFFICE',
  ADMINISTRATIVO: 'OFFICE',
  WHOLESALE: 'WHOLESALE',
  ATACADO: 'WHOLESALE',
};

export function normalizeUnitType(value: string | null | undefined): OperationalUnitType {
  if (!value) return 'STORE';
  const normalized = value.trim().toUpperCase().replace(/[ÁÀÂÃ]/g, 'A').replace(/Í/g, 'I');
  return UNIT_TYPE_ALIASES[normalized] ?? 'STORE';
}

export function getDefaultChannel(unitType: OperationalUnitType): Exclude<OperationalChannel, 'CONSOLIDADO'> {
  return unitType === 'STORE' ? 'VAREJO_PDV' : 'ATACADO_INDUSTRIA';
}

export function getAllowedChannels(unitType: OperationalUnitType): Array<Exclude<OperationalChannel, 'CONSOLIDADO'>> {
  return [getDefaultChannel(unitType)];
}

export function isChannelAllowed(unit: OperationalUnit, channel: OperationalChannel): boolean {
  return channel === 'CONSOLIDADO' || unit.allowedChannels.includes(channel);
}

export function resolveContextSelection(
  units: OperationalUnit[],
  input: Omit<SwitchContextInput, 'companyId'>,
  allowConsolidated: boolean,
): { unit: OperationalUnit | null; channel: OperationalChannel; scope: OperationalScope } {
  const requestedScope = input.scope ?? (input.unitId === null ? 'CONSOLIDATED' : 'SINGLE_UNIT');

  if (requestedScope !== 'SINGLE_UNIT') {
    if (!allowConsolidated) throw new Error('Seu perfil não possui acesso à visão consolidada.');
    return { unit: null, channel: 'CONSOLIDADO', scope: requestedScope };
  }

  const unit = units.find((candidate) => candidate.id === input.unitId) ?? units[0] ?? null;
  if (!unit) throw new Error('Nenhuma unidade operacional autorizada foi encontrada.');

  const channel = input.channel && input.channel !== 'CONSOLIDADO'
    ? input.channel
    : unit.defaultChannel;

  if (!isChannelAllowed(unit, channel)) {
    throw new Error('O canal selecionado não é compatível com esta unidade.');
  }

  return { unit, channel, scope: 'SINGLE_UNIT' };
}
