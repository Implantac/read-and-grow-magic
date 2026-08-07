import type { NavSection } from '../types';

export const redeOperacionalSection: NavSection = {
  label: 'Rede & Distribuição',
  items: [
    {
      title: 'Rede Operacional',
      href: '/operacional/rede',
      icon: 'Network',
      children: [
        { title: 'Operação da Loja', href: '/operacional/loja/operacao', icon: 'Store' },
        { title: 'Painel Gerencial', href: '/operacional/loja/central', icon: 'LayoutDashboard' },
        { title: 'Terminais PDV', href: '/operacional/rede/pos', icon: 'Monitor' },
        { title: 'Transferências de Estoque', href: '/operacional/rede/transferencias', icon: 'Truck' },
        { title: 'Inteligência de Reposição', href: '/operacional/rede/ressuprimento', icon: 'Brain' },
        { title: 'Torre de Controle', href: '/operacional/rede/control-tower', icon: 'Network' },
      ],
    },
  ],
};
