// Sales Report Data
export const salesReportMonthly = [
  { month: 'Jan', vendas: 152, valor: 980000, ticket: 6447, meta: 900000 },
  { month: 'Fev', vendas: 168, valor: 1050000, ticket: 6250, meta: 950000 },
  { month: 'Mar', vendas: 175, valor: 1120000, ticket: 6400, meta: 1000000 },
  { month: 'Abr', vendas: 160, valor: 1080000, ticket: 6750, meta: 1000000 },
  { month: 'Mai', vendas: 190, valor: 1200000, ticket: 6316, meta: 1100000 },
  { month: 'Jun', vendas: 182, valor: 1150000, ticket: 6319, meta: 1100000 },
  { month: 'Jul', vendas: 195, valor: 1285430, ticket: 6592, meta: 1200000 },
];

export const salesByVendor = [
  { vendedor: 'Maria Santos', vendas: 48, valor: 312500, meta: 300000 },
  { vendedor: 'João Oliveira', vendas: 42, valor: 278900, meta: 280000 },
  { vendedor: 'Ana Costa', vendas: 38, valor: 245000, meta: 250000 },
  { vendedor: 'Pedro Lima', vendas: 35, valor: 228000, meta: 220000 },
  { vendedor: 'Carla Souza', vendas: 32, valor: 221030, meta: 200000 },
];

export const salesByCategory = [
  { categoria: 'Eletrônicos', valor: 450000, percent: 35 },
  { categoria: 'Vestuário', valor: 321000, percent: 25 },
  { categoria: 'Alimentos', valor: 257000, percent: 20 },
  { categoria: 'Cosméticos', valor: 154000, percent: 12 },
  { categoria: 'Outros', valor: 103430, percent: 8 },
];

export const topProducts = [
  { produto: 'Notebook Pro X', qtd: 85, valor: 382500, margem: 22 },
  { produto: 'Smartphone Ultra', qtd: 120, valor: 240000, margem: 18 },
  { produto: 'Tablet Air', qtd: 95, valor: 190000, margem: 25 },
  { produto: 'Monitor 27"', qtd: 60, valor: 120000, margem: 30 },
  { produto: 'Teclado Mecânico', qtd: 200, valor: 100000, margem: 40 },
  { produto: 'Mouse Wireless', qtd: 310, valor: 93000, margem: 45 },
  { produto: 'Webcam HD', qtd: 150, valor: 75000, margem: 35 },
  { produto: 'Headset Pro', qtd: 180, valor: 72000, margem: 28 },
];

// Inventory Report Data
export const inventoryByCategory = [
  { categoria: 'Eletrônicos', itens: 245, valor: 1250000, percent: 42 },
  { categoria: 'Vestuário', itens: 380, valor: 580000, percent: 19 },
  { categoria: 'Alimentos', itens: 520, valor: 420000, percent: 14 },
  { categoria: 'Cosméticos', itens: 190, valor: 380000, percent: 13 },
  { categoria: 'Outros', itens: 310, valor: 350000, percent: 12 },
];

export const stockMovementHistory = [
  { month: 'Jan', entradas: 1200, saidas: 1050, saldo: 10150 },
  { month: 'Fev', entradas: 1350, saidas: 1100, saldo: 10400 },
  { month: 'Mar', entradas: 1100, saidas: 1200, saldo: 10300 },
  { month: 'Abr', entradas: 1400, saidas: 1150, saldo: 10550 },
  { month: 'Mai', entradas: 1250, saidas: 1300, saldo: 10500 },
  { month: 'Jun', entradas: 1500, saidas: 1200, saldo: 10800 },
  { month: 'Jul', entradas: 1300, saidas: 1050, saldo: 11050 },
];

export const lowStockItems = [
  { produto: 'Notebook Pro X', atual: 5, minimo: 20, status: 'critico' },
  { produto: 'Smartphone Ultra', atual: 12, minimo: 25, status: 'critico' },
  { produto: 'Cabo HDMI 2m', atual: 18, minimo: 30, status: 'baixo' },
  { produto: 'Fonte USB-C', atual: 22, minimo: 35, status: 'baixo' },
  { produto: 'Película Vidro', atual: 30, minimo: 40, status: 'baixo' },
];

// Financial Report Data
export const financialMonthly = [
  { month: 'Jan', receita: 980000, despesa: 720000, lucro: 260000 },
  { month: 'Fev', receita: 1050000, despesa: 780000, lucro: 270000 },
  { month: 'Mar', receita: 1120000, despesa: 810000, lucro: 310000 },
  { month: 'Abr', receita: 1080000, despesa: 790000, lucro: 290000 },
  { month: 'Mai', receita: 1200000, despesa: 850000, lucro: 350000 },
  { month: 'Jun', receita: 1150000, despesa: 820000, lucro: 330000 },
  { month: 'Jul', receita: 1285430, despesa: 890000, lucro: 395430 },
];

export const expenseBreakdown = [
  { categoria: 'Fornecedores', valor: 420000, percent: 47 },
  { categoria: 'Folha de Pagamento', valor: 210000, percent: 24 },
  { categoria: 'Logística', valor: 95000, percent: 11 },
  { categoria: 'Impostos', valor: 85000, percent: 10 },
  { categoria: 'Operacional', valor: 45000, percent: 5 },
  { categoria: 'Marketing', valor: 35000, percent: 3 },
];

export const cashFlowProjection = [
  { month: 'Ago', receber: 1350000, pagar: 920000, saldo: 430000 },
  { month: 'Set', receber: 1280000, pagar: 880000, saldo: 400000 },
  { month: 'Out', receber: 1420000, pagar: 950000, saldo: 470000 },
  { month: 'Nov', receber: 1500000, pagar: 1020000, saldo: 480000 },
  { month: 'Dez', receber: 1800000, pagar: 1100000, saldo: 700000 },
];

export const overdueSummary = {
  total: 45820,
  count: 8,
  aging: [
    { faixa: '1-15 dias', valor: 12500, count: 3 },
    { faixa: '16-30 dias', valor: 18320, count: 3 },
    { faixa: '31-60 dias', valor: 8000, count: 1 },
    { faixa: '60+ dias', valor: 7000, count: 1 },
  ],
};

// Production Report Data
export const productionMonthly = [
  { month: 'Jan', planejado: 1200, produzido: 1150, eficiencia: 95.8 },
  { month: 'Fev', planejado: 1300, produzido: 1220, eficiencia: 93.8 },
  { month: 'Mar', planejado: 1250, produzido: 1200, eficiencia: 96.0 },
  { month: 'Abr', planejado: 1400, produzido: 1310, eficiencia: 93.6 },
  { month: 'Mai', planejado: 1350, produzido: 1300, eficiencia: 96.3 },
  { month: 'Jun', planejado: 1500, produzido: 1420, eficiencia: 94.7 },
  { month: 'Jul', planejado: 1450, produzido: 1390, eficiencia: 95.9 },
];

export const productionByLine = [
  { linha: 'Linha A - Eletrônicos', produzido: 520, meta: 550, eficiencia: 94.5, paradas: 3 },
  { linha: 'Linha B - Montagem', produzido: 380, meta: 400, eficiencia: 95.0, paradas: 2 },
  { linha: 'Linha C - Embalagem', produzido: 290, meta: 300, eficiencia: 96.7, paradas: 1 },
  { linha: 'Linha D - Acabamento', produzido: 200, meta: 200, eficiencia: 100, paradas: 0 },
];

export const defectsByType = [
  { tipo: 'Visual', quantidade: 45, percent: 35 },
  { tipo: 'Funcional', quantidade: 30, percent: 23 },
  { tipo: 'Dimensional', quantidade: 25, percent: 19 },
  { tipo: 'Embalagem', quantidade: 18, percent: 14 },
  { tipo: 'Outros', quantidade: 12, percent: 9 },
];

export const materialConsumptionReport = [
  { material: 'Placa PCB', planejado: 1500, consumido: 1480, variacao: -1.3 },
  { material: 'Parafusos M3', planejado: 12000, consumido: 12350, variacao: 2.9 },
  { material: 'Embalagem Caixa', planejado: 1400, consumido: 1390, variacao: -0.7 },
  { material: 'Cola Térmica', planejado: 500, consumido: 520, variacao: 4.0 },
  { material: 'Cabo Flat', planejado: 1500, consumido: 1510, variacao: 0.7 },
  { material: 'Display LCD', planejado: 800, consumido: 795, variacao: -0.6 },
];
