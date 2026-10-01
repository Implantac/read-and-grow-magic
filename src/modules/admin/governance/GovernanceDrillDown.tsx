import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';

type Period = '24h' | '7d' | '30d';
interface Props { type: 'ledger' | 'security' | 'ai'; period: Period; onBack: () => void }
const titles = { ledger: 'Movimentos de estoque', security: 'Registros de auditoria', ai: 'Decisões de IA' };
const csvCell = (value: string) => `"${(/^[=+\-@\t\r]/.test(value) ? "'" : '') + value.replace(/"/g, '""')}"`;

export function GovernanceDrillDown({ type, period, onBack }: Props) {
  const { currentCompany } = useEnterprise();
  const companyId = currentCompany?.id;
  const [search, setSearch] = useState('');
  const start = new Date(Date.now() - ({ '24h': 1, '7d': 7, '30d': 30 }[period] * 86_400_000)).toISOString();
  const query = useQuery({
    queryKey: ['governance-records', companyId, period, type],
    enabled: Boolean(companyId),
    queryFn: async () => {
      if (!companyId) throw new Error('Selecione uma empresa.');
      if (type === 'ledger') {
        const { data, error } = await supabase.from('stock_movements').select('id,created_at,type,product_name,quantity,direction,document_number').eq('company_id', companyId).gte('created_at', start).order('created_at', { ascending: false }).limit(100);
        if (error) throw error;
        return (data ?? []).map(row => ({ id: row.id, date: row.created_at, title: `${row.type} · ${row.product_name}`, detail: `${row.direction} · ${row.quantity} · ${row.document_number}` }));
      }
      if (type === 'security') {
        const { data, error } = await supabase.from('system_audit_logs').select('id,created_at,action,module,entity_name,entity_id').eq('company_id', companyId).gte('created_at', start).order('created_at', { ascending: false }).limit(100);
        if (error) throw error;
        return (data ?? []).map(row => ({ id: row.id, date: row.created_at, title: `${row.action} · ${row.module}`, detail: [row.entity_name, row.entity_id].filter(Boolean).join(' · ') }));
      }
      const { data, error } = await supabase.from('ai_brain_decisions').select('id,created_at,title,status,module,rationale').eq('company_id', companyId).gte('created_at', start).order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []).map(row => ({ id: row.id, date: row.created_at, title: row.title, detail: `${row.module} · ${row.status} · ${row.rationale}` }));
    },
  });
  const records = (query.data ?? []).filter(row => `${row.title} ${row.detail}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  const exportCSV = () => {
    const csv = '\uFEFF' + [['Data', 'Evento', 'Detalhes'], ...records.map(row => [new Date(row.date).toLocaleString('pt-BR'), row.title, row.detail])].map(row => row.map(value => csvCell(String(value ?? ''))).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `governanca-${type}.csv`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center gap-3"><Button variant="ghost" size="icon" aria-label="Voltar à governança" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button><h2 className="flex-1 text-xl font-semibold">{titles[type]}</h2><Button variant="outline" size="icon" aria-label="Atualizar registros" title="Atualizar registros" disabled={query.isFetching || !companyId} onClick={() => void query.refetch()}><RefreshCw className="h-4 w-4" /></Button><Button variant="outline" disabled={!query.data || !records.length} onClick={exportCSV}><Download className="mr-2 h-4 w-4" />CSV</Button></div>
    <Input aria-label="Buscar registros" placeholder="Buscar registros" value={search} onChange={event => setSearch(event.target.value)} />
    {query.isLoading ? <p role="status" className="text-sm text-muted-foreground">Carregando registros…</p> : query.isError ? <p role="alert" className="text-sm text-destructive">Não foi possível consultar os registros. Tente atualizar.</p> : !records.length ? <p className="text-sm text-muted-foreground">Nenhum registro encontrado no período.</p> : <div className="divide-y border-y">{records.map(row => <div key={row.id} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr]"><time className="text-xs text-muted-foreground" dateTime={row.date}>{new Date(row.date).toLocaleString('pt-BR')}</time><div className="min-w-0"><p className="font-medium break-words">{row.title}</p><p className="text-sm text-muted-foreground break-words">{row.detail}</p></div></div>)}</div>}
    {records.length === 100 && <p className="text-xs text-muted-foreground">Exibindo os 100 registros mais recentes do período.</p>}
  </div>;
}
