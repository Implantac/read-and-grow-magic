import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Separator } from "@/ui/base/separator";
import { formatBRL } from "@/lib/formatters";
import { toast } from "@/ui/base/use-toast";
import type { StorefrontOrder } from "@/hooks/useCommerceCheckout";
import { Row } from "./primitives";

interface Props {
  order: StorefrontOrder;
  storeName: string;
  onNew: () => void;
}

export function OrderConfirmation({ order, storeName, onNew }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!order.pix_copy_paste) return;
    navigator.clipboard.writeText(order.pix_copy_paste);
    setCopied(true);
    toast({ title: "Código copiado", description: "Cole no app do seu banco." });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-2xl p-4 md:p-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="mt-2">Pedido confirmado</CardTitle>
            <p className="text-sm text-muted-foreground">
              {storeName} · Nº {order.order_number}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.payment_method === "pix" && order.pix_qr_code && (
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm font-medium mb-2">Pague com PIX para confirmar</p>
                <img src={order.pix_qr_code} alt="QR Code PIX" className="mx-auto h-56 w-56 rounded" />
                <p className="text-xs text-muted-foreground mt-3">Ou copie o código abaixo:</p>
                <div className="mt-2 flex gap-2">
                  <Input readOnly value={order.pix_copy_paste ?? ""} className="text-xs font-mono" />
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="h-4 w-4 mr-1" />
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Expira em 30 minutos. Após o pagamento, o pedido é confirmado automaticamente.
                </p>
              </div>
            )}

            {order.payment_method === "credit_card" && (
              <div className="rounded-lg border p-4 bg-green-500/5">
                <p className="text-sm font-medium">
                  Pagamento aprovado · {order.card_brand} •••• {order.card_last4}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Você receberá o rastreamento por e-mail em {order.customer_email}.
                </p>
              </div>
            )}

            {order.payment_method === "boleto" && (
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Boleto enviado por e-mail</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Confirme o pagamento em até 3 dias úteis para não cancelar o pedido.
                </p>
              </div>
            )}

            <Separator />
            <div className="space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatBRL(Number(order.subtotal))} />
              <Row label="Frete" value={formatBRL(Number(order.shipping))} />
              <div className="flex justify-between font-semibold text-base pt-1">
                <span>Total</span>
                <span>{formatBRL(Number(order.total))}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onNew}>
                Continuar comprando
              </Button>
              <Button asChild className="flex-1">
                <Link to={`/loja/${storeName}`}>Concluir</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
