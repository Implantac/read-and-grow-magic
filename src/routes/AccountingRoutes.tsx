import { lazy } from 'react';
import { Route } from 'react-router-dom';

const ChartOfAccountsPage = lazy(() => import("../pages/contabilidade/ChartOfAccounts"));
const JournalEntriesPage = lazy(() => import("../pages/contabilidade/JournalEntries"));
const GeneralLedgerPage = lazy(() => import("../pages/contabilidade/GeneralLedger"));
const TrialBalancePage = lazy(() => import("../pages/contabilidade/TrialBalance"));
const DREPage = lazy(() => import("../pages/contabilidade/DRE"));
const BalanceSheetPage = lazy(() => import("../pages/contabilidade/BalanceSheet"));
const AccountingDashboardPage = lazy(() => import("../pages/contabilidade/AccountingDashboard"));
const PeriodClosingPage = lazy(() => import("../pages/contabilidade/PeriodClosing"));

export const AccountingRoutes = [
  <Route key="acc-chart" path="/contabilidade/plano-contas" element={<ChartOfAccountsPage />} />,
  <Route key="acc-journal" path="/contabilidade/lancamentos" element={<JournalEntriesPage />} />,
  <Route key="acc-ledger" path="/contabilidade/razao" element={<GeneralLedgerPage />} />,
  <Route key="acc-trial" path="/contabilidade/balancete" element={<TrialBalancePage />} />,
  <Route key="acc-dre" path="/contabilidade/dre" element={<DREPage />} />,
  <Route key="acc-balance" path="/contabilidade/balanco" element={<BalanceSheetPage />} />,
  <Route key="acc-dash" path="/contabilidade/dashboard" element={<AccountingDashboardPage />} />,
  <Route key="acc-closing" path="/contabilidade/fechamento" element={<PeriodClosingPage />} />,
];
