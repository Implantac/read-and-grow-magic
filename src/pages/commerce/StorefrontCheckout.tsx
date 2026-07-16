import { useMemo, useState } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import {
  ShoppingBag,
  CreditCard,
  QrCode,
  FileText,
  CheckCircle2,
  Copy,
  Loader2,
  Store as StoreIcon,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Textarea } from "@/ui/base/textarea";
import { Separator } from "@/ui/base/separator";
import { Badge } from "@/ui/base/badge";
import { RadioGroup, RadioGroupItem } from "@/ui/base/radio-group";
import { Skeleton } from "@/ui/base/skeleton";
import { EmptyState } from "@/shared/components/EmptyState";
import { formatBRL } from "@/lib/formatters";
import { toast } from "@/ui/base/use-toast";
import {
  useStorefrontBySlug,
  useCreateStorefrontOrder,
  type CheckoutItem,
  type StorefrontOrder,
} from "@/hooks/useCommerceCheckout";

interface LocationCartState {
  items?: CheckoutItem[];
  shipping?: number;
}

const DEMO_ITEMS: CheckoutItem[] = [
  {
    product_name: "Camiseta Premium Use",
    product_sku: "CAM-001",
    quantity: 1,
    unit_price: 89.9,
  },
];

export default function StorefrontCheckout() {
  const { slug = "" } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const cartState = (location.state ?? null) as LocationCartState | null;
  const initialItems = cartState?.items?.length ? cartState.items : DEMO_ITEMS;
  const shipping = cartState?.shipping ?? 15;

  const { data: storefront, isLoading, error } = useStorefrontBySlug(slug);
  const createOrder = useCreateStorefrontOrder();

  const [items] = useState<CheckoutItem[]>(initialItems);
  const [payment, setPayment] = useState<"credit_card" | "pix" | "boleto">(
    "pix",
  );
  const [placedOrder, setPlacedOrder] = useState<StorefrontOrder | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
    zip: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    notes: "",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvv: "",
  });

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.quantity * i.unit_price, 0),
    [items],
  );
  const total = subtotal + shipping;

  const canSubmit =
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
        form.cardCvv.trim()));

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
      style={{
        background: `linear-gradient(180deg, ${storefront.primary_color}10, transparent 300px)`,
      }}
    >
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-1"
          >
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
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dados do cliente</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <Field label="Nome completo *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <Field label="E-mail *" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <Field label="Telefone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                <Field label="CPF/CNPJ" value={form.document} onChange={(v) => setForm({ ...form, document: v })} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Endereço de entrega</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <Field label="CEP *" value={form.zip} onChange={(v) => setForm({ ...form, zip: v })} />
                <div className="md:col-span-2">
                  <Field label="Rua *" value={form.street} onChange={(v) => setForm({ ...form, street: v })} />
                </div>
                <Field label="Número *" value={form.number} onChange={(v) => setForm({ ...form, number: v })} />
                <Field label="Complemento" value={form.complement} onChange={(v) => setForm({ ...form, complement: v })} />
                <Field label="Bairro" value={form.neighborhood} onChange={(v) => setForm({ ...form, neighborhood: v })} />
                <div className="md:col-span-2">
                  <Field label="Cidade *" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                </div>
                <Field label="UF *" value={form.state} onChange={(v) => setForm({ ...form, state: v.toUpperCase().slice(0, 2) })} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Forma de pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={payment}
                  onValueChange={(v) => setPayment(v as typeof payment)}
                  className="grid gap-2 md:grid-cols-3"
                >
                  <PaymentOption
                    value="pix"
                    icon={<QrCode className="h-5 w-5" />}
                    label="PIX"
                    hint="Aprovação imediata"
                    selected={payment === "pix"}
                  />
                  <PaymentOption
                    value="credit_card"
                    icon={<CreditCard className="h-5 w-5" />}
                    label="Cartão de Crédito"
                    hint="Até 12x"
                    selected={payment === "credit_card"}
                  />
                  <PaymentOption
                    value="boleto"
                    icon={<FileText className="h-5 w-5" />}
                    label="Boleto"
                    hint="1-2 dias úteis"
                    selected={payment === "boleto"}
                  />
                </RadioGroup>

                {payment === "credit_card" && (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Field
                        label="Número do cartão *"
                        value={form.cardNumber}
                        onChange={(v) =>
                          setForm({ ...form, cardNumber: formatCardNumber(v) })
                        }
                        placeholder="0000 0000 0000 0000"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Field label="Nome impresso no cartão *" value={form.cardName} onChange={(v) => setForm({ ...form, cardName: v })} />
                    </div>
                    <Field label="Validade (MM/AA) *" value={form.cardExpiry} onChange={(v) => setForm({ ...form, cardExpiry: v })} placeholder="12/28" />
                    <Field label="CVV *" value={form.cardCvv} onChange={(v) => setForm({ ...form, cardCvv: v.replace(/\D/g, "").slice(0, 4) })} />
                  </div>
                )}

                {payment === "pix" && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Após finalizar, você receberá o QR Code e o código copia-e-cola para pagamento imediato.
                  </p>
                )}
                {payment === "boleto" && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    O boleto será gerado e enviado ao seu e-mail. O pedido será confirmado após a compensação.
                  </p>
                )}
              </CardContent>
            </Card>

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
                  <span style={{ color: storefront.primary_color }}>
                    {formatBRL(total)}
                  </span>
                </div>
                <Button
                  className="w-full mt-2"
                  size="lg"
                  disabled={!canSubmit || createOrder.isPending}
                  onClick={handleSubmit}
                  style={{
                    backgroundColor: storefront.primary_color,
                    color: "white",
                  }}
                >
                  {createOrder.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>Finalizar compra · {formatBRL(total)}</>
                  )}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center">
                  Ao continuar, você concorda com os termos da loja.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function PaymentOption({
  value,
  icon,
  label,
  hint,
  selected,
}: {
  value: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
  selected: boolean;
}) {
  return (
    <Label
      htmlFor={`pay-${value}`}
      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-muted hover:border-primary/40"
      }`}
    >
      <RadioGroupItem id={`pay-${value}`} value={value} />
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {label}
        </div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </Label>
  );
}

function OrderConfirmation({
  order,
  storeName,
  onNew,
}: {
  order: StorefrontOrder;
  storeName: string;
  onNew: () => void;
}) {
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
                <p className="text-sm font-medium mb-2">
                  Pague com PIX para confirmar
                </p>
                <img
                  src={order.pix_qr_code}
                  alt="QR Code PIX"
                  className="mx-auto h-56 w-56 rounded"
                />
                <p className="text-xs text-muted-foreground mt-3">
                  Ou copie o código abaixo:
                </p>
                <div className="mt-2 flex gap-2">
                  <Input
                    readOnly
                    value={order.pix_copy_paste ?? ""}
                    className="text-xs font-mono"
                  />
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="h-4 w-4 mr-1" />
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Expira em 30 minutos. Após o pagamento, o pedido é confirmado
                  automaticamente.
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
                <p className="text-sm font-medium">
                  Boleto enviado por e-mail
                </p>
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

function formatCardNumber(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function detectBrand(num: string): string {
  if (/^4/.test(num)) return "Visa";
  if (/^5[1-5]/.test(num)) return "Mastercard";
  if (/^3[47]/.test(num)) return "Amex";
  if (/^6(?:011|5)/.test(num)) return "Discover";
  if (/^(4011|4312|4389|5041|6277|6362|6363|6504|6505|6516)/.test(num))
    return "Elo";
  return "Cartão";
}
