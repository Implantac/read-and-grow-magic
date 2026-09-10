import type { NavSection } from '../types';

export const dashboardSection: NavSection = {
  label: 'Executivo & IA',
  items: [
    { title: 'Visão geral', href: '/dashboard', icon: 'LayoutDashboard' },
    { title: 'Pendências', href: '/pendencias', icon: 'ListChecks' },
    { title: 'IA Digital Director', href: '/executive/executive', icon: 'Brain' },
    { title: 'Native Brain (Autopilot)', href: '/executive/brain', icon: 'Sparkles' },
    { title: 'Use Success Portal', href: '/success', icon: 'Heart' },
  ],
};
