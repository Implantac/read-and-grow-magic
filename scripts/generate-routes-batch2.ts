import fs from 'fs';

const modules = {
  WMS: [
    { key: 'wms-dash', path: '/wms/dashboard', component: 'WMSDashboardPage', importPath: '../pages/wms/Dashboard' },
    { key: 'wms-rec', path: '/wms/recebimento', component: 'ReceivingPage', importPath: '../pages/wms/Receiving' },
    { key: 'wms-store', path: '/wms/armazenagem', component: 'StoragePage', importPath: '../pages/wms/Storage' },
    { key: 'wms-pick', path: '/wms/separacao', component: 'PickingPage', importPath: '../pages/wms/Picking' },
    { key: 'wms-pack', path: '/wms/embalagem', component: 'PackingPage', importPath: '../pages/wms/Packing' },
    { key: 'wms-inv', path: '/wms/inventario', component: 'InventoryPage', importPath: '../pages/wms/Inventory' },
    { key: 'wms-mov', path: '/wms/movimentacoes', component: 'WMSMovementsPage', importPath: '../pages/wms/Movements' },
    { key: 'wms-conf', path: '/wms/conferencia', component: 'ConferencePage', importPath: '../pages/wms/Conference' },
    { key: 'wms-ship', path: '/wms/expedicao', component: 'ShipmentsPage', importPath: '../pages/wms/Shipments' },
    { key: 'wms-lots', path: '/wms/lotes', component: 'LotsPage', importPath: '../pages/wms/Lots' },
    { key: 'wms-waves', path: '/wms/ondas', component: 'WavesPage', importPath: '../pages/wms/Waves' },
    { key: 'wms-put', path: '/wms/putaway', component: 'PutawayPage', importPath: '../pages/wms/Putaway' },
    { key: 'wms-rep', path: '/wms/ressuprimento', component: 'ReplenishmentPage', importPath: '../pages/wms/Replenishment' },
    { key: 'wms-ret', path: '/wms/devolucoes', component: 'ReturnsPage', importPath: '../pages/wms/Returns' },
    { key: 'wms-dc', path: '/wms/centros-distribuicao', component: 'DistributionCentersPage', importPath: '../pages/wms/DistributionCenters' },
    { key: 'wms-bal', path: '/wms/saldos', component: 'StockBalancesPage', importPath: '../pages/wms/StockBalances' },
    { key: 'wms-docks', path: '/wms/docas', component: 'DocksPage', importPath: '../pages/wms/Docks' },
    { key: 'wms-ai', path: '/wms/ia', component: 'WMSAIPage', importPath: '../pages/wms/WMSAI' },
  ],
  Admin: [
    { key: 'adm-users', path: '/admin/usuarios', component: 'UsersPage', importPath: '../pages/admin/Users' },
    { key: 'adm-comp', path: '/admin/empresas', component: 'CompaniesPage', importPath: '../pages/admin/Companies' },
    { key: 'adm-param', path: '/admin/parametros', component: 'ParametersPage', importPath: '../pages/admin/Parameters' },
    { key: 'adm-super', path: '/admin/super', component: 'SuperAdminPage', importPath: '../pages/admin/SuperAdmin' },
    { key: 'adm-rep', path: '/admin/relatorios', component: 'DailyReportsPage', importPath: '../pages/admin/DailyReports' },
    { key: 'adm-audit', path: '/admin/auditoria', component: 'CrossModuleAuditPage', importPath: '../pages/admin/CrossModuleAudit' },
  ],
  Operational: [
    { key: 'op-dash', path: '/operacional/dashboard', component: 'OperationalDashboardPage', importPath: '../pages/operacional/OperationalDashboard' },
    { key: 'op-track', path: '/operacional/rastreamento', component: 'OrderTrackingPage', importPath: '../pages/operacional/OrderTracking' },
    { key: 'op-sep', path: '/operacional/separacao', component: 'SeparationQueuePage', importPath: '../pages/operacional/SeparationQueue' },
    { key: 'op-conf', path: '/operacional/conferencia', component: 'ConferenceQueuePage', importPath: '../pages/operacional/ConferenceQueue' },
    { key: 'op-bill', path: '/operacional/faturamento', component: 'BillingQueuePage', importPath: '../pages/operacional/BillingQueue' },
    { key: 'op-ship', path: '/operacional/expedicao', component: 'ShipmentPage', importPath: '../pages/operacional/ShipmentPage' },
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
