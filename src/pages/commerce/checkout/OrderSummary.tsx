import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Separator } from "@/ui/base/separator";
import { formatBRL } from "@/lib/formatters";
import { Row } from "./primitives";
import type { CheckoutItem } from "@/hooks/useCommerceCheckout";

interface Props {
  items: CheckoutItem[];
  subtotal: number;
  shipping: number;
  total: number;
  primaryColor: string;
  canSubmit: boolean;
  isPending: boolean;
  onSubmit: () => void;
}

export function OrderSummary({
  items, subtotal, shipping, total, primaryColor, canSubmit, isPending, onSubmit,
}: Props) {
  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-base">Resumo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <div>
              <div className="font-medium">{item.product_name}</div>
              <div className="text-xs text-muted-foreground">
                {item.quantity} × {formatBRL(item.unit_price)}
              </div>
            </div>
            <div className="font-medium">
              {formatBRL(item.quantity * item.unit_price)}
            </div>
          </div>
        ))}
        <Separator />
        <Row label="Subtotal" value={formatBRL(subtotal)} />
        <Row label="Frete" value={formatBRL(shipping)} />
        <Separator />
        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span style={{ color: primaryColor }}>{formatBRL(total)}</span>
        </div>
        <Button
          className="w-full mt-2"
          size="lg"
          disabled={!canSubmit || isPending}
          onClick={onSubmit}
          style={{ backgroundColor: primaryColor, color: "white" }}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Finalizar compra · {formatBRL(total)}</>}
        </Button>
        <p className="text-[10px] text-muted-foreground text-center">
          Ao continuar, você concorda com os termos da loja.
        </p>
      </CardContent>
    </Card>
  );
}
