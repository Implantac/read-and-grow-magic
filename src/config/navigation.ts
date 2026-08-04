import type { NavSection } from '../types';
import { dashboardSection } from './sections/dashboard';
import { comercialSection } from './sections/comercial';
import { operacionalSection } from './sections/operacional';
import { financeiroSection } from './sections/financeiro';
import { logisticaSection } from './sections/logistica';
import { gestaoSection } from './sections/gestao';
import { verticaisSection } from './sections/verticais';

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
