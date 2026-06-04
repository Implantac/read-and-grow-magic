import fs from 'fs';

const modules = {
  Accounting: [
    { key: 'acc-chart', path: '/contabilidade/plano-contas', component: 'ChartOfAccountsPage', importPath: '../pages/contabilidade/ChartOfAccounts' },
    { key: 'acc-journal', path: '/contabilidade/lancamentos', component: 'JournalEntriesPage', importPath: '../pages/contabilidade/JournalEntries' },
    { key: 'acc-ledger', path: '/contabilidade/razao', component: 'GeneralLedgerPage', importPath: '../pages/contabilidade/GeneralLedger' },
    { key: 'acc-trial', path: '/contabilidade/balancete', component: 'TrialBalancePage', importPath: '../pages/contabilidade/TrialBalance' },
    { key: 'acc-dre', path: '/contabilidade/dre', component: 'DREPage', importPath: '../pages/contabilidade/DRE' },
    { key: 'acc-balance', path: '/contabilidade/balanco', component: 'BalanceSheetPage', importPath: '../pages/contabilidade/BalanceSheet' },
    { key: 'acc-dash', path: '/contabilidade/dashboard', component: 'AccountingDashboardPage', importPath: '../pages/contabilidade/AccountingDashboard' },
    { key: 'acc-closing', path: '/contabilidade/fechamento', component: 'PeriodClosingPage', importPath: '../pages/contabilidade/PeriodClosing' },
  ],
  Production: [
    { key: 'prod-orders', path: '/producao/ordens', component: 'ProductionOrdersPage', importPath: '../pages/producao/ProductionOrders' },
    { key: 'prod-cons', path: '/producao/consumo', component: 'MaterialConsumptionPage', importPath: '../pages/producao/MaterialConsumption' },
    { key: 'prod-time', path: '/producao/apontamento', component: 'TimeEntriesPage', importPath: '../pages/producao/TimeEntries' },
    { key: 'prod-pcp', path: '/producao/pcp', component: 'PCPPanelPage', importPath: '../pages/producao/PCPPanel' },
    { key: 'prod-steps', path: '/producao/etapas', component: 'ProductionStepsPage', importPath: '../pages/producao/ProductionSteps' },
    { key: 'prod-queue', path: '/producao/fila', component: 'ProductionQueuePage', importPath: '../pages/producao/ProductionQueue' },
    { key: 'prod-quality', path: '/producao/qualidade', component: 'QualityControlPage', importPath: '../pages/producao/QualityControl' },
    { key: 'prod-supply', path: '/producao/insumos', component: 'SupplyStockPage', importPath: '../pages/producao/SupplyStock' },
    { key: 'prod-costs', path: '/producao/custos', component: 'ProductCostsPage', importPath: '../pages/producao/ProductCosts' },
    { key: 'prod-dash', path: '/producao/dashboard', component: 'IndustrialDashboardPage', importPath: '../pages/producao/IndustrialDashboard' },
    { key: 'prod-term', path: '/producao/terminal', component: 'OperatorTerminalPage', importPath: '../pages/producao/OperatorTerminal' },
    { key: 'prod-shop', path: '/producao/chao-de-fabrica', component: 'ShopFloorDashboardPage', importPath: '../pages/producao/ShopFloorDashboard' },
    { key: 'prod-kanban', path: '/producao/kanban', component: 'ProductionKanbanPage', importPath: '../pages/producao/ProductionKanban' },
    { key: 'prod-tech', path: '/producao/fichas', component: 'TechnicalSheetsPage', importPath: '../pages/producao/TechnicalSheets' },
    { key: 'prod-cap', path: '/producao/capacidade', component: 'ProductionCapacityPage', importPath: '../pages/producao/ProductionCapacity' },
    { key: 'prod-trace', path: '/producao/rastreabilidade', component: 'ProductionTraceabilityPage', importPath: '../pages/producao/ProductionTraceability' },
    { key: 'prod-ia', path: '/producao/ia', component: 'AIProductionPage', importPath: '../pages/producao/AIProductionPage' },
    { key: 'prod-sched', path: '/producao/programacao', component: 'ProductionSchedulePage', importPath: '../pages/producao/ProductionSchedule' },
    { key: 'prod-mrp', path: '/producao/mrp', component: 'MRPPage', importPath: '../pages/producao/MRPPage' },
    { key: 'prod-bi', path: '/producao/bi', component: 'BIIndustrialPage', importPath: '../pages/producao/BIIndustrial' },
    { key: 'prod-twin', path: '/producao/twin', component: 'DigitalTwinPage', importPath: '../pages/producao/DigitalTwin' },
    { key: 'prod-aps', path: '/producao/aps', component: 'APSPageComponent', importPath: '../pages/producao/APSPage' },
    { key: 'prod-iot', path: '/producao/iot', component: 'IoTDashboardPage', importPath: '../pages/producao/IoTDashboard' },
    { key: 'prod-oee', path: '/producao/oee', component: 'OEEDashboardPage', importPath: '../pages/producao/OEEDashboard' },
    { key: 'prod-ml', path: '/producao/previsoes', component: 'MLPredictionsPage', importPath: '../pages/producao/MLPredictions' },
    { key: 'prod-sect', path: '/producao/setores', component: 'ProductionSectorsPage', importPath: '../pages/producao/ProductionSectors' },
    { key: 'prod-lines', path: '/producao/linhas', component: 'ProductionLinesPage', importPath: '../pages/producao/ProductionLinesPage' },
    { key: 'prod-res', path: '/producao/recursos', component: 'ProductionResourcesPage', importPath: '../pages/producao/ProductionResourcesPage' },
    { key: 'prod-routes', path: '/producao/roteiros', component: 'ProductionRoutesPage', importPath: '../pages/producao/ProductionRoutesPage' },
    { key: 'prod-out', path: '/producao/terceirizacao', component: 'OutsourcingPage', importPath: '../pages/producao/OutsourcingPage' },
  ]
};

Object.entries(modules).forEach(([name, routes]) => {
  const content = `import { lazy } from 'react';
import { Route } from 'react-router-dom';

${routes.map(r => `const ${r.component} = lazy(() => import("${r.importPath}"));`).join('\n')}

export const ${name}Routes = [
${routes.map(r => `  <Route key="${r.key}" path="${r.path}" element={<${r.component} />} />,`).join('\n')}
];
`;
  fs.writeFileSync(`src/routes/${name}Routes.tsx`, content);
});
