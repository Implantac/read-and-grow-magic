import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Input } from '@/ui/base/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { EmptyState } from '@/shared/components/EmptyState';
import { ShieldAlert, DollarSign, XCircle, Package, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditRow {
  id: string;
  action: string;
  module: string | null;
  entity_name: string | null;
  entity_id: string | null;
  user_id: string | null;
  old_data: any;
  new_data: any;
  created_at: string;
}

const ACTION_META: Record<string, { label: string; icon: any; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
  price_change: { label: 'Preço alterado', icon: DollarSign, variant: 'secondary' },
  order_cancelled: { label: 'Pedido cancelado', icon: XCircle, variant: 'destructive' },
  stock_adjustment: { label: 'Ajuste de estoque', icon: Package, variant: 'outline' },
};

export default function CriticalAuditLog() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('all');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('system_audit_logs')
        .select('id, action, module, entity_name, entity_id, user_id, old_data, new_data, created_at')
        .in('action', ['price_change', 'order_cancelled', 'stock_adjustment'])
        .order('created_at', { ascending: false })
        .limit(500);
      setRows((data ?? []) as AuditRow[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => rows.filter(r => {
    if (action !== 'all' && r.action !== action) return false;
    if (search) {
      const s = search.toLowerCase();
      return (r.entity_name || '').toLowerCase().includes(s) || (r.action || '').toLowerCase().includes(s);
    }
    return true;
  }), [rows, search, action]);

  const kpis = useMemo(() => ({
    total: rows.length,
    price: rows.filter(r => r.action === 'price_change').length,
    cancelled: rows.filter(r => r.action === 'order_cancelled').length,
    stock: rows.filter(r => r.action === 'stock_adjustment').length,
  }), [rows]);

  const describeChange = (r: AuditRow) => {
    if (r.action === 'price_change') {
      const o = r.old_data || {}; const n = r.new_data || {};
      const parts: string[] = [];
      if (o.sale_price !== n.sale_price) parts.push(`Venda: R$ ${Number(o.sale_price ?? 0).toFixed(2)} → R$ ${Number(n.sale_price ?? 0).toFixed(2)}`);
      if (o.cost_price !== n.cost_price) parts.push(`Custo: R$ ${Number(o.cost_price ?? 0).toFixed(2)} → R$ ${Number(n.cost_price ?? 0).toFixed(2)}`);
      return parts.join(' • ');
    }
    if (r.action === 'order_cancelled') {
      return `Status: ${r.old_data?.status ?? '-'} → ${r.new_data?.status ?? '-'} • Total R$ ${Number(r.new_data?.total ?? 0).toFixed(2)}`;
    }
    if (r.action === 'stock_adjustment') {
      const n = r.new_data || {};
      return `${n.direction === 'in' ? '+' : '-'}${n.quantity} ${n.product_code ? `(${n.product_code})` : ''} ${n.reference ? ` • Ref: ${n.reference}` : ''}`;
    }
    return '';
  };

  return (
    <PageContainer>
      <PageHeader title="Auditoria Crítica (Imutável)" description="Trilha imutável de alterações de preço, cancelamentos de pedido e ajustes manuais de estoque." icon={ShieldAlert} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard title="Eventos (500 recentes)" value={kpis.total} icon={ShieldAlert} />
        <KPICard title="Alterações de Preço" value={kpis.price} icon={DollarSign} />
        <KPICard title="Pedidos Cancelados" value={kpis.cancelled} icon={XCircle} />
        <KPICard title="Ajustes de Estoque" value={kpis.stock} icon={Package} />
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6 flex gap-3 flex-col md:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por entidade ou ação…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="w-full md:w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="price_change">Alterações de Preço</SelectItem>
              <SelectItem value="order_cancelled">Pedidos Cancelados</SelectItem>
              <SelectItem value="stock_adjustment">Ajustes de Estoque</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando…</div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={ShieldAlert} title="Sem eventos" description="Nenhum evento crítico registrado com os filtros atuais." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Mudança</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => {
                  const meta = ACTION_META[r.action] ?? { label: r.action, icon: ShieldAlert, variant: 'outline' as const };
                  const Icon = meta.icon;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(r.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={meta.variant} className="gap-1"><Icon className="h-3 w-3" />{meta.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{r.module}</TableCell>
                      <TableCell className="text-sm font-medium">{r.entity_name || '-'}</TableCell>
                      <TableCell className="text-sm">{describeChange(r)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
