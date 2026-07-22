import { CreditCard, QrCode, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { RadioGroup } from "@/ui/base/radio-group";
import { Field, PaymentOption } from "./primitives";
import { formatCardNumber, type CheckoutForm, type PaymentMethod } from "./helpers";

interface Props {
  form: CheckoutForm;
  setForm: (f: CheckoutForm) => void;
  payment: PaymentMethod;
  setPayment: (p: PaymentMethod) => void;
}

export function PaymentCard({ form, setForm, payment, setPayment }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Forma de pagamento</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={payment}
          onValueChange={(v) => setPayment(v as PaymentMethod)}
          className="grid gap-2 md:grid-cols-3"
        >
          <PaymentOption value="pix" icon={<QrCode className="h-5 w-5" />} label="PIX" hint="Aprovação imediata" selected={payment === "pix"} />
          <PaymentOption value="credit_card" icon={<CreditCard className="h-5 w-5" />} label="Cartão de Crédito" hint="Até 12x" selected={payment === "credit_card"} />
          <PaymentOption value="boleto" icon={<FileText className="h-5 w-5" />} label="Boleto" hint="1-2 dias úteis" selected={payment === "boleto"} />
        </RadioGroup>

        {payment === "credit_card" && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field
                label="Número do cartão *"
                value={form.cardNumber}
                onChange={(v) => setForm({ ...form, cardNumber: formatCardNumber(v) })}
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
  );
}
