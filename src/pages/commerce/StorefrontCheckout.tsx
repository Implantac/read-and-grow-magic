import { useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ShoppingBag, Store as StoreIcon, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Textarea } from "@/ui/base/textarea";
import { Badge } from "@/ui/base/badge";
import { Skeleton } from "@/ui/base/skeleton";
import { EmptyState } from "@/shared/components/EmptyState";
import {
  useStorefrontBySlug,
  useCreateStorefrontOrder,
  type CheckoutItem,
  type StorefrontOrder,
} from "@/hooks/useCommerceCheckout";
import { useStorefrontCart } from "@/hooks/useStorefrontCart";
import {
  detectBrand,
  emptyCheckoutForm,
  type PaymentMethod,
} from "./checkout/helpers";
import { CustomerCard } from "./checkout/CustomerCard";
import { AddressCard } from "./checkout/AddressCard";
import { PaymentCard } from "./checkout/PaymentCard";
import { OrderSummary } from "./checkout/OrderSummary";
import { OrderConfirmation } from "./checkout/OrderConfirmation";

interface LocationCartState {
  items?: CheckoutItem[];
  shipping?: number;
}

const DEMO_ITEMS: CheckoutItem[] = [
  { product_name: "Camiseta Premium Use", product_sku: "CAM-001", quantity: 1, unit_price: 89.9 },
];

export default function StorefrontCheckout() {
  const { slug = "" } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const cart = useStorefrontCart(slug);
  const cartState = (location.state ?? null) as LocationCartState | null;
  const cartItemsFromStore: CheckoutItem[] = cart.lines.map((l) => ({
    product_id: l.product_id,
    product_name: l.product_name,
    product_sku: l.product_sku ?? undefined,
    quantity: l.quantity,
    unit_price: l.unit_price,
  }));
  const initialItems = cartState?.items?.length
    ? cartState.items
    : cartItemsFromStore.length > 0
      ? cartItemsFromStore
      : DEMO_ITEMS;
  const shipping = cartState?.shipping ?? 15;

  const { data: storefront, isLoading, error } = useStorefrontBySlug(slug);
  const createOrder = useCreateStorefrontOrder();

  const [items] = useState<CheckoutItem[]>(initialItems);
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [placedOrder, setPlacedOrder] = useState<StorefrontOrder | null>(null);
  const [form, setForm] = useState(emptyCheckoutForm);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.quantity * i.unit_price, 0),
    [items],
  );
  const total = subtotal + shipping;

  const canSubmit = Boolean(
    form.name.trim() &&
    form.email.trim() &&
    form.zip.trim() &&
    form.street.trim() &&
    form.number.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    (payment !== "credit_card" ||
      (form.cardNumber.replace(/\s/g, "").length >= 13 &&
        form.cardName.trim() &&
        form.cardExpiry.trim() &&
        form.cardCvv.trim()))
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !storefront) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <EmptyState
          icon={StoreIcon}
          title="Loja indisponível"
          description="Esta loja não existe ou ainda não está publicada."
        />
      </div>
    );
  }

  async function handleSubmit() {
    if (!storefront || !canSubmit) return;
    const clean = form.cardNumber.replace(/\s/g, "");
    try {
      const order = await createOrder.mutateAsync({
        storefront_id: storefront.id,
        company_id: storefront.company_id,
        customer_name: form.name.trim(),
        customer_email: form.email.trim(),
        customer_phone: form.phone.trim() || undefined,
        customer_document: form.document.trim() || undefined,
        shipping_address: {
          zip: form.zip,
          street: form.street,
          number: form.number,
          complement: form.complement,
          neighborhood: form.neighborhood,
          city: form.city,
          state: form.state,
        },
        payment_method: payment,
        items,
        shipping,
        notes: form.notes.trim() || undefined,
        card_last4: payment === "credit_card" ? clean.slice(-4) : undefined,
        card_brand: payment === "credit_card" ? detectBrand(clean) : undefined,
      });
      setPlacedOrder(order);
      cart.clear();
    } catch {
      // toast handled by mutation
    }
  }

  if (placedOrder) {
    return (
      <OrderConfirmation
        order={placedOrder}
        storeName={storefront.name}
        onNew={() => {
          setPlacedOrder(null);
          navigate(`/loja/${slug}`);
        }}
      />
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: `linear-gradient(180deg, ${storefront.primary_color}10, transparent 300px)` }}
    >
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{storefront.name}</h1>
            <p className="text-xs text-muted-foreground">Checkout seguro</p>
          </div>
          <Badge variant="outline" className="ml-auto">
            <ShoppingBag className="h-3 w-3 mr-1" />
            {items.length} {items.length === 1 ? "item" : "itens"}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <CustomerCard form={form} setForm={setForm} />
            <AddressCard form={form} setForm={setForm} />
            <PaymentCard form={form} setForm={setForm} payment={payment} setPayment={setPayment} />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Instruções especiais para entrega, referências, etc."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              shipping={shipping}
              total={total}
              primaryColor={storefront.primary_color}
              canSubmit={canSubmit}
              isPending={createOrder.isPending}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
