import type { NavSection } from '../types';

export const redeOperacionalSection: NavSection = {
  label: 'Rede & Distribuição',
  items: [
    {
      title: 'Central de Abastecimento',
      href: '/operacional/abastecimento',
      icon: 'ArrowRightLeft',
      children: [
        { title: 'Painel Gerencial', href: '/operacional/abastecimento', icon: 'LayoutDashboard' },
        { title: 'Torre de Controle', href: '/operacional/rede/painel', icon: 'Layers' },
      ],
    },
  ],
};
