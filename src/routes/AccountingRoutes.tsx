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
  <Route key="acc-chart" path="/accounting/plano-contas" element={<ChartOfAccountsPage />} />,
  <Route key="acc-journal" path="/accounting/lancamentos" element={<JournalEntriesPage />} />,
  <Route key="acc-ledger" path="/accounting/razao" element={<GeneralLedgerPage />} />,
  <Route key="acc-trial" path="/accounting/balancete" element={<TrialBalancePage />} />,
  <Route key="acc-dre" path="/accounting/dre" element={<DREPage />} />,
  <Route key="acc-balance" path="/accounting/balanco" element={<BalanceSheetPage />} />,
  <Route key="acc-dash" path="/accounting/dashboard" element={<AccountingDashboardPage />} />,
  <Route key="acc-closing" path="/accounting/fechamento" element={<PeriodClosingPage />} />,
];
