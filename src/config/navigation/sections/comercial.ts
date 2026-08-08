import type { NavSection } from '../types';

export const comercialSection: NavSection = {
  label: 'Comercial & Vendas',
  items: [
    {
      title: 'Comercial',
      href: '/comercial',
      icon: 'Users',
      children: [
        { title: 'Painel Único (PDV)', href: '/comercial/dashboard', icon: 'ShoppingCart' },
        { title: 'CRM Enterprise', href: '/comercial/crm', icon: 'Target' },
        { title: 'Dashboard Comercial', href: '/comercial/dashboard', icon: 'BarChart3' },
        { title: 'Funil de Vendas', href: '/comercial/funil', icon: 'Filter' },
        { title: 'Gestão de Pedidos', href: '/comercial/pedidos', icon: 'ClipboardList' },
        { title: 'Clientes', href: '/comercial/clientes', icon: 'UserCircle' },
        { title: 'Metas & Forecast', href: '/comercial/metas', icon: 'Target' },
        { title: 'Gamificação', href: '/comercial/gamificacao', icon: 'Trophy' },
        { title: 'IA Comercial', href: '/comercial/ia', icon: 'Brain' },
      ],
    },
    {
      title: 'Relacionamento (NPS)',
      href: '/relacionamento',
      icon: 'Heart',
      children: [
        { title: 'NPS Dashboard', href: '/relacionamento/nps/dashboard', icon: 'BarChart3' },
        { title: 'Campanhas & Pesquisas', href: '/relacionamento/nps/campanhas', icon: 'Megaphone' },
        { title: 'Respostas & Feedback', href: '/relacionamento/nps/respostas', icon: 'MessageSquare' },
      ],
    },
  ],
};