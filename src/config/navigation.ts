import type { NavSection } from './navigation/types';
import { verticaisSection } from './navigation/sections/verticais';
import { dashboardSection } from './navigation/sections/dashboard';
import { operacionalSection } from './navigation/sections/operacional';
import { financeiroSection } from './navigation/sections/financeiro';
import { logisticaSection } from './navigation/sections/logistica';
import { gestaoSection } from './navigation/sections/gestao';

export type { NavChild, NavItem, NavSection } from './navigation/types';

export const navigationSections: NavSection[] = [
  verticaisSection,
  dashboardSection,
  operacionalSection,
  financeiroSection,
  logisticaSection,
  gestaoSection,
];

// Flat list for backward compatibility
export const navigationItems = navigationSections.flatMap((s) => s.items);
