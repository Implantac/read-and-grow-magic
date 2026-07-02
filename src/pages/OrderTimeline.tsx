import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState } from '@/shared/components/EmptyState';
import { AuditTrailPanel } from '@/shared/components/AuditTrailPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';

import {
  ArrowLeft,
  ClipboardList,
  FileText,
  Factory,
  PackageCheck,
  Receipt,
  Banknote,
  History,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimelineEvent {
  key: string;
  at: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  tone: 'primary' | 'success' | 'warning' | 'info';
}

const toneClasses: Record<TimelineEvent['tone'], string> = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-green-500/10 text-green-600 border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

function fmt(dt?: string | null) {
  if (!dt) return '—';
  try {
    return format(new Date(dt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return dt;
  }
}

/**
 * Timeline unificada do pedido — costura lead → orçamento → pedido → OP → conferência → NF → AR.
 * Consulta tabelas existentes (orders, order_status_history, quotations, production_orders,
 * conference_records, nfe, accounts_receivable) filtrando por order_id/customer.
 */
export default function OrderTimeline() {
  const { orderId } = useParams<{ orderId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['order-timeline', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const [order, history, prod, conf, nfes, ar] = await Promise.all([
        supabase.from('orders').select('*, clients(name)').eq('id', orderId!).maybeSingle(),
        supabase.from('order_status_history').select('*').eq('order_id', orderId!).order('created_at'),
        supabase.from('production_orders').select('id, order_number, status, created_at, updated_at').eq('sales_order_id', orderId!).order('created_at') as any,
        supabase.from('conference_records').select('id, code, status, created_at').eq('order_id', orderId!).order('created_at') as any,
        supabase.from('nfe').select('id, numero, serie, status, data_emissao').eq('order_id', orderId!).order('data_emissao') as any,
        supabase.from('accounts_receivable').select('id, document_number, status, due_date, amount, created_at').eq('order_id', orderId!).order('created_at') as any,
      ]);

      const events: TimelineEvent[] = [];
      const o: any = order.data;

      if (o?.created_at) {
        events.push({
          key: 'created',
          at: o.created_at,
          title: `Pedido ${o.number ?? o.order_number ?? ''} criado`,
          subtitle: o.clients?.name ? `Cliente: ${o.clients.name}` : o.client_name || undefined,
          icon: ClipboardList,
          tone: 'primary',
        });
      }

      (history.data ?? []).forEach((h: any) => {
        events.push({
          key: `hist-${h.id}`,
          at: h.created_at,
          title: `Status: ${h.new_status ?? h.status ?? '—'}`,
          subtitle: h.reason || h.notes || undefined,
          icon: History,
          tone: 'info',
        });
      });

      (prod.data ?? []).forEach((p: any) => {
        events.push({
          key: `prod-${p.id}`,
          at: p.created_at,
          title: `Ordem de produção ${p.order_number ?? ''}`,
          subtitle: `Status: ${p.status ?? '—'}`,
          icon: Factory,
          tone: 'warning',
        });
      });

      (conf.data ?? []).forEach((c: any) => {
        events.push({
          key: `conf-${c.id}`,
          at: c.created_at,
          title: `Conferência ${c.code ?? ''}`,
          subtitle: `Status: ${c.status ?? '—'}`,
          icon: PackageCheck,
          tone: 'info',
        });
      });

      (nfes.data ?? []).forEach((n: any) => {
        events.push({
          key: `nfe-${n.id}`,
          at: n.data_emissao ?? new Date().toISOString(),
          title: `NF-e ${n.numero ?? ''} / série ${n.serie ?? ''}`,
          subtitle: `Status: ${n.status ?? '—'}`,
          icon: Receipt,
          tone: 'success',
        });
      });

      (ar.data ?? []).forEach((r: any) => {
        events.push({
          key: `ar-${r.id}`,
          at: r.created_at,
          title: `Título a receber ${r.document_number ?? ''}`,
          subtitle: `R$ ${Number(r.amount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · Vence ${r.due_date ?? '—'} · ${r.status ?? ''}`,
          icon: Banknote,
          tone: 'success',
        });
      });

      events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

      return { order: order.data, events };
    },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Linha do tempo do pedido"
        description={(data?.order as any)?.number ? `Pedido ${(data!.order as any).number}` : 'Rastreamento cross-módulo'}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/comercial/pedidos">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : !data?.events?.length ? (
        <EmptyState
          icon={FileText}
          title="Sem eventos"
          description="Este pedido ainda não gerou eventos rastreáveis nos módulos integrados."
        />
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-border" aria-hidden />
          <ol className="space-y-4">
            {data.events.map((ev) => {
              const Icon = ev.icon;
              return (
                <li key={ev.key} className="relative">
                  <span
                    className={`absolute -left-[22px] flex h-5 w-5 items-center justify-center rounded-full border ${toneClasses[ev.tone]}`}
                    aria-hidden
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                  <Card>
                    <CardContent className="flex flex-wrap items-start justify-between gap-2 p-4">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{ev.title}</p>
                        {ev.subtitle && (
                          <p className="mt-0.5 text-sm text-muted-foreground break-words">{ev.subtitle}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="shrink-0 tabular-nums">
                        {fmt(ev.at)}
                      </Badge>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {orderId && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" /> Trilha de auditoria
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AuditTrailPanel entityName="orders" entityId={orderId} limit={200} height={360} />
          </CardContent>
        </Card>
      )}

    </PageContainer>
  );
}
