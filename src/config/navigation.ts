import type { NavItem, NavSection } from './navigation/types';
import type { OperationalAccessContext } from '@/core/auth/contextAccess';
import { evaluateContextAccess } from '@/core/auth/contextAccess';
import { dashboardSection } from './navigation/sections/dashboard';
import { comercialSection } from './navigation/sections/comercial';
import { operacionalSection } from './navigation/sections/operacional';
import { redeOperacionalSection } from './navigation/sections/rede';
import { financeiroSection } from './navigation/sections/financeiro';
import { logisticaSection } from './navigation/sections/logistica';
import { gestaoSection } from './navigation/sections/gestao';
import { verticaisSection } from './navigation/sections/verticais';

export type { NavChild, NavItem, NavSection } from './navigation/types';

export const navigationSections: NavSection[] = [
  dashboardSection,
  comercialSection,
  operacionalSection,
  redeOperacionalSection,
  logisticaSection,
  financeiroSection,
  gestaoSection,
  verticaisSection,
];

// Flat list for backward compatibility
export const navigationItems = navigationSections.flatMap((s) => s.items);

export function getNavigationForContext(context: OperationalAccessContext): NavSection[] {
  return navigationSections.flatMap((section) => {
    const items = section.items.flatMap((item) => {
      const children = item.children?.filter((child) => evaluateContextAccess(child, context).allowed);
      const itemAllowed = evaluateContextAccess(item, context).allowed;

      if (!itemAllowed && (!children || children.length === 0)) return [];

      const nextItem: NavItem = children ? { ...item, children } : item;
      return [nextItem];
    });

    return items.length > 0 ? [{ ...section, items }] : [];
  });
}
