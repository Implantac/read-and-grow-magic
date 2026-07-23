import type { NavSection } from '../types';

export const dashboardSection: NavSection = {
  label: 'Dashboard',
  items: [
    { title: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { title: '🧠 IA Executiva', href: '/executive/executive', icon: 'Brain' },
    { title: '💚 Use Success', href: '/success', icon: 'Heart' },
    { title: '🧠 Cérebro Nativo', href: '/executive/brain', icon: 'Sparkles' },
  ],
};
