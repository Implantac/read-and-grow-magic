import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/ui/base/sheet";
import { Button } from "@/ui/base/button";
import { Separator } from "@/ui/base/separator";
import { EmptyState } from "@/shared/components/EmptyState";
import { formatBRL } from "@/lib/formatters";
import { useStorefrontCart } from "@/hooks/useStorefrontCart";
import type { PublicStorefront } from "@/hooks/useStorefrontSearch";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  storefront: PublicStorefront;
}

export function CartDrawer({ open, onOpenChange, storefront }: Props) {
  const navigate = useNavigate();
  const { lines, updateQty, removeItem, subtotal, totalItems } = useStorefrontCart(
    storefront.slug,
  );

  function goCheckout() {
    onOpenChange(false);
    navigate(`/loja/${storefront.slug}/checkout`, {
      state: {
        items: lines.map((l) => ({
          product_id: l.product_id,
          product_name: l.product_name,
          product_sku: l.product_sku,
          quantity: l.quantity,
          unit_price: l.unit_price,
        })),
      },
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            Seu carrinho {totalItems > 0 ? `(${totalItems})` : ""}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {lines.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Carrinho vazio"
              description="Adicione produtos para continuar."
            />
          ) : (
            <div className="space-y-3">
              {lines.map((line) => (
                <div
                  key={line.storefront_product_id}
                  className="flex gap-3 rounded-lg border p-3"
                >
                  {line.image_url ? (
                    <img
                      src={line.image_url}
                      alt={line.product_name}
                      className="h-16 w-16 rounded object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded bg-muted" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {line.product_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatBRL(line.unit_price)}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          updateQty(line.storefront_product_id, line.quantity - 1)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-6 text-center">
                        {line.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          updateQty(line.storefront_product_id, line.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 ml-auto text-destructive"
                        onClick={() => removeItem(line.storefront_product_id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm font-semibold whitespace-nowrap">
                    {formatBRL(line.unit_price * line.quantity)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {lines.length > 0 && (
          <SheetFooter className="flex-col sm:flex-col gap-2">
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatBRL(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Frete e impostos calculados no checkout.
            </p>
            <Button
              className="w-full"
              size="lg"
              onClick={goCheckout}
              style={{
                backgroundColor: storefront.primary_color,
                color: "white",
              }}
            >
              Finalizar compra · {formatBRL(subtotal)}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
