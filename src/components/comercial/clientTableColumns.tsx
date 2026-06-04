import { Badge } from '@/ui/base/badge';
import { type DbClient } from '@/hooks/commercial/useClients';
import { type Column } from '@/shared/components/DataTable';
import { StatusBadge } from '@/shared/components/StatusBadge';

export const clientTableColumns: Column<DbClient>[] = [
  { key: 'code', label: 'Código', sortable: true },
  { key: 'name', label: 'Nome/Razão Social', sortable: true, render: (_, row) => (
    <div>
      <p className="font-medium">{row.name}</p>
      {row.trade_name && <p className="text-[10px] text-muted-foreground">{row.trade_name}</p>}
    </div>
  )},
  { key: 'document', label: 'CPF/CNPJ', sortable: true },
  { key: 'address_city', label: 'Cidade/UF', render: (_, row) => `${row.address_city}/${row.address_state}` },
  { key: 'abc_classification', label: 'ABC', sortable: true, render: (v) => (
    <Badge variant={(v as string) === 'A' ? 'default' : 'secondary'} className="text-xs font-bold w-7 justify-center">{(v as string) || 'C'}</Badge>
  )},
  { key: 'client_score', label: 'Score', render: (v) => {
    const score = (v as string) || 'medium';
    const cfg: Record<string, { label: string; cls: string }> = {
      high: { label: 'Alto', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
      medium: { label: 'Médio', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
      low: { label: 'Baixo', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
    };
    return <Badge className={`text-[10px] ${cfg[score]?.cls}`}>{cfg[score]?.label || score}</Badge>;
  }},
  { key: 'credit_limit', label: 'Limite', sortable: true,
    render: (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value as number) },
  { key: 'status', label: 'Status', render: (value) => <StatusBadge type="client" status={value as string} /> },
];
