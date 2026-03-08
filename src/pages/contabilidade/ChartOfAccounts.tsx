import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportButton } from '@/components/shared/ExportButton';
import { AdvancedFilters, type FilterField } from '@/components/shared/AdvancedFilters';
import { getAccountTypeLabel } from '@/config/accounting';
import { useChartOfAccounts } from '@/hooks/useChartOfAccounts';
import { cn } from '@/lib/utils';
import { Search, ChevronRight, ChevronDown, BookOpen, Plus, FolderTree } from 'lucide-react';
import type { ExportColumn } from '@/lib/exportUtils';
import type { ChartOfAccount } from '@/types/accounting';

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
  { key: 'balance', label: 'Saldo', format: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v)) },
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
  const { accounts, loading } = useChartOfAccounts();
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
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plano de Contas</h1>
          <p className="text-muted-foreground">Estrutura hierárquica das contas contábeis</p>
        </div>
        <div className="flex gap-2">
          <ExportButton data={accounts as unknown as Record<string, unknown>[]} columns={exportColumns} filename="plano_de_contas" />
          <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Conta</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2"><BookOpen className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Contas</p>
                <p className="text-xl font-bold">{accounts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2"><FolderTree className="h-5 w-5 text-blue-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Contas Analíticas</p>
                <p className="text-xl font-bold">{analyticalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Ativo Total</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(totalAssets)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Passivo + PL</p>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(totalLiabilitiesEquity)}</p>
            </div>
          </CardContent>
        </Card>
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
    </div>
  );
}
