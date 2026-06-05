import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Skeleton } from '@/ui/base/skeleton';
import { ExportButton } from '@/shared/components/ExportButton';
import { AdvancedFilters, type FilterField } from '@/shared/components/AdvancedFilters';
import { getAccountTypeLabel } from '@/config/accounting';
import { useAccounting } from '@/hooks/accounting/useAccounting';

import { cn } from '@/lib/utils';
import { Search, ChevronRight, ChevronDown, BookOpen, Plus, FolderTree, DollarSign } from 'lucide-react';
import type { ExportColumn } from '@/lib/exportUtils';
import type { ChartOfAccount } from '@/types/accounting';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';

import { formatBRL } from '@/lib/formatters';
const typeColorMap: Record<string, string> = {
  asset: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  liability: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  equity: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  revenue: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  expense: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const exportColumns: ExportColumn[] = [
  { key: 'code', label: 'Código' },
  { key: 'name', label: 'Nome' },
  { key: 'type', label: 'Tipo', format: (v) => getAccountTypeLabel(String(v)) },
  { key: 'nature', label: 'Natureza', format: (v) => v === 'debit' ? 'Devedora' : 'Credora' },
  { key: 'isAnalytical', label: 'Nível', format: (v) => v ? 'Analítica' : 'Sintética' },
  { key: 'balance', label: 'Saldo', format: (v) => formatBRL(Number(v)) },
];

const accountFilterFields: FilterField[] = [
  {
    key: 'type', label: 'Tipo de Conta', type: 'select',
    options: [
      { value: 'asset', label: 'Ativo' },
      { value: 'liability', label: 'Passivo' },
      { value: 'equity', label: 'Patrimônio Líquido' },
      { value: 'revenue', label: 'Receita' },
      { value: 'expense', label: 'Despesa' },
    ],
  },
  {
    key: 'nature', label: 'Natureza', type: 'select',
    options: [
      { value: 'debit', label: 'Devedora' },
      { value: 'credit', label: 'Credora' },
    ],
  },
  {
    key: 'level', label: 'Nível', type: 'select',
    options: [
      { value: 'analytical', label: 'Analítica' },
      { value: 'synthetic', label: 'Sintética' },
    ],
  },
];

export default function ChartOfAccountsPage() {
  const { accounts, accountsLoading: loading } = useAccounting();

  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Auto-expand root accounts when data loads
  useMemo(() => {
    if (accounts.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set(accounts.filter(a => a.parentId === null).map(a => a.id)));
    }
  }, [accounts]);

  const formatCurrency = (value: number) =>
    formatBRL(value);

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) => {
      if (search && !a.code.toLowerCase().includes(search.toLowerCase()) && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.type && a.type !== filters.type) return false;
      if (filters.nature && a.nature !== filters.nature) return false;
      if (filters.level === 'analytical' && !a.isAnalytical) return false;
      if (filters.level === 'synthetic' && a.isAnalytical) return false;
      return true;
    });
  }, [accounts, search, filters]);

  const rootAccounts = filteredAccounts.filter((a) => a.parentId === null);
  const getChildren = (parentId: string) => filteredAccounts.filter((a) => a.parentId === parentId);

  const analyticalCount = accounts.filter((a) => a.isAnalytical).length;
  const totalAssets = accounts.filter(a => a.type === 'asset' && a.level === 1).reduce((s, a) => s + a.balance, 0);
  const totalLiabilitiesEquity = accounts.filter(a => (a.type === 'liability' || a.type === 'equity') && a.level === 1).reduce((s, a) => s + a.balance, 0);

  const renderAccount = (account: ChartOfAccount, depth = 0) => {
    const children = getChildren(account.id);
    const isExpanded = expandedGroups.has(account.id);
    const hasChildren = children.length > 0;

    return (
      <div key={account.id}>
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-accent/50',
            account.isAnalytical ? 'text-sm' : 'font-semibold',
            depth === 0 && 'bg-muted/50'
          )}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
        >
          {hasChildren ? (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleGroup(account.id)}>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          ) : (
            <div className="w-6" />
          )}
          <span className="font-mono text-xs text-muted-foreground w-16">{account.code}</span>
          <span className="flex-1">{account.name}</span>
          <Badge variant="outline" className={cn('text-xs', typeColorMap[account.type])}>
            {getAccountTypeLabel(account.type)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {account.nature === 'debit' ? 'D' : 'C'}
          </Badge>
          {account.isAnalytical && (
            <Badge variant="secondary" className="text-xs">Analítica</Badge>
          )}
          <span className={cn('w-32 text-right font-mono text-sm', account.balance < 0 && 'text-destructive')}>
            {formatCurrency(Math.abs(account.balance))}
          </span>
        </div>
        {hasChildren && isExpanded && children.map((child) => renderAccount(child, depth + 1))}
      </div>
    );
  };

  return (
    <PageContainer loading={loading}>
      <PageHeader title="Plano de Contas" description="Estrutura hierárquica das contas contábeis">
        <ExportButton data={accounts as unknown as Record<string, unknown>[]} columns={exportColumns} filename="plano_de_contas" />
        <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Conta</Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Total de Contas" value={String(accounts.length)} icon={<BookOpen className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Contas Analíticas" value={String(analyticalCount)} icon={<FolderTree className="h-5 w-5" />} accentColor="info" index={1} />
        <KPICard title="Ativo Total" value={formatCurrency(totalAssets)} icon={<DollarSign className="h-5 w-5" />} accentColor="success" index={2} />
        <KPICard title="Passivo + PL" value={formatCurrency(totalLiabilitiesEquity)} icon={<DollarSign className="h-5 w-5" />} accentColor="warning" index={3} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar conta..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <AdvancedFilters fields={accountFilterFields} values={filters} onChange={setFilters} onClear={() => setFilters({})} />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setExpandedGroups(new Set(accounts.map((a) => a.id)))}>Expandir Tudo</Button>
              <Button variant="outline" size="sm" onClick={() => setExpandedGroups(new Set())}>Recolher Tudo</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {rootAccounts.length > 0 ? (
            <div className="space-y-0.5">{rootAccounts.map((a) => renderAccount(a))}</div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma conta cadastrada</p>
              <p className="text-sm">Clique em "Nova Conta" para começar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
