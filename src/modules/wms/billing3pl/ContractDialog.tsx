import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/ui/base/dialog";
import { Contract } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: Partial<Contract>;
  setForm: (f: Partial<Contract>) => void;
  onSave: () => void;
}

const FIELDS: Array<[keyof Contract, string]> = [
  ["storage_rate_per_pallet_day", "Armazenagem (R$/pallet/dia)"],
  ["inbound_rate_per_unit", "Entrada (R$/unidade)"],
  ["outbound_rate_per_unit", "Saída (R$/unidade)"],
  ["picking_rate_per_line", "Picking (R$/linha)"],
  ["packing_rate_per_order", "Packing (R$/pedido)"],
  ["minimum_monthly_fee", "Mínimo mensal (R$)"],
];

export function ContractDialog({ open, onOpenChange, form, setForm, onSave }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo contrato 3PL</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Cliente</Label>
            <Input
              value={form.client_name || ""}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
            />
          </div>
          {FIELDS.map(([key, label]) => (
            <div key={key}>
              <Label>{label}</Label>
              <Input
                type="number"
                step="0.0001"
                value={(form as Record<string, unknown>)[key] as number}
                onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
