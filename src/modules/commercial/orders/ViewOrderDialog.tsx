import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowRight, CalendarDays, CheckCircle, CreditCard, FileText, Package,
  ShieldAlert, ShieldCheck, StickyNote, User, XCircle,
} from 'lucide-react';
import { formatBRL, formatDate } from '@/lib/formatters';
import { Button } from '@/ui/base/button';
import { Card, CardContent } from '@/ui/base/card';
import { Separator } from '@/ui/base/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { getOrderStatusLabel, getPaymentMethodLabel } from '@/config/commercial';
import type { DbOrder } from '@/hooks/commercial/useOrders';
import { ApprovalBadge } from './ApprovalBadge';
import { OrderStatusTimeline } from './OrderStatusTimeline';
import { statusFlow } from './constants';
import { AuditTrailPanel } from '@/shared/components/AuditTrailPanel';

interface ViewOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: DbOrder | null;
  onApprove: (orderId: string, field: string, value: string) => void;
  onAdvance: (order: DbOrder) => void;
  onAskCancel: () => void;
}

export function ViewOrderDialog({
  open, onOpenChange, order, onApprove, onAdvance, onAskCancel,
}: ViewOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-0">
        {order && (
          <>
            <div className="bg-primary/5 px-6 pt-6 pb-4">
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl">
                        Pedido <span className="font-mono">{order.number}</span>
                      </DialogTitle>
                      <p className="text-sm text-muted-foreground">
                        Emitido em {format(new Date(order.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge type="priority" status={order.priority} />
                    <StatusBadge type="order" status={order.status} />
                  </div>
                </div>
              </DialogHeader>

              <div className="mt-4">
                <OrderStatusTimeline currentStatus={order.status} />
              </div>
            </div>

            <div className="space-y-5 px-6 pb-6 pt-2">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
                  <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Cliente</p>
                    <p className="text-sm font-medium">{order.client_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
                  <CreditCard className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Pagamento</p>
                    <p className="text-sm font-medium">{getPaymentMethodLabel(order.payment_method as any)}</p>
                    <p className="text-xs text-muted-foreground">{order.payment_condition}</p>
                  </div>
                </div>
                {order.delivery_date && (
                  <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Entrega Prevista</p>
                      <p className="text-sm font-medium">
                        {format(new Date(order.delivery_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
                {order.sales_rep_name && (
                  <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
                    <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Vendedor</p>
                      <p className="text-sm font-medium">{order.sales_rep_name}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" /> Aprovações
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Comercial:</span>
                    <ApprovalBadge status={order.commercial_approval} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Financeira:</span>
                    <ApprovalBadge status={order.financial_approval} />
                  </div>
                </div>
                {order.status === 'pending' && (
                  <div className="flex gap-2 pt-1">
                    {order.commercial_approval !== 'approved' && (
                      <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => onApprove(order.id, 'commercial_approval', 'approved')}>
                        <CheckCircle className="h-3 w-3" /> Aprovar Comercial
                      </Button>
                    )}
                    {order.financial_approval !== 'approved' && (
                      <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => onApprove(order.id, 'financial_approval', 'approved')}>
                        <CheckCircle className="h-3 w-3" /> Aprovar Financeira
                      </Button>
                    )}
                    {(order.commercial_approval !== 'approved' || order.financial_approval !== 'approved') && (
                      <Button size="sm" variant="ghost" className="text-xs gap-1 text-destructive" onClick={() => onApprove(order.id, order.commercial_approval !== 'rejected' ? 'commercial_approval' : 'financial_approval', 'rejected')}>
                        <ShieldAlert className="h-3 w-3" /> Rejeitar
                      </Button>
                    )}
                  </div>
                )}
                {order.approved_by && (
                  <p className="text-[11px] text-muted-foreground">Aprovado por: {order.approved_by}{order.approved_at ? ` em ${formatDate(order.approved_at)}` : ''}</p>
                )}
              </div>

              {order.items && order.items.length > 0 && (
                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    Itens do Pedido ({order.items.length})
                  </h4>
                  <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Produto</th>
                          <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Qtd</th>
                          <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Preço Unit.</th>
                          <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Desc.</th>
                          <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, idx) => (
                          <tr key={item.id} className={idx < order.items!.length - 1 ? 'border-b' : ''}>
                            <td className="px-4 py-3">
                              <p className="font-medium">{item.product_name}</p>
                              <p className="font-mono text-xs text-muted-foreground">{item.product_code}</p>
                            </td>
                            <td className="px-4 py-3 text-right font-mono">{item.quantity}</td>
                            <td className="px-4 py-3 text-right">{formatBRL(item.unit_price)}</td>
                            <td className="px-4 py-3 text-right">
                              {item.discount > 0 ? (
                                <span className="text-destructive">-{formatBRL(item.discount)}</span>
                              ) : '—'}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">{formatBRL(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Card className="w-72 bg-muted/30">
                  <CardContent className="space-y-2 p-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatBRL(order.subtotal)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-destructive">
                        <span>Desconto</span>
                        <span>-{formatBRL(order.discount)}</span>
                      </div>
                    )}
                    {order.shipping > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Frete</span>
                        <span>{formatBRL(order.shipping)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-base font-bold">
                      <span>Total</span>
                      <span className="text-primary">{formatBRL(order.total)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {order.notes && (
                <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4">
                  <StickyNote className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Observações</p>
                    <p className="mt-1 text-sm">{order.notes}</p>
                  </div>
                </div>
              )}

              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                <div className="flex items-center justify-end gap-2 border-t pt-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => { onOpenChange(false); onAskCancel(); }}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Cancelar
                  </Button>
                  {statusFlow[order.status] && (
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => { onAdvance(order); onOpenChange(false); }}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      Avançar para {getOrderStatusLabel(statusFlow[order.status]! as any)}
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="px-6 pb-6">
              <AuditTrailPanel entityType="order" entityId={order.id} title="Histórico de Auditoria" />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
