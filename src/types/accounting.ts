export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type AccountNature = 'debit' | 'credit';

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  nature: AccountNature;
  parentId: string | null;
  level: number;
  isAnalytical: boolean;
  balance: number;
  active: boolean;
}

export type JournalEntryStatus = 'draft' | 'posted' | 'reversed';

export interface JournalEntryLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

export interface JournalEntry {
  id: string;
  number: string;
  date: string;
  description: string;
  status: JournalEntryStatus;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  createdBy: string;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  journalNumber: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface TrialBalanceItem {
  accountCode: string;
  accountName: string;
  type: AccountType;
  previousDebit: number;
  previousCredit: number;
  periodDebit: number;
  periodCredit: number;
  currentDebit: number;
  currentCredit: number;
}

export interface DREItem {
  id: string;
  code: string;
  description: string;
  currentPeriod: number;
  previousPeriod: number;
  variation: number;
  level: number;
  isTotal: boolean;
}

export interface BalanceSheetItem {
  id: string;
  code: string;
  description: string;
  currentPeriod: number;
  previousPeriod: number;
  level: number;
  isTotal: boolean;
  section: 'asset' | 'liability' | 'equity';
}
