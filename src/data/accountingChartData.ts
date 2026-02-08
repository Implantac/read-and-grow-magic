// Monthly evolution data for accounting charts

export interface MonthlyEquityEvolution {
  month: string;
  assets: number;
  liabilities: number;
  equity: number;
}

export interface MonthlyMargins {
  month: string;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  revenue: number;
}

export interface FinancialIndicator {
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  description: string;
  status: 'good' | 'warning' | 'critical';
}

export const monthlyEquityEvolution: MonthlyEquityEvolution[] = [
  { month: 'Ago/23', assets: 2520000, liabilities: 1280000, equity: 1240000 },
  { month: 'Set/23', assets: 2580000, liabilities: 1290000, equity: 1290000 },
  { month: 'Out/23', assets: 2620000, liabilities: 1300000, equity: 1320000 },
  { month: 'Nov/23', assets: 2680000, liabilities: 1310000, equity: 1370000 },
  { month: 'Dez/23', assets: 2715000, liabilities: 1315000, equity: 1400000 },
  { month: 'Jan/24', assets: 2850000, liabilities: 1350000, equity: 1500000 },
];

export const monthlyMargins: MonthlyMargins[] = [
  { month: 'Ago/23', grossMargin: 47.2, operatingMargin: 20.1, netMargin: 16.8, revenue: 980000 },
  { month: 'Set/23', grossMargin: 48.1, operatingMargin: 21.3, netMargin: 17.5, revenue: 1020000 },
  { month: 'Out/23', grossMargin: 47.8, operatingMargin: 20.8, netMargin: 17.1, revenue: 1050000 },
  { month: 'Nov/23', grossMargin: 48.5, operatingMargin: 21.0, netMargin: 17.3, revenue: 1100000 },
  { month: 'Dez/23', grossMargin: 48.7, operatingMargin: 18.8, netMargin: 17.4, revenue: 1142000 },
  { month: 'Jan/24', grossMargin: 50.0, operatingMargin: 23.3, netMargin: 19.4, revenue: 1285430 },
];

export const financialIndicators: FinancialIndicator[] = [
  {
    name: 'Liquidez Corrente',
    value: 1.71,
    previousValue: 1.63,
    unit: 'x',
    description: 'Ativo Circulante / Passivo Circulante',
    status: 'good',
  },
  {
    name: 'Liquidez Seca',
    value: 1.47,
    previousValue: 1.40,
    unit: 'x',
    description: '(AC - Estoques) / Passivo Circulante',
    status: 'good',
  },
  {
    name: 'Endividamento Geral',
    value: 47.4,
    previousValue: 48.4,
    unit: '%',
    description: 'Passivo Total / Ativo Total',
    status: 'warning',
  },
  {
    name: 'Composição Endividamento',
    value: 63.0,
    previousValue: 60.8,
    unit: '%',
    description: 'Passivo Circulante / Passivo Total',
    status: 'warning',
  },
  {
    name: 'ROE',
    value: 16.6,
    previousValue: 14.2,
    unit: '%',
    description: 'Lucro Líquido / Patrimônio Líquido',
    status: 'good',
  },
  {
    name: 'ROA',
    value: 8.7,
    previousValue: 7.3,
    unit: '%',
    description: 'Lucro Líquido / Ativo Total',
    status: 'good',
  },
];

export const expenseBreakdown = [
  { name: 'CMV', value: 514000, percentage: 57.9 },
  { name: 'Desp. Administrativas', value: 185000, percentage: 20.9 },
  { name: 'Desp. Comerciais', value: 98000, percentage: 11.0 },
  { name: 'Desp. Financeiras', value: 45000, percentage: 5.1 },
  { name: 'Deprec. e Amortização', value: 45000, percentage: 5.1 },
];

export const revenueVsExpenseTrend = [
  { month: 'Ago/23', revenue: 980000, expenses: 820000, profit: 160000 },
  { month: 'Set/23', revenue: 1020000, expenses: 842000, profit: 178000 },
  { month: 'Out/23', revenue: 1050000, expenses: 870000, profit: 180000 },
  { month: 'Nov/23', revenue: 1100000, expenses: 910000, profit: 190000 },
  { month: 'Dez/23', revenue: 1142000, expenses: 943200, profit: 198800 },
  { month: 'Jan/24', revenue: 1285430, expenses: 1036510, profit: 248920 },
];

export const trialBalanceByType = [
  { type: 'Ativo', debit: 2650000, credit: 0 },
  { type: 'Passivo', debit: 0, credit: 1350000 },
  { type: 'Patrimônio', debit: 0, credit: 1500000 },
  { type: 'Receitas', debit: 128543, credit: 1285430 },
  { type: 'Despesas', debit: 887000, credit: 0 },
];
