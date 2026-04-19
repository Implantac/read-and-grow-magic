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
      {
        title: '🧠 IA Executiva',
        href: '/diretoria/executive',
        icon: 'Brain',
      },
    ],
  },
  {
    label: 'Operacional',
    items: [
      {
        title: 'Fluxo Operacional',
        href: '/operacional',
        icon: 'ArrowRightLeft',
        children: [
          { title: 'Dashboard Operacional', href: '/operacional/dashboard', icon: 'BarChart3' },
          { title: 'Acompanhamento', href: '/operacional/acompanhamento', icon: 'Eye' },
          { title: 'Separação', href: '/operacional/separacao', icon: 'PackageSearch' },
          { title: 'Conferência', href: '/operacional/conferencia', icon: 'ClipboardCheck' },
          { title: 'Faturamento', href: '/operacional/faturamento', icon: 'FileText' },
          { title: 'Expedição', href: '/operacional/expedicao', icon: 'Truck' },
        ],
      },
      {
        title: 'Comercial',
        href: '/comercial',
        icon: 'Users',
        children: [
          { title: 'Dashboard', href: '/comercial/dashboard', icon: 'BarChart3' },
          { title: '⚡ O Que Fazer Hoje', href: '/comercial/execucao', icon: 'Zap' },
          { title: 'Painel Vendedor', href: '/comercial/vendedor', icon: 'Zap' },
          { title: 'Funil Comercial', href: '/comercial/funil', icon: 'Filter' },
          { title: 'Clientes', href: '/comercial/clientes', icon: 'UserCircle' },
          { title: 'Representantes', href: '/comercial/representantes', icon: 'UserCheck' },
          { title: 'Vendas', href: '/comercial/vendas', icon: 'ShoppingBag' },
          { title: 'Pedidos', href: '/comercial/pedidos', icon: 'ClipboardList' },
          { title: 'Orçamentos', href: '/comercial/orcamentos', icon: 'FileText' },
          { title: 'Comissões', href: '/comercial/comissoes', icon: 'DollarSign' },
          { title: 'Metas', href: '/comercial/metas', icon: 'Target' },
          { title: 'Forecast', href: '/comercial/forecast', icon: 'TrendingUp' },
          { title: 'Campanhas', href: '/comercial/campanhas', icon: 'Megaphone' },
          { title: 'Performance', href: '/comercial/performance', icon: 'BarChart3' },
          { title: '📘 Playbook', href: '/comercial/playbook', icon: 'BookOpen' },
          { title: '🎮 Gamificação', href: '/comercial/gamificacao', icon: 'Trophy' },
          { title: '🧠 IA Comercial', href: '/comercial/ia', icon: 'Brain' },
          { title: '🤖 Automação', href: '/comercial/automacao', icon: 'Bot' },
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
          { title: 'Dashboard Industrial', href: '/producao/dashboard-industrial', icon: 'Gauge' },
          { title: 'Painel PCP', href: '/producao/pcp', icon: 'BarChart3' },
          { title: 'Ordens de Produção', href: '/producao/ordens', icon: 'ClipboardCheck' },
          { title: '📋 Kanban', href: '/producao/kanban', icon: 'Columns' },
          { title: '🏭 Terceirização', href: '/producao/terceirizacao', icon: 'Truck' },
          { title: 'Fila de Produção', href: '/producao/fila', icon: 'ListOrdered' },
          { title: 'Agendamento', href: '/producao/agendamento', icon: 'CalendarClock' },
          { title: 'Chão de Fábrica', href: '/producao/chao-fabrica', icon: 'Activity' },
          { title: '📲 Terminal Operador', href: '/producao/terminal', icon: 'Smartphone' },
          { title: 'Apontamentos', href: '/producao/apontamentos', icon: 'Timer' },
          { title: 'Setores', href: '/producao/setores', icon: 'Building2' },
          { title: '📏 Linhas Produtivas', href: '/producao/linhas', icon: 'Rows3' },
          { title: '🔧 Recursos', href: '/producao/recursos', icon: 'Wrench' },
          { title: '🗺️ Rotas Produtivas', href: '/producao/rotas', icon: 'Route' },
          { title: 'Etapas Produtivas', href: '/producao/etapas', icon: 'Layers' },
          { title: '📄 Fichas Técnicas', href: '/producao/fichas-tecnicas', icon: 'FileText' },
          { title: '⚡ Capacidade', href: '/producao/capacidade', icon: 'Zap' },
          { title: 'Controle de Qualidade', href: '/producao/qualidade', icon: 'ShieldCheck' },
          { title: '🔍 Rastreabilidade', href: '/producao/rastreabilidade', icon: 'Search' },
          { title: '📦 MRP', href: '/producao/mrp', icon: 'Package' },
          { title: 'Estoque de Insumos', href: '/producao/insumos', icon: 'Boxes' },
          { title: 'Consumo MP', href: '/producao/consumo', icon: 'PackageMinus' },
          { title: 'Custo e Lucro', href: '/producao/custos', icon: 'Calculator' },
          { title: '📊 BI Industrial', href: '/producao/bi', icon: 'PieChart' },
          { title: '📊 OEE', href: '/producao/oee', icon: 'CircleGauge' },
          { title: '🧠 IA Produção', href: '/producao/ia', icon: 'Brain' },
          { title: '🤖 ML Predições', href: '/producao/ml', icon: 'Sparkles' },
          { title: '🔮 Digital Twin', href: '/producao/digital-twin', icon: 'Cpu' },
          { title: '🚀 APS', href: '/producao/aps', icon: 'Rocket' },
          { title: '🌐 IoT Monitor', href: '/producao/iot', icon: 'Wifi' },
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
          { title: 'Dashboard', href: '/financeiro/dashboard', icon: 'BarChart3' },
          { title: 'Contas a Pagar', href: '/financeiro/pagar', icon: 'ArrowUpCircle' },
          { title: 'Contas a Receber', href: '/financeiro/receber', icon: 'ArrowDownCircle' },
          { title: 'Fluxo de Caixa', href: '/financeiro/fluxo', icon: 'TrendingUp' },
          { title: 'DRE (Ledger)', href: '/financeiro/dre', icon: 'LineChart' },
          { title: 'Tesouraria', href: '/financeiro/tesouraria', icon: 'Building2' },
          { title: 'Adiantamentos', href: '/financeiro/adiantamentos', icon: 'Wallet' },
          { title: 'Centros de Custo', href: '/financeiro/centros-custo', icon: 'FolderTree' },
          { title: 'Renegociações', href: '/financeiro/renegociacoes', icon: 'RefreshCw' },
          { title: 'Conciliação', href: '/financeiro/conciliacao', icon: 'CheckCircle' },
          { title: 'Cobranças PIX', href: '/financeiro/pix', icon: 'QrCode' },
          { title: 'Boletos', href: '/financeiro/boletos', icon: 'Receipt' },
          { title: 'Cheques', href: '/financeiro/cheques', icon: 'FileCheck' },
          { title: 'Inteligência IA', href: '/financeiro/inteligencia', icon: 'Brain' },
          { title: 'BI Executivo', href: '/financeiro/bi', icon: 'BarChart3' },
          { title: 'Antifraude', href: '/financeiro/antifraude', icon: 'ShieldAlert' },
          { title: 'Importar Extrato', href: '/financeiro/importar-extrato', icon: 'Upload' },
          { title: 'Auditoria Contínua', href: '/financeiro/auditoria', icon: 'ShieldCheck' },
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
          { title: 'Centros de Distrib.', href: '/wms/centros-distribuicao', icon: 'Building2' },
          { title: 'Recebimento', href: '/wms/recebimento', icon: 'PackagePlus' },
          { title: 'Put-Away', href: '/wms/putaway', icon: 'ArrowDown' },
          { title: 'Endereçamento', href: '/wms/enderecamento', icon: 'MapPin' },
          { title: 'Saldos', href: '/wms/saldos', icon: 'Database' },
          { title: 'Picking', href: '/wms/picking', icon: 'PackageSearch' },
          { title: 'Ondas', href: '/wms/ondas', icon: 'Layers' },
          { title: 'Reabastecimento', href: '/wms/reabastecimento', icon: 'RefreshCw' },
          { title: 'Packing', href: '/wms/packing', icon: 'PackageCheck' },
          { title: 'Conferência', href: '/wms/conferencia', icon: 'ScanBarcode' },
          { title: 'Docas', href: '/wms/docas', icon: 'DoorOpen' },
          { title: 'Expedição', href: '/wms/expedicao', icon: 'Truck' },
          { title: 'Devoluções', href: '/wms/devolucoes', icon: 'RotateCcw' },
          { title: 'Inventário', href: '/wms/inventario', icon: 'ClipboardList' },
          { title: 'Lotes', href: '/wms/lotes', icon: 'Layers' },
          { title: 'Movimentações', href: '/wms/movimentacoes', icon: 'MoveHorizontal' },
          { title: 'IA WMS', href: '/wms/ia', icon: 'Brain' },
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
      {
        title: 'TMS - Transporte',
        href: '/tms',
        icon: 'Truck',
        children: [
          { title: 'Dashboard TMS', href: '/tms/dashboard', icon: 'LayoutDashboard' },
          { title: 'Transportadoras', href: '/tms/transportadoras', icon: 'Building2' },
          { title: 'Veículos / Frota', href: '/tms/veiculos', icon: 'Truck' },
          { title: 'Rotas de Entrega', href: '/tms/rotas', icon: 'MapPin' },
          { title: 'Comprovantes', href: '/tms/comprovantes', icon: 'FileCheck' },
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
          { title: 'Relatório Diário', href: '/admin/relatorio-diario', icon: 'FileText' },
        ],
      },
    ],
  },
];

// Flat list for backward compatibility
export const navigationItems = navigationSections.flatMap((s) => s.items);
