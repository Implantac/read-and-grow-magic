import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';

const AccountsPayable = lazy(() => import("../modules/financial/AccountsPayable"));
const AccountsReceivable = lazy(() => import("../modules/financial/AccountsReceivable"));
const CashFlow = lazy(() => import("../modules/financial/CashFlow"));
const BankReconciliation = lazy(() => import("../modules/financial/BankReconciliation"));
const FinancialDashboardPage = lazy(() => import("../modules/financial/FinancialDashboard"));
const BankAccountsPage = lazy(() => import("../modules/financial/BankAccounts"));
const CostCentersPage = lazy(() => import("../modules/financial/CostCenters"));
const RenegotiationsPage = lazy(() => import("../modules/financial/Renegotiations"));
const DRELedgerPage = lazy(() => import("../modules/financial/DRELedger"));
const FinancialAuditPage = lazy(() => import("../modules/financial/FinancialAudit"));
const PixChargesPage = lazy(() => import("../modules/financial/PixCharges"));
const ChecksPage = lazy(() => import("../modules/financial/Checks"));
const BoletosPage = lazy(() => import("../modules/financial/Boletos"));
const FinancialIntelligencePage = lazy(() => import("../modules/financial/FinancialIntelligence"));
const FinancialBIPage = lazy(() => import("../modules/financial/FinancialBI"));
const FinancialAntifraudPage = lazy(() => import("../modules/financial/FinancialAntifraud"));
const BankStatementImportPage = lazy(() => import("../modules/financial/BankStatementImport"));
const AdvancesPage = lazy(() => import("../modules/financial/Advances"));
const FinancialHubPage = lazy(() => import("../modules/financial/FinancialHub"));
const AccountStatementPage = lazy(() => import("../modules/financial/AccountStatement"));
const FinancialOffsetPage = lazy(() => import("../modules/financial/FinancialOffset"));
const ChargesRulerPage = lazy(() => import("../modules/financial/ChargesRuler"));
const RecurringPage = lazy(() => import("../modules/financial/RecurringPage"));
const DefaultManagementPage = lazy(() => import("../modules/financial/DefaultManagement"));
const CashflowScenariosPage = lazy(() => import("../modules/financial/CashflowScenarios"));
const FinancialAlertsPage = lazy(() => import("../modules/financial/FinancialAlerts"));
const DREDynamicPage = lazy(() => import("../modules/financial/DREDynamicPage"));
const FinancialSegmentadoPage = lazy(() => import("../modules/financial/FinancialSegmentado"));
const ConciliacaoBancariaCanalPage = lazy(() => import("../modules/financial/ConciliacaoBancariaCanal"));
const DivergenceDashboardPage = lazy(() => import("../modules/financial/DivergenceDashboard"));



export const FinancialRoutes = [
  <Route key="fin-index" index element={<Navigate to="dashboard" replace />} />,
  <Route key="fin-hub" path="central" element={<FinancialHubPage />} />,
  <Route key="fin-dash" path="dashboard" element={<FinancialDashboardPage />} />,
  <Route key="fin-pay" path="pagar" element={<AccountsPayable />} />,
  <Route key="fin-rec" path="receber" element={<AccountsReceivable />} />,
  <Route key="fin-flow" path="fluxo" element={<CashFlow />} />,
  <Route key="fin-bank" path="tesouraria" element={<BankAccountsPage />} />,
  <Route key="fin-cc" path="centros-custo" element={<CostCentersPage />} />,
  <Route key="fin-reneg" path="renegociacoes" element={<RenegotiationsPage />} />,
  <Route key="fin-recon" path="conciliacao" element={<BankReconciliation />} />,
  <Route key="fin-recon-canal" path="conciliacao-canal" element={<ConciliacaoBancariaCanalPage />} />,
  <Route key="fin-dre" path="dre" element={<DRELedgerPage />} />,
  <Route key="fin-audit" path="auditoria" element={<FinancialAuditPage />} />,
  <Route key="fin-pix" path="pix" element={<PixChargesPage />} />,
  <Route key="fin-checks" path="cheques" element={<ChecksPage />} />,
  <Route key="fin-boletos" path="boletos" element={<BoletosPage />} />,
  <Route key="fin-intel" path="inteligencia" element={<FinancialIntelligencePage />} />,
  <Route key="fin-bi" path="bi" element={<FinancialBIPage />} />,
  <Route key="fin-fraud" path="antifraude" element={<FinancialAntifraudPage />} />,
  <Route key="fin-import" path="importar-extrato" element={<BankStatementImportPage />} />,
  <Route key="fin-adv" path="adiantamentos" element={<AdvancesPage />} />,
  <Route key="fin-stmt" path="conta-corrente" element={<AccountStatementPage />} />,
  <Route key="fin-offset" path="compensacao" element={<FinancialOffsetPage />} />,
  <Route key="fin-ruler" path="cobranca-automatica" element={<ChargesRulerPage />} />,
  <Route key="fin-recur" path="recorrencias" element={<RecurringPage />} />,
  <Route key="fin-default" path="inadimplencia" element={<DefaultManagementPage />} />,
  <Route key="fin-scen" path="cenarios" element={<CashflowScenariosPage />} />,
  <Route key="fin-alerts" path="alertas" element={<FinancialAlertsPage />} />,
  <Route key="fin-dre-dyn" path="dre-dinamico" element={<DREDynamicPage />} />,
  <Route key="fin-segmentado" path="segmentado" element={<FinancialSegmentadoPage />} />,
];

