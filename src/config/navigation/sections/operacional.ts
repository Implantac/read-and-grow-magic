import type { NavSection } from '../types';

export const operacionalSection: NavSection = {
  label: 'Operacional & PCP',
  items: [
    {
      title: 'Estoque & Catálogo',
      href: '/estoque',
      icon: 'Package',
      children: [
        { title: 'Produtos & SKUs', href: '/estoque/produtos', icon: 'Box' },
        { title: 'Saldos & Inventário', href: '/estoque/saldos', icon: 'Calculator' },
        { title: 'Movimentações', href: '/estoque/movimentacoes', icon: 'ArrowLeftRight' },
        { title: 'Kardex Central', href: '/estoque/kardex', icon: 'BookOpen' },
      ],
    },
    {
      title: 'Produção (PCP)',
      href: '/producao',
      icon: 'Factory',
      children: [
        { title: 'Painel PCP Industrial', href: '/producao/pcp', icon: 'BarChart3' },
        { title: 'Ordens de Produção', href: '/producao/ordens', icon: 'ClipboardCheck' },
        { title: 'Kanban de Produção', href: '/producao/kanban', icon: 'Columns' },
        { title: 'Terminal Operador', href: '/producao/terminal', icon: 'Smartphone' },
        { title: '🔍 Rastreabilidade', href: '/producao/rastreabilidade', icon: 'Search' },
        { title: '📦 MRP & Insumos', href: '/producao/mrp', icon: 'Package' },
        { title: '🧠 IA Produção', href: '/producao/ia', icon: 'Brain' },
      ],
    },
    {
      title: 'Compras & Suprimentos',
      href: '/compras',
      icon: 'ShoppingCart',
      children: [
        { title: 'Pedidos de Compra', href: '/compras/pedidos', icon: 'ClipboardList' },
        { title: 'Fornecedores', href: '/compras/fornecedores', icon: 'Building2' },
        { title: 'Cotações & BID', href: '/compras/cotacoes', icon: 'FileSearch' },
      ],
    },
  ],
};
