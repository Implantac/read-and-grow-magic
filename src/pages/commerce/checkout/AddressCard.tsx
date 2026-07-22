import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Field } from "./primitives";
import type { CheckoutForm } from "./helpers";

interface Props {
  form: CheckoutForm;
  setForm: (f: CheckoutForm) => void;
}

export function AddressCard({ form, setForm }: Props) {
  return (
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
  );
}
