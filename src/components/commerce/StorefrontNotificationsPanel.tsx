import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Button } from "@/ui/base/button";
import { Skeleton } from "@/ui/base/skeleton";
import { Mail, Send, RefreshCw, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useStorefrontNotifications, useDispatchNotifications } from "@/hooks/useStorefrontNotifications";

const STATUS_META: Record<string, { label: string; color: string; icon: JSX.Element }> = {
  pending: { label: "Pendente", color: "bg-amber-500/20 text-amber-400 border-amber-500/40", icon: <Clock className="h-3 w-3" /> },
  sent:    { label: "Enviada",  color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", icon: <CheckCircle2 className="h-3 w-3" /> },
  failed:  { label: "Falhou",   color: "bg-red-500/20 text-red-400 border-red-500/40", icon: <AlertCircle className="h-3 w-3" /> },
  skipped: { label: "Ignorada", color: "bg-muted text-muted-foreground border-border", icon: <AlertCircle className="h-3 w-3" /> },
};

const EVENT_LABEL: Record<string, string> = {
  order_created: "Pedido criado",
  order_paid: "Pagamento confirmado",
  order_shipped: "Pedido enviado",
  order_cancelled: "Pedido cancelado",
  order_status_changed: "Status atualizado",
};

export function StorefrontNotificationsPanel({ orderId }: { orderId?: string }) {
  const { data, isLoading } = useStorefrontNotifications(orderId);
  const dispatch = useDispatchNotifications();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Notificações {orderId ? "do pedido" : "do commerce"}
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => dispatch.mutate()} disabled={dispatch.isPending}>
          {dispatch.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
          Disparar pendentes
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : (data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma notificação registrada.</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {(data ?? []).map((n) => {
              const meta = STATUS_META[n.status] ?? STATUS_META.pending;
              return (
                <div key={n.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/60 bg-card/50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{EVENT_LABEL[n.event_type] ?? n.event_type}</span>
                      <Badge variant="outline" className={meta.color}>
                        <span className="inline-flex items-center gap-1">{meta.icon}{meta.label}</span>
                      </Badge>
                      <Badge variant="outline" className="text-xs">{n.channel}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {n.recipient ?? "sem destinatário"} · {n.subject ?? "-"}
                    </p>
                    {n.last_error && <p className="text-xs text-red-400 mt-1">Erro: {n.last_error}</p>}
                  </div>
                  <div className="text-xs text-muted-foreground text-right shrink-0">
                    {new Date(n.created_at).toLocaleString("pt-BR")}
                    <div>Tentativas: {n.attempts}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
