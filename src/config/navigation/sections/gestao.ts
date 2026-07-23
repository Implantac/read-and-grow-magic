import type { NavSection } from '../types';

export const gestaoSection: NavSection = {
  label: 'Gestão',
  items: [
    {
      title: 'Relatórios',
      href: '/relatorios',
      icon: 'BarChart3',
      children: [
        { title: 'Vendas', href: '/relatorios/vendas', icon: 'ShoppingBag' },
        { title: 'Estoque', href: '/relatorios/estoque', icon: 'Package' },
        { title: 'Financeiro', href: '/relatorios/financeiro', icon: 'Wallet' },
        { title: 'Produção', href: '/relatorios/producao', icon: 'Factory' },
      ],
    },
    {
      title: 'Administração',
      href: '/admin',
      icon: 'Settings',
      children: [
        { title: 'Usuários', href: '/admin/usuarios', icon: 'Users' },
        { title: 'Empresas', href: '/admin/empresas', icon: 'Building' },
        { title: 'Parâmetros', href: '/admin/parametros', icon: 'Sliders' },
        { title: 'Relatório Diário', href: '/admin/relatorio-diario', icon: 'FileText' },
        { title: 'Auditoria Cross-Módulos', href: '/admin/auditoria-cross', icon: 'Activity' },
        { title: 'Auditoria Crítica (Imutável)', href: '/admin/auditoria-critica', icon: 'ShieldAlert' },
        { title: 'Metadata Engine', href: '/admin/metadata', icon: 'Database' },
        { title: 'Workflow Engine', href: '/admin/workflows', icon: 'GitBranch' },
        { title: 'Caixa de Workflows', href: '/workflows/inbox', icon: 'Inbox' },
        { title: 'Automation Engine', href: '/admin/automacoes', icon: 'Zap' },
        { title: 'Dashboard Engine', href: '/admin/dashboards', icon: 'LayoutDashboard' },
        { title: 'Auditoria de Segurança', href: '/admin/seguranca/auditoria', icon: 'ShieldAlert' },
        { title: 'Manual do Sistema', href: '/admin/manual', icon: 'BookOpenCheck' },
      ],
    },
  ],
};
