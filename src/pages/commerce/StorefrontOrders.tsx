import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ShieldAlert, Webhook } from "lucide-react";
import { ShoppingCart } from "lucide-react";
import { usePaymentEventsForStorefront } from "@/hooks/usePaymentEvents";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Skeleton } from "@/ui/base/skeleton";
import { EmptyState } from "@/shared/components/EmptyState";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/base/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/base/select";
import { formatBRL } from "@/lib/formatters";
import { useStorefront } from "@/hooks/useCommerce";
import {
  useStorefrontOrders,
  useUpdateOrderStatus,
} from "@/hooks/useCommerceCheckout";

const PAYMENT_LABEL: Record<string, string> = {
  pending: "Pendente",
  processing: "Processando",
  paid: "Pago",
  failed: "Falhou",
  refunded: "Estornado",
  expired: "Expirado",
};

const PAYMENT_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "outline",
  processing: "secondary",
  paid: "default",
  failed: "destructive",
  refunded: "secondary",
  expired: "outline",
};

const ORDER_STATUS: Array<{ value: string; label: string }> = [
  { value: "created", label: "Criado" },
  { value: "confirmed", label: "Confirmado" },
  { value: "preparing", label: "Em preparação" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregue" },
  { value: "cancelled", label: "Cancelado" },
];

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  credit_card: "Cartão",
  pix: "PIX",
  boleto: "Boleto",
};

export default function StorefrontOrders() {
  const { storefrontId = "" } = useParams<{ storefrontId: string }>();
  const navigate = useNavigate();
  const { data: storefront, isLoading: loadingStore } = useStorefront(storefrontId);
  const { data: orders = [], isLoading } = useStorefrontOrders(storefrontId);
  const updateStatus = useUpdateOrderStatus();

  return (
    <RoleGuard roles={["admin", "manager"]}>
      <PageContainer>
        <PageHeader
          title="Pedidos da loja"
          description={storefront ? `${storefront.name} · ${orders.length} pedido(s)` : "Carregando..."}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/commerce/lojas/${storefrontId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
          }
        />

        {isLoading || loadingStore ? (
          <Skeleton className="h-64 w-full" />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Nenhum pedido ainda"
            description="Assim que sua loja receber pedidos pelo checkout, eles aparecerão aqui."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Status pgto.</TableHead>
                    <TableHead>Status pedido</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o: Record<string, unknown>) => {
                    const order = o as {
                      id: string;
                      order_number: string;
                      customer_name: string;
                      customer_email: string;
                      payment_method: string;
                      payment_status: string;
                      order_status: string;
                      total: number;
                      created_at: string;
                      items?: unknown[];
                    };
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">
                          {order.order_number}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {order.customer_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {order.customer_email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {PAYMENT_METHOD_LABEL[order.payment_method] ??
                              order.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              PAYMENT_VARIANT[order.payment_status] ?? "outline"
                            }
                          >
                            {PAYMENT_LABEL[order.payment_status] ??
                              order.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.order_status}
                            onValueChange={(v) =>
                              updateStatus.mutate({
                                id: order.id,
                                order_status: v as never,
                              })
                            }
                          >
                            <SelectTrigger className="h-8 w-36 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ORDER_STATUS.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatBRL(Number(order.total))}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <PaymentEventsPanel storefrontId={storefrontId} />
      </PageContainer>
    </RoleGuard>
  );
}

function PaymentEventsPanel({ storefrontId }: { storefrontId: string }) {
  const { data: events = [], isLoading } = usePaymentEventsForStorefront(storefrontId);
  const projectRef = "arcuhqdiydlvekanychw";
  const webhookUrl = `https://${projectRef}.supabase.co/functions/v1/psp-webhook`;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-primary" />
            <h3 className="font-medium text-sm">Endpoint de webhook</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Configure esta URL no painel do seu PSP (Mercado Pago, Asaas, Efí, Stripe, Pagar.me):
          </p>
          <code className="block break-all rounded bg-muted p-2 text-xs">{webhookUrl}</code>
          <p className="text-xs text-muted-foreground">Headers exigidos:</p>
          <code className="block rounded bg-muted p-2 text-xs">
            X-Webhook-Secret: &lt;PSP_WEBHOOK_SECRET&gt;
            <br />
            X-Provider: mercadopago | asaas | efi | stripe | generic
          </code>
          <p className="text-[10px] text-muted-foreground">
            O segredo já foi gerado e está armazenado como variável do backend. Cole-o no painel do PSP.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Últimos eventos de pagamento
            </h3>
            <Badge variant="outline" className="text-xs">
              {events.length}
            </Badge>
          </div>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : events.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              Nenhum evento recebido ainda.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {events.map((e) => (
                <div key={e.id} className="rounded border p-2 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {e.provider}
                    </Badge>
                    <span className="text-muted-foreground text-[10px]">
                      {new Date(e.processed_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="font-medium">{e.event_type}</div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    {e.status_before && (
                      <>
                        <span>{e.status_before}</span>
                        <span>→</span>
                      </>
                    )}
                    <Badge
                      variant={e.status_after === "paid" ? "default" : "outline"}
                      className="text-[10px]"
                    >
                      {e.status_after ?? "—"}
                    </Badge>
                    {e.signature_valid === false && (
                      <span className="ml-auto flex items-center gap-1 text-destructive">
                        <ShieldAlert className="h-3 w-3" /> assinatura inválida
                      </span>
                    )}
                  </div>
                  {e.external_id && (
                    <div className="text-[10px] text-muted-foreground font-mono truncate">
                      {e.external_id}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
