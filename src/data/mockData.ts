import type { User, Company, KPICard, Alert, Activity, ChartData } from '@/types';

// Mock User
export const mockUser: User = {
  id: '1',
  name: 'Carlos Silva',
  email: 'carlos.silva@empresa.com.br',
  role: 'admin',
  permissions: ['all'],
};

// Mock Companies
export const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'TechLogística Ltda',
    cnpj: '12.345.678/0001-90',
    branches: [
      { id: '1', name: 'Matriz - São Paulo', code: 'SP01', companyId: '1' },
      { id: '2', name: 'Filial - Rio de Janeiro', code: 'RJ01', companyId: '1' },
      { id: '3', name: 'CD - Campinas', code: 'CP01', companyId: '1' },
    ],
  },
];

// Dashboard KPIs
export const mockKPIs: KPICard[] = [
  {
    id: '1',
    title: 'Faturamento Mensal',
    value: 'R$ 1.285.430',
    change: 12.5,
    changeType: 'increase',
    icon: 'DollarSign',
    color: 'primary',
  },
  {
    id: '2',
    title: 'Lucro Líquido',
    value: 'R$ 248.920',
    change: 8.3,
    changeType: 'increase',
    icon: 'TrendingUp',
    color: 'success',
  },
  {
    id: '3',
    title: 'Pedidos Hoje',
    value: '156',
    change: -3.2,
    changeType: 'decrease',
    icon: 'ShoppingCart',
    color: 'info',
  },
  {
    id: '4',
    title: 'Entregas Pendentes',
    value: '47',
    change: 15,
    changeType: 'increase',
    icon: 'Truck',
    color: 'warning',
  },
  {
    id: '5',
    title: 'Itens em Estoque',
    value: '12.458',
    change: 2.1,
    changeType: 'increase',
    icon: 'Package',
    color: 'primary',
  },
  {
    id: '6',
    title: 'Produtividade WMS',
    value: '94.2%',
    change: 5.7,
    changeType: 'increase',
    icon: 'Activity',
    color: 'success',
  },
];

// Revenue Chart Data (Monthly)
export const revenueChartData: ChartData[] = [
  { name: 'Jan', value: 980000, expenses: 720000 },
  { name: 'Fev', value: 1050000, expenses: 780000 },
  { name: 'Mar', value: 1120000, expenses: 810000 },
  { name: 'Abr', value: 1080000, expenses: 790000 },
  { name: 'Mai', value: 1200000, expenses: 850000 },
  { name: 'Jun', value: 1150000, expenses: 820000 },
  { name: 'Jul', value: 1285430, expenses: 890000 },
];

// Sales by Category
export const salesByCategoryData: ChartData[] = [
  { name: 'Eletrônicos', value: 35 },
  { name: 'Vestuário', value: 25 },
  { name: 'Alimentos', value: 20 },
  { name: 'Cosméticos', value: 12 },
  { name: 'Outros', value: 8 },
];

// Order Status Distribution
export const orderStatusData: ChartData[] = [
  { name: 'Entregues', value: 245, color: 'hsl(var(--success))' },
  { name: 'Em Trânsito', value: 89, color: 'hsl(var(--info))' },
  { name: 'Pendentes', value: 47, color: 'hsl(var(--warning))' },
  { name: 'Cancelados', value: 12, color: 'hsl(var(--destructive))' },
];

// Alerts
export const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Estoque Baixo',
    description: '15 produtos estão abaixo do estoque mínimo',
    module: 'Estoque',
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: '2',
    type: 'error',
    title: 'Contas Vencidas',
    description: '3 contas a pagar venceram ontem (R$ 15.420,00)',
    module: 'Financeiro',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    read: false,
  },
  {
    id: '3',
    type: 'info',
    title: 'Novo Pedido Grande',
    description: 'Cliente ABC Corp fez pedido de R$ 45.000,00',
    module: 'Comercial',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    read: true,
  },
  {
    id: '4',
    type: 'warning',
    title: 'Picking Atrasado',
    description: '8 ordens de separação aguardando há mais de 2h',
    module: 'WMS',
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    read: false,
  },
  {
    id: '5',
    type: 'success',
    title: 'Meta Atingida',
    description: 'Equipe de vendas atingiu 105% da meta mensal',
    module: 'Comercial',
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    read: true,
  },
];

// Recent Activities
export const mockActivities: Activity[] = [
  {
    id: '1',
    action: 'Venda Registrada',
    description: 'Pedido #12458 - Cliente XYZ Ltda - R$ 8.540,00',
    user: 'Maria Santos',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    module: 'Comercial',
  },
  {
    id: '2',
    action: 'NF-e Emitida',
    description: 'Nota Fiscal 000.125.890 autorizada pela SEFAZ',
    user: 'Sistema',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    module: 'Fiscal',
  },
  {
    id: '3',
    action: 'Picking Concluído',
    description: 'Ordem OS-2458 finalizada - 45 itens separados',
    user: 'João Operador',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    module: 'WMS',
  },
  {
    id: '4',
    action: 'Pagamento Recebido',
    description: 'Boleto #45892 - Cliente ABC Corp - R$ 12.350,00',
    user: 'Sistema',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    module: 'Financeiro',
  },
  {
    id: '5',
    action: 'Recebimento Conferido',
    description: 'NF 45892 - Fornecedor Tech Parts - 120 itens',
    user: 'Pedro Silva',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    module: 'WMS',
  },
  {
    id: '6',
    action: 'Usuário Criado',
    description: 'Novo operador cadastrado: ana.costa@empresa.com',
    user: 'Carlos Silva',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    module: 'Admin',
  },
];

// Navigation Items
export const navigationItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    title: 'Comercial',
    href: '/comercial',
    icon: 'Users',
    children: [
      { title: 'Clientes', href: '/comercial/clientes', icon: 'UserCircle' },
      { title: 'Vendas', href: '/comercial/vendas', icon: 'ShoppingBag' },
      { title: 'Pedidos', href: '/comercial/pedidos', icon: 'ClipboardList' },
      { title: 'Orçamentos', href: '/comercial/orcamentos', icon: 'FileText' },
    ],
  },
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
    title: 'Fiscal',
    href: '/fiscal',
    icon: 'FileCheck',
    children: [
      { title: 'NF-e', href: '/fiscal/nfe', icon: 'FileText' },
      { title: 'NFC-e', href: '/fiscal/nfce', icon: 'Receipt' },
      { title: 'Relatórios Fiscais', href: '/fiscal/relatorios', icon: 'BarChart3' },
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
      { title: 'Saldos', href: '/estoque/saldos', icon: 'Calculator' },
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
    title: 'Administração',
    href: '/admin',
    icon: 'Settings',
    children: [
      { title: 'Usuários', href: '/admin/usuarios', icon: 'Users' },
      { title: 'Empresas', href: '/admin/empresas', icon: 'Building' },
      { title: 'Parâmetros', href: '/admin/parametros', icon: 'Sliders' },
    ],
  },
];
