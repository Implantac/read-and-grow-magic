import type { NavSection } from '../types';

export const redeOperacionalSection: NavSection = {
  label: 'Rede & Distribuição',
  items: [
    {
      title: 'Rede Operacional',
      href: '/operacional/rede',
      icon: 'Network',
      children: [
        { title: 'Central da Loja', href: '/operacional/loja/central', icon: 'Store' },
        { title: 'Terminais PDV', href: '/operacional/rede/pdvs', icon: 'Monitor' },
        { title: 'Transferências de Estoque', href: '/operacional/rede/transferencias', icon: 'Truck' },
      { title: 'Inteligência de Reposição', href: '/operacional/rede/ressuprimento', icon: 'Brain' },
        { title: 'Torre de Controle', href: '/dashboard', icon: 'LayoutDashboard' },
      ],
    },
  ],
};
