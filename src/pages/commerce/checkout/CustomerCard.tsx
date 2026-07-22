import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Field } from "./primitives";
import type { CheckoutForm } from "./helpers";

interface Props {
  form: CheckoutForm;
  setForm: (f: CheckoutForm) => void;
}

export function CustomerCard({ form, setForm }: Props) {
  return (
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
  );
}
