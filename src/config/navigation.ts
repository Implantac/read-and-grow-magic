export interface NavChild {
  title: string;
  href: string;
  icon: string;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  children?: NavChild[];
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

export const navigationSections: NavSection[] = [
  {
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: 'LayoutDashboard',
      },
    ],
  },
  {
    label: 'Operacional',
    items: [
      {
        title: 'Comercial',
        href: '/comercial',
        icon: 'Users',
        children: [
          { title: 'Dashboard', href: '/comercial/dashboard', icon: 'BarChart3' },
          { title: 'Funil Comercial', href: '/comercial/funil', icon: 'Filter' },
          { title: 'Clientes', href: '/comercial/clientes', icon: 'UserCircle' },
          { title: 'Representantes', href: '/comercial/representantes', icon: 'UserCheck' },
          { title: 'Vendas', href: '/comercial/vendas', icon: 'ShoppingBag' },
          { title: 'Pedidos', href: '/comercial/pedidos', icon: 'ClipboardList' },
          { title: 'Orçamentos', href: '/comercial/orcamentos', icon: 'FileText' },
          { title: 'Comissões', href: '/comercial/comissoes', icon: 'DollarSign' },
          { title: 'Metas', href: '/comercial/metas', icon: 'Target' },
          { title: 'Forecast', href: '/comercial/forecast', icon: 'TrendingUp' },
        ],
      },
      {
        title: 'Compras',
        href: '/compras',
        icon: 'ShoppingCart',
        children: [
          { title: 'Fornecedores', href: '/compras/fornecedores', icon: 'Building2' },
          { title: 'Pedidos de Compra', href: '/compras/pedidos', icon: 'ClipboardList' },
          { title: 'Cotações', href: '/compras/cotacoes', icon: 'FileSearch' },
        ],
      },
      {
        title: 'Produção',
        href: '/producao',
        icon: 'Factory',
        children: [
          { title: 'Ordens de Produção', href: '/producao/ordens', icon: 'ClipboardCheck' },
          { title: 'Consumo MP', href: '/producao/consumo', icon: 'PackageMinus' },
          { title: 'Apontamentos', href: '/producao/apontamentos', icon: 'Timer' },
        ],
      },
      {
        title: 'Estoque',
        href: '/estoque',
        icon: 'Package',
        children: [
          { title: 'Produtos', href: '/estoque/produtos', icon: 'Box' },
          { title: 'Categorias', href: '/estoque/categorias', icon: 'FolderTree' },
          { title: 'Movimentações', href: '/estoque/movimentacoes', icon: 'ArrowLeftRight' },
          { title: 'Kardex', href: '/estoque/kardex', icon: 'BookOpen' },
          { title: 'Saldos', href: '/estoque/saldos', icon: 'Calculator' },
        ],
      },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      {
        title: 'Financeiro',
        href: '/financeiro',
        icon: 'Wallet',
        children: [
          { title: 'Contas a Pagar', href: '/financeiro/pagar', icon: 'ArrowUpCircle' },
          { title: 'Contas a Receber', href: '/financeiro/receber', icon: 'ArrowDownCircle' },
          { title: 'Fluxo de Caixa', href: '/financeiro/fluxo', icon: 'TrendingUp' },
          { title: 'Conciliação', href: '/financeiro/conciliacao', icon: 'CheckCircle' },
        ],
      },
      {
        title: 'Crédito & Risco',
        href: '/credito',
        icon: 'ShieldCheck',
        children: [
          { title: 'Dashboard Risco', href: '/credito/dashboard', icon: 'BarChart3' },
          { title: 'Análise de Crédito', href: '/credito/analise', icon: 'Shield' },
          { title: 'Bloqueios', href: '/credito/bloqueios', icon: 'Lock' },
          { title: 'Cobrança', href: '/credito/cobranca', icon: 'Phone' },
        ],
      },
      {
        title: 'Contabilidade',
        href: '/contabilidade',
        icon: 'Calculator',
        children: [
          { title: 'Painel Executivo', href: '/contabilidade/painel', icon: 'BarChart3' },
          { title: 'Plano de Contas', href: '/contabilidade/plano-contas', icon: 'FolderTree' },
          { title: 'Lançamentos', href: '/contabilidade/lancamentos', icon: 'FileText' },
          { title: 'Razão Contábil', href: '/contabilidade/razao', icon: 'BookOpen' },
          { title: 'Balancete', href: '/contabilidade/balancete', icon: 'Scale' },
          { title: 'DRE', href: '/contabilidade/dre', icon: 'TrendingUp' },
          { title: 'Balanço Patrimonial', href: '/contabilidade/balanco', icon: 'Building2' },
        ],
      },
      {
        title: 'Fiscal',
        href: '/fiscal',
        icon: 'FileCheck',
        children: [
          { title: 'NF-e', href: '/fiscal/nfe', icon: 'FileText' },
          { title: 'NFC-e', href: '/fiscal/nfce', icon: 'Receipt' },
          { title: 'Relatórios Fiscais', href: '/fiscal/relatorios', icon: 'BarChart3' },
        ],
      },
    ],
  },
  {
    label: 'Logística',
    items: [
      {
        title: 'WMS',
        href: '/wms',
        icon: 'Warehouse',
        children: [
          { title: 'Dashboard WMS', href: '/wms/dashboard', icon: 'LayoutDashboard' },
          { title: 'Recebimento', href: '/wms/recebimento', icon: 'PackagePlus' },
          { title: 'Endereçamento', href: '/wms/enderecamento', icon: 'MapPin' },
          { title: 'Picking', href: '/wms/picking', icon: 'PackageSearch' },
          { title: 'Packing', href: '/wms/packing', icon: 'PackageCheck' },
          { title: 'Inventário', href: '/wms/inventario', icon: 'ClipboardList' },
          { title: 'Movimentações', href: '/wms/movimentacoes', icon: 'MoveHorizontal' },
        ],
      },
      {
        title: 'RFID',
        href: '/rfid',
        icon: 'Radio',
        children: [
          { title: 'Dashboard RFID', href: '/rfid/dashboard', icon: 'LayoutDashboard' },
          { title: 'Leitores', href: '/rfid/leitores', icon: 'Wifi' },
          { title: 'Tags', href: '/rfid/tags', icon: 'Tag' },
          { title: 'Eventos', href: '/rfid/eventos', icon: 'Activity' },
          { title: 'Integração WMS', href: '/rfid/integracao', icon: 'ArrowLeftRight' },
        ],
      },
    ],
  },
  {
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
        ],
      },
    ],
  },
];

// Flat list for backward compatibility
export const navigationItems = navigationSections.flatMap((s) => s.items);
