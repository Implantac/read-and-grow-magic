import type { NavSection } from '../types';

export const gestaoSection: NavSection = {
  label: 'Gestão & Admin',
  items: [
    {
      title: 'Business Intelligence',
      href: '/relatorios',
      icon: 'BarChart3',
      children: [
        { title: 'BI Comercial', href: '/relatorios/vendas', icon: 'ShoppingBag' },
        { title: 'BI Operacional', href: '/relatorios/producao', icon: 'Factory' },
        { title: 'BI Financeiro', href: '/relatorios/financeiro', icon: 'Wallet' },
      ],
    },
    {
      title: 'Configurações',
      href: '/admin',
      icon: 'Settings',
      children: [
        { title: 'Usuários & Permissões', href: '/admin/usuarios', icon: 'Users' },
        { title: 'Empresas & Filiais', href: '/admin/empresas', icon: 'Building' },
        { title: 'Parâmetros do Sistema', href: '/admin/parametros', icon: 'Sliders' },
        { title: 'Configurações Globais', href: '/admin/configuracoes', icon: 'Settings' },

        { title: 'Workflow Engine', href: '/admin/workflows', icon: 'GitBranch' },
        { title: 'Privacidade (LGPD)', href: '/admin/privacidade', icon: 'ShieldCheck' },
        { title: 'Trilha de Auditoria', href: '/admin/auditoria-sistema', icon: 'History' },
        { title: 'Manual do Sistema', href: '/admin/manual', icon: 'BookOpenCheck' },
        { title: 'Hardening & Evolução', href: '/', icon: 'ShieldCheck' },
      ],
    },
  ],
};
