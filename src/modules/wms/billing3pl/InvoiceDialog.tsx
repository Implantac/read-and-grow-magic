import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/ui/base/dialog";
import { Contract } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selected: Contract | null;
  period: { start: string; end: string };
  setPeriod: (p: { start: string; end: string }) => void;
  onGenerate: () => void;
}

export function InvoiceDialog({ open, onOpenChange, selected, period, setPeriod, onGenerate }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar fatura — {selected?.client_name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Início do período</Label>
            <Input type="date" value={period.start} onChange={(e) => setPeriod({ ...period, start: e.target.value })} />
          </div>
          <div>
            <Label>Fim do período</Label>
            <Input type="date" value={period.end} onChange={(e) => setPeriod({ ...period, end: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onGenerate}>Gerar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
