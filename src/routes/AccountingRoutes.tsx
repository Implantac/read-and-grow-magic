import { lazy } from 'react';
import { Route } from 'react-router-dom';

const ChartOfAccountsPage = lazy(() => import("../modules/accounting/ChartOfAccounts"));
const JournalEntriesPage = lazy(() => import("../modules/accounting/JournalEntries"));
const GeneralLedgerPage = lazy(() => import("../modules/accounting/GeneralLedger"));
const TrialBalancePage = lazy(() => import("../modules/accounting/TrialBalance"));
const DREPage = lazy(() => import("../modules/accounting/DRE"));
const BalanceSheetPage = lazy(() => import("../modules/accounting/BalanceSheet"));
const AccountingDashboardPage = lazy(() => import("../modules/accounting/AccountingDashboard"));
const PeriodClosingPage = lazy(() => import("../modules/accounting/PeriodClosing"));
const DREManagerialPage = lazy(() => import("../modules/accounting/DREManagerial"));

// Paths relativos: montados sob `/contabilidade/*` em App.tsx.
export const AccountingRoutes = [
  <Route key="acc-chart" path="plano-contas" element={<ChartOfAccountsPage />} />,
  <Route key="acc-journal" path="lancamentos" element={<JournalEntriesPage />} />,
  <Route key="acc-ledger" path="razao" element={<GeneralLedgerPage />} />,
  <Route key="acc-trial" path="balancete" element={<TrialBalancePage />} />,
  <Route key="acc-dre" path="dre" element={<DREPage />} />,
  <Route key="acc-dre-gerencial" path="dre-gerencial" element={<DREManagerialPage />} />,
  <Route key="acc-balance" path="balanco" element={<BalanceSheetPage />} />,
  <Route key="acc-dash" path="dashboard" element={<AccountingDashboardPage />} />,
  <Route key="acc-painel" path="painel" element={<AccountingDashboardPage />} />,
  <Route key="acc-closing" path="fechamento" element={<PeriodClosingPage />} />,
];
