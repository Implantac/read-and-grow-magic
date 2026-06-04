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
