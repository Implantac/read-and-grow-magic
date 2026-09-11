import type { ContextAccessCriteria } from '@/core/auth/contextAccess';

export interface NavChild extends ContextAccessCriteria {
  title: string;
  href: string;
  icon: string;
}

export interface NavItem extends ContextAccessCriteria {
  title: string;
  href: string;
  icon: string;
  children?: NavChild[];
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}
