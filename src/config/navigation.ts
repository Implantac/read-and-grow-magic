import type { NavSection } from './navigation/types';
import { dashboardSection } from './navigation/sections/dashboard';
import { comercialSection } from './navigation/sections/comercial';
import { operacionalSection } from './navigation/sections/operacional';
import { financeiroSection } from './navigation/sections/financeiro';
import { logisticaSection } from './navigation/sections/logistica';
import { gestaoSection } from './navigation/sections/gestao';
import { verticaisSection } from './navigation/sections/verticais';

export type { NavChild, NavItem, NavSection } from './navigation/types';

export const navigationSections: NavSection[] = [
  dashboardSection,
  comercialSection,
  operacionalSection,
  logisticaSection,
  financeiroSection,
  gestaoSection,
  verticaisSection,
];

// Flat list for backward compatibility
export const navigationItems = navigationSections.flatMap((s) => s.items);
