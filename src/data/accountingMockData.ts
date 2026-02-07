import type {
  ChartOfAccount,
  JournalEntry,
  TrialBalanceItem,
  DREItem,
  BalanceSheetItem,
  LedgerEntry,
} from '@/types/accounting';

export const mockChartOfAccounts: ChartOfAccount[] = [
  // Assets
  { id: '1', code: '1', name: 'ATIVO', type: 'asset', nature: 'debit', parentId: null, level: 1, isAnalytical: false, balance: 2850000, active: true },
  { id: '2', code: '1.1', name: 'ATIVO CIRCULANTE', type: 'asset', nature: 'debit', parentId: '1', level: 2, isAnalytical: false, balance: 1450000, active: true },
  { id: '3', code: '1.1.01', name: 'Caixa e Equivalentes', type: 'asset', nature: 'debit', parentId: '2', level: 3, isAnalytical: true, balance: 385000, active: true },
  { id: '4', code: '1.1.02', name: 'Bancos Conta Movimento', type: 'asset', nature: 'debit', parentId: '2', level: 3, isAnalytical: true, balance: 520000, active: true },
  { id: '5', code: '1.1.03', name: 'Clientes a Receber', type: 'asset', nature: 'debit', parentId: '2', level: 3, isAnalytical: true, balance: 345000, active: true },
  { id: '6', code: '1.1.04', name: 'Estoques', type: 'asset', nature: 'debit', parentId: '2', level: 3, isAnalytical: true, balance: 200000, active: true },
  { id: '7', code: '1.2', name: 'ATIVO NÃO CIRCULANTE', type: 'asset', nature: 'debit', parentId: '1', level: 2, isAnalytical: false, balance: 1400000, active: true },
  { id: '8', code: '1.2.01', name: 'Imobilizado', type: 'asset', nature: 'debit', parentId: '7', level: 3, isAnalytical: true, balance: 1200000, active: true },
  { id: '9', code: '1.2.02', name: 'Intangível', type: 'asset', nature: 'debit', parentId: '7', level: 3, isAnalytical: true, balance: 200000, active: true },
  // Liabilities
  { id: '10', code: '2', name: 'PASSIVO', type: 'liability', nature: 'credit', parentId: null, level: 1, isAnalytical: false, balance: 1350000, active: true },
  { id: '11', code: '2.1', name: 'PASSIVO CIRCULANTE', type: 'liability', nature: 'credit', parentId: '10', level: 2, isAnalytical: false, balance: 850000, active: true },
  { id: '12', code: '2.1.01', name: 'Fornecedores', type: 'liability', nature: 'credit', parentId: '11', level: 3, isAnalytical: true, balance: 420000, active: true },
  { id: '13', code: '2.1.02', name: 'Obrigações Trabalhistas', type: 'liability', nature: 'credit', parentId: '11', level: 3, isAnalytical: true, balance: 185000, active: true },
  { id: '14', code: '2.1.03', name: 'Obrigações Tributárias', type: 'liability', nature: 'credit', parentId: '11', level: 3, isAnalytical: true, balance: 245000, active: true },
  { id: '15', code: '2.2', name: 'PASSIVO NÃO CIRCULANTE', type: 'liability', nature: 'credit', parentId: '10', level: 2, isAnalytical: false, balance: 500000, active: true },
  { id: '16', code: '2.2.01', name: 'Empréstimos LP', type: 'liability', nature: 'credit', parentId: '15', level: 3, isAnalytical: true, balance: 500000, active: true },
  // Equity
  { id: '17', code: '3', name: 'PATRIMÔNIO LÍQUIDO', type: 'equity', nature: 'credit', parentId: null, level: 1, isAnalytical: false, balance: 1500000, active: true },
  { id: '18', code: '3.1', name: 'Capital Social', type: 'equity', nature: 'credit', parentId: '17', level: 2, isAnalytical: true, balance: 1000000, active: true },
  { id: '19', code: '3.2', name: 'Reservas de Lucros', type: 'equity', nature: 'credit', parentId: '17', level: 2, isAnalytical: true, balance: 300000, active: true },
  { id: '20', code: '3.3', name: 'Lucros Acumulados', type: 'equity', nature: 'credit', parentId: '17', level: 2, isAnalytical: true, balance: 200000, active: true },
  // Revenue
  { id: '21', code: '4', name: 'RECEITAS', type: 'revenue', nature: 'credit', parentId: null, level: 1, isAnalytical: false, balance: 1285430, active: true },
  { id: '22', code: '4.1', name: 'Receita Bruta de Vendas', type: 'revenue', nature: 'credit', parentId: '21', level: 2, isAnalytical: true, balance: 1285430, active: true },
  { id: '23', code: '4.2', name: 'Deduções da Receita', type: 'revenue', nature: 'debit', parentId: '21', level: 2, isAnalytical: true, balance: -128543, active: true },
  // Expenses
  { id: '24', code: '5', name: 'CUSTOS E DESPESAS', type: 'expense', nature: 'debit', parentId: null, level: 1, isAnalytical: false, balance: 887000, active: true },
  { id: '25', code: '5.1', name: 'CMV - Custo das Mercadorias', type: 'expense', nature: 'debit', parentId: '24', level: 2, isAnalytical: true, balance: 514000, active: true },
  { id: '26', code: '5.2', name: 'Despesas Administrativas', type: 'expense', nature: 'debit', parentId: '24', level: 2, isAnalytical: true, balance: 185000, active: true },
  { id: '27', code: '5.3', name: 'Despesas Comerciais', type: 'expense', nature: 'debit', parentId: '24', level: 2, isAnalytical: true, balance: 98000, active: true },
  { id: '28', code: '5.4', name: 'Despesas Financeiras', type: 'expense', nature: 'debit', parentId: '24', level: 2, isAnalytical: true, balance: 45000, active: true },
  { id: '29', code: '5.5', name: 'Depreciação e Amortização', type: 'expense', nature: 'debit', parentId: '24', level: 2, isAnalytical: true, balance: 45000, active: true },
];

export const mockJournalEntries: JournalEntry[] = [
  {
    id: '1', number: 'LC-2024-001', date: '2024-01-15', description: 'Venda de mercadorias - NF 1234',
    status: 'posted',
    lines: [
      { id: '1a', accountId: '5', accountCode: '1.1.03', accountName: 'Clientes a Receber', debit: 15000, credit: 0, description: 'Venda NF 1234' },
      { id: '1b', accountId: '22', accountCode: '4.1', accountName: 'Receita Bruta de Vendas', debit: 0, credit: 15000, description: 'Receita NF 1234' },
    ],
    totalDebit: 15000, totalCredit: 15000, createdBy: 'Carlos Silva', createdAt: '2024-01-15T10:30:00',
  },
  {
    id: '2', number: 'LC-2024-002', date: '2024-01-18', description: 'Pagamento a fornecedor - Dup 5678',
    status: 'posted',
    lines: [
      { id: '2a', accountId: '12', accountCode: '2.1.01', accountName: 'Fornecedores', debit: 8500, credit: 0, description: 'Pagamento Dup 5678' },
      { id: '2b', accountId: '4', accountCode: '1.1.02', accountName: 'Bancos Conta Movimento', debit: 0, credit: 8500, description: 'Pagamento Dup 5678' },
    ],
    totalDebit: 8500, totalCredit: 8500, createdBy: 'Maria Santos', createdAt: '2024-01-18T14:00:00',
  },
  {
    id: '3', number: 'LC-2024-003', date: '2024-01-20', description: 'Folha de pagamento - Janeiro/2024',
    status: 'posted',
    lines: [
      { id: '3a', accountId: '26', accountCode: '5.2', accountName: 'Despesas Administrativas', debit: 45000, credit: 0, description: 'Salários Jan/24' },
      { id: '3b', accountId: '13', accountCode: '2.1.02', accountName: 'Obrigações Trabalhistas', debit: 0, credit: 45000, description: 'Provisão salários' },
    ],
    totalDebit: 45000, totalCredit: 45000, createdBy: 'Carlos Silva', createdAt: '2024-01-20T09:00:00',
  },
  {
    id: '4', number: 'LC-2024-004', date: '2024-01-22', description: 'Recebimento de cliente - Dup 9012',
    status: 'posted',
    lines: [
      { id: '4a', accountId: '4', accountCode: '1.1.02', accountName: 'Bancos Conta Movimento', debit: 12000, credit: 0, description: 'Recebimento Dup 9012' },
      { id: '4b', accountId: '5', accountCode: '1.1.03', accountName: 'Clientes a Receber', debit: 0, credit: 12000, description: 'Baixa Dup 9012' },
    ],
    totalDebit: 12000, totalCredit: 12000, createdBy: 'Maria Santos', createdAt: '2024-01-22T11:00:00',
  },
  {
    id: '5', number: 'LC-2024-005', date: '2024-01-25', description: 'Compra de mercadorias - NF 3456',
    status: 'posted',
    lines: [
      { id: '5a', accountId: '6', accountCode: '1.1.04', accountName: 'Estoques', debit: 25000, credit: 0, description: 'Entrada NF 3456' },
      { id: '5b', accountId: '12', accountCode: '2.1.01', accountName: 'Fornecedores', debit: 0, credit: 25000, description: 'NF 3456 a pagar' },
    ],
    totalDebit: 25000, totalCredit: 25000, createdBy: 'Carlos Silva', createdAt: '2024-01-25T16:30:00',
  },
  {
    id: '6', number: 'LC-2024-006', date: '2024-01-28', description: 'Despesas com comissões de vendas',
    status: 'draft',
    lines: [
      { id: '6a', accountId: '27', accountCode: '5.3', accountName: 'Despesas Comerciais', debit: 7800, credit: 0, description: 'Comissões Jan/24' },
      { id: '6b', accountId: '14', accountCode: '2.1.03', accountName: 'Obrigações Tributárias', debit: 0, credit: 7800, description: 'Comissões a pagar' },
    ],
    totalDebit: 7800, totalCredit: 7800, createdBy: 'Maria Santos', createdAt: '2024-01-28T10:00:00',
  },
  {
    id: '7', number: 'LC-2024-007', date: '2024-02-01', description: 'Depreciação mensal - Janeiro/2024',
    status: 'posted',
    lines: [
      { id: '7a', accountId: '29', accountCode: '5.5', accountName: 'Depreciação e Amortização', debit: 15000, credit: 0, description: 'Depreciação Jan/24' },
      { id: '7b', accountId: '8', accountCode: '1.2.01', accountName: 'Imobilizado', debit: 0, credit: 15000, description: 'Deprec. acumulada' },
    ],
    totalDebit: 15000, totalCredit: 15000, createdBy: 'Sistema', createdAt: '2024-02-01T00:00:00',
  },
  {
    id: '8', number: 'LC-2024-008', date: '2024-02-05', description: 'Estorno - Lançamento incorreto',
    status: 'reversed',
    lines: [
      { id: '8a', accountId: '26', accountCode: '5.2', accountName: 'Despesas Administrativas', debit: 3200, credit: 0, description: 'Estorno' },
      { id: '8b', accountId: '4', accountCode: '1.1.02', accountName: 'Bancos Conta Movimento', debit: 0, credit: 3200, description: 'Estorno' },
    ],
    totalDebit: 3200, totalCredit: 3200, createdBy: 'Carlos Silva', createdAt: '2024-02-05T08:30:00',
  },
];

export const mockTrialBalance: TrialBalanceItem[] = [
  { accountCode: '1.1.01', accountName: 'Caixa e Equivalentes', type: 'asset', previousDebit: 400000, previousCredit: 0, periodDebit: 50000, periodCredit: 65000, currentDebit: 385000, currentCredit: 0 },
  { accountCode: '1.1.02', accountName: 'Bancos Conta Movimento', type: 'asset', previousDebit: 500000, previousCredit: 0, periodDebit: 120000, periodCredit: 100000, currentDebit: 520000, currentCredit: 0 },
  { accountCode: '1.1.03', accountName: 'Clientes a Receber', type: 'asset', previousDebit: 320000, previousCredit: 0, periodDebit: 185000, periodCredit: 160000, currentDebit: 345000, currentCredit: 0 },
  { accountCode: '1.1.04', accountName: 'Estoques', type: 'asset', previousDebit: 180000, previousCredit: 0, periodDebit: 95000, periodCredit: 75000, currentDebit: 200000, currentCredit: 0 },
  { accountCode: '1.2.01', accountName: 'Imobilizado', type: 'asset', previousDebit: 1215000, previousCredit: 0, periodDebit: 0, periodCredit: 15000, currentDebit: 1200000, currentCredit: 0 },
  { accountCode: '1.2.02', accountName: 'Intangível', type: 'asset', previousDebit: 200000, previousCredit: 0, periodDebit: 0, periodCredit: 0, currentDebit: 200000, currentCredit: 0 },
  { accountCode: '2.1.01', accountName: 'Fornecedores', type: 'liability', previousDebit: 0, previousCredit: 400000, periodDebit: 85000, periodCredit: 105000, currentDebit: 0, currentCredit: 420000 },
  { accountCode: '2.1.02', accountName: 'Obrigações Trabalhistas', type: 'liability', previousDebit: 0, previousCredit: 170000, periodDebit: 30000, periodCredit: 45000, currentDebit: 0, currentCredit: 185000 },
  { accountCode: '2.1.03', accountName: 'Obrigações Tributárias', type: 'liability', previousDebit: 0, previousCredit: 230000, periodDebit: 20000, periodCredit: 35000, currentDebit: 0, currentCredit: 245000 },
  { accountCode: '2.2.01', accountName: 'Empréstimos LP', type: 'liability', previousDebit: 0, previousCredit: 515000, periodDebit: 15000, periodCredit: 0, currentDebit: 0, currentCredit: 500000 },
  { accountCode: '3.1', accountName: 'Capital Social', type: 'equity', previousDebit: 0, previousCredit: 1000000, periodDebit: 0, periodCredit: 0, currentDebit: 0, currentCredit: 1000000 },
  { accountCode: '3.2', accountName: 'Reservas de Lucros', type: 'equity', previousDebit: 0, previousCredit: 300000, periodDebit: 0, periodCredit: 0, currentDebit: 0, currentCredit: 300000 },
  { accountCode: '3.3', accountName: 'Lucros Acumulados', type: 'equity', previousDebit: 0, previousCredit: 200000, periodDebit: 0, periodCredit: 0, currentDebit: 0, currentCredit: 200000 },
  { accountCode: '4.1', accountName: 'Receita Bruta de Vendas', type: 'revenue', previousDebit: 0, previousCredit: 0, periodDebit: 0, periodCredit: 1285430, currentDebit: 0, currentCredit: 1285430 },
  { accountCode: '4.2', accountName: 'Deduções da Receita', type: 'revenue', previousDebit: 0, previousCredit: 0, periodDebit: 128543, periodCredit: 0, currentDebit: 128543, currentCredit: 0 },
  { accountCode: '5.1', accountName: 'CMV', type: 'expense', previousDebit: 0, previousCredit: 0, periodDebit: 514000, periodCredit: 0, currentDebit: 514000, currentCredit: 0 },
  { accountCode: '5.2', accountName: 'Despesas Administrativas', type: 'expense', previousDebit: 0, previousCredit: 0, periodDebit: 185000, periodCredit: 0, currentDebit: 185000, currentCredit: 0 },
  { accountCode: '5.3', accountName: 'Despesas Comerciais', type: 'expense', previousDebit: 0, previousCredit: 0, periodDebit: 98000, periodCredit: 0, currentDebit: 98000, currentCredit: 0 },
  { accountCode: '5.4', accountName: 'Despesas Financeiras', type: 'expense', previousDebit: 0, previousCredit: 0, periodDebit: 45000, periodCredit: 0, currentDebit: 45000, currentCredit: 0 },
  { accountCode: '5.5', accountName: 'Depreciação e Amortização', type: 'expense', previousDebit: 0, previousCredit: 0, periodDebit: 45000, periodCredit: 0, currentDebit: 45000, currentCredit: 0 },
];

export const mockDRE: DREItem[] = [
  { id: '1', code: '1', description: 'RECEITA OPERACIONAL BRUTA', currentPeriod: 1285430, previousPeriod: 1142000, variation: 12.56, level: 0, isTotal: true },
  { id: '2', code: '1.1', description: 'Receita de Vendas de Produtos', currentPeriod: 985430, previousPeriod: 862000, variation: 14.32, level: 1, isTotal: false },
  { id: '3', code: '1.2', description: 'Receita de Prestação de Serviços', currentPeriod: 300000, previousPeriod: 280000, variation: 7.14, level: 1, isTotal: false },
  { id: '4', code: '2', description: '(-) DEDUÇÕES DA RECEITA', currentPeriod: -128543, previousPeriod: -114200, variation: 12.56, level: 0, isTotal: true },
  { id: '5', code: '2.1', description: 'Impostos sobre Vendas', currentPeriod: -102834, previousPeriod: -91360, variation: 12.56, level: 1, isTotal: false },
  { id: '6', code: '2.2', description: 'Devoluções e Abatimentos', currentPeriod: -25709, previousPeriod: -22840, variation: 12.56, level: 1, isTotal: false },
  { id: '7', code: '3', description: '(=) RECEITA OPERACIONAL LÍQUIDA', currentPeriod: 1156887, previousPeriod: 1027800, variation: 12.56, level: 0, isTotal: true },
  { id: '8', code: '4', description: '(-) CUSTO DAS MERCADORIAS VENDIDAS', currentPeriod: -514000, previousPeriod: -471000, variation: 9.13, level: 0, isTotal: true },
  { id: '9', code: '5', description: '(=) LUCRO BRUTO', currentPeriod: 642887, previousPeriod: 556800, variation: 15.46, level: 0, isTotal: true },
  { id: '10', code: '6', description: '(-) DESPESAS OPERACIONAIS', currentPeriod: -373000, previousPeriod: -342000, variation: 9.06, level: 0, isTotal: true },
  { id: '11', code: '6.1', description: 'Despesas Administrativas', currentPeriod: -185000, previousPeriod: -168000, variation: 10.12, level: 1, isTotal: false },
  { id: '12', code: '6.2', description: 'Despesas Comerciais', currentPeriod: -98000, previousPeriod: -89000, variation: 10.11, level: 1, isTotal: false },
  { id: '13', code: '6.3', description: 'Despesas Financeiras', currentPeriod: -45000, previousPeriod: -42000, variation: 7.14, level: 1, isTotal: false },
  { id: '14', code: '6.4', description: 'Depreciação e Amortização', currentPeriod: -45000, previousPeriod: -43000, variation: 4.65, level: 1, isTotal: false },
  { id: '15', code: '7', description: '(=) RESULTADO ANTES DO IR/CSLL', currentPeriod: 269887, previousPeriod: 214800, variation: 25.64, level: 0, isTotal: true },
  { id: '16', code: '8', description: '(-) IR e CSLL', currentPeriod: -20967, previousPeriod: -16000, variation: 31.04, level: 0, isTotal: false },
  { id: '17', code: '9', description: '(=) LUCRO LÍQUIDO DO EXERCÍCIO', currentPeriod: 248920, previousPeriod: 198800, variation: 25.21, level: 0, isTotal: true },
];

export const mockBalanceSheet: BalanceSheetItem[] = [
  // Assets
  { id: '1', code: '1', description: 'ATIVO TOTAL', currentPeriod: 2850000, previousPeriod: 2715000, level: 0, isTotal: true, section: 'asset' },
  { id: '2', code: '1.1', description: 'ATIVO CIRCULANTE', currentPeriod: 1450000, previousPeriod: 1300000, level: 1, isTotal: true, section: 'asset' },
  { id: '3', code: '1.1.01', description: 'Caixa e Equivalentes', currentPeriod: 385000, previousPeriod: 400000, level: 2, isTotal: false, section: 'asset' },
  { id: '4', code: '1.1.02', description: 'Bancos Conta Movimento', currentPeriod: 520000, previousPeriod: 500000, level: 2, isTotal: false, section: 'asset' },
  { id: '5', code: '1.1.03', description: 'Clientes a Receber', currentPeriod: 345000, previousPeriod: 320000, level: 2, isTotal: false, section: 'asset' },
  { id: '6', code: '1.1.04', description: 'Estoques', currentPeriod: 200000, previousPeriod: 180000, level: 2, isTotal: false, section: 'asset' },
  { id: '7', code: '1.2', description: 'ATIVO NÃO CIRCULANTE', currentPeriod: 1400000, previousPeriod: 1415000, level: 1, isTotal: true, section: 'asset' },
  { id: '8', code: '1.2.01', description: 'Imobilizado', currentPeriod: 1200000, previousPeriod: 1215000, level: 2, isTotal: false, section: 'asset' },
  { id: '9', code: '1.2.02', description: 'Intangível', currentPeriod: 200000, previousPeriod: 200000, level: 2, isTotal: false, section: 'asset' },
  // Liabilities
  { id: '10', code: '2', description: 'PASSIVO TOTAL', currentPeriod: 1350000, previousPeriod: 1315000, level: 0, isTotal: true, section: 'liability' },
  { id: '11', code: '2.1', description: 'PASSIVO CIRCULANTE', currentPeriod: 850000, previousPeriod: 800000, level: 1, isTotal: true, section: 'liability' },
  { id: '12', code: '2.1.01', description: 'Fornecedores', currentPeriod: 420000, previousPeriod: 400000, level: 2, isTotal: false, section: 'liability' },
  { id: '13', code: '2.1.02', description: 'Obrigações Trabalhistas', currentPeriod: 185000, previousPeriod: 170000, level: 2, isTotal: false, section: 'liability' },
  { id: '14', code: '2.1.03', description: 'Obrigações Tributárias', currentPeriod: 245000, previousPeriod: 230000, level: 2, isTotal: false, section: 'liability' },
  { id: '15', code: '2.2', description: 'PASSIVO NÃO CIRCULANTE', currentPeriod: 500000, previousPeriod: 515000, level: 1, isTotal: true, section: 'liability' },
  { id: '16', code: '2.2.01', description: 'Empréstimos LP', currentPeriod: 500000, previousPeriod: 515000, level: 2, isTotal: false, section: 'liability' },
  // Equity
  { id: '17', code: '3', description: 'PATRIMÔNIO LÍQUIDO', currentPeriod: 1500000, previousPeriod: 1400000, level: 0, isTotal: true, section: 'equity' },
  { id: '18', code: '3.1', description: 'Capital Social', currentPeriod: 1000000, previousPeriod: 1000000, level: 1, isTotal: false, section: 'equity' },
  { id: '19', code: '3.2', description: 'Reservas de Lucros', currentPeriod: 300000, previousPeriod: 250000, level: 1, isTotal: false, section: 'equity' },
  { id: '20', code: '3.3', description: 'Lucros Acumulados', currentPeriod: 200000, previousPeriod: 150000, level: 1, isTotal: false, section: 'equity' },
];

export const generateLedgerEntries = (accountCode: string): LedgerEntry[] => {
  const entries: LedgerEntry[] = [
    { id: '1', date: '2024-01-01', journalNumber: 'Saldo Anterior', description: 'Saldo inicial do período', debit: 0, credit: 0, balance: 400000 },
    { id: '2', date: '2024-01-05', journalNumber: 'LC-2024-001', description: 'Venda de mercadorias', debit: 15000, credit: 0, balance: 415000 },
    { id: '3', date: '2024-01-10', journalNumber: 'LC-2024-002', description: 'Recebimento de cliente', debit: 8500, credit: 0, balance: 423500 },
    { id: '4', date: '2024-01-15', journalNumber: 'LC-2024-003', description: 'Pagamento fornecedor', debit: 0, credit: 25000, balance: 398500 },
    { id: '5', date: '2024-01-20', journalNumber: 'LC-2024-004', description: 'Recebimento duplicata', debit: 12000, credit: 0, balance: 410500 },
    { id: '6', date: '2024-01-25', journalNumber: 'LC-2024-005', description: 'Pagamento salários', debit: 0, credit: 45000, balance: 365500 },
    { id: '7', date: '2024-01-28', journalNumber: 'LC-2024-006', description: 'Recebimento vendas', debit: 22000, credit: 0, balance: 387500 },
    { id: '8', date: '2024-01-31', journalNumber: 'LC-2024-007', description: 'Despesas bancárias', debit: 0, credit: 2500, balance: 385000 },
  ];
  return entries;
};

export const getAccountTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    asset: 'Ativo',
    liability: 'Passivo',
    equity: 'Patrimônio Líquido',
    revenue: 'Receita',
    expense: 'Despesa',
  };
  return map[type] || type;
};

export const getJournalStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    draft: 'Rascunho',
    posted: 'Lançado',
    reversed: 'Estornado',
  };
  return map[status] || status;
};
