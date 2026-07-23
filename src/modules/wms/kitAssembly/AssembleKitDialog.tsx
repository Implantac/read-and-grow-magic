import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/ui/base/dialog";
import { toastError, toastSuccess } from "@/lib/toastHelpers";
import type { KitRow } from "./types";

interface Props {
  kit: KitRow | null;
  onClose: () => void;
  onDone: () => void;
}

export function AssembleKitDialog({ kit, onClose, onDone }: Props) {
  const [qty, setQty] = useState<number>(1);

  async function assemble() {
    if (!kit) return;
    if (qty <= 0) {
      toastError("Quantidade inválida.");
      return;
    }
    const { error } = await supabase.rpc("wms_assemble_kit", {
      p_kit_id: kit.id,
      p_quantity: qty,
    });
    if (error) {
      toastError(`Falha na montagem: ${error.message}`);
      return;
    }
    toastSuccess(`${qty}x ${kit.code} montado.`);
    setQty(1);
    onDone();
  }

  return (
    <Dialog open={!!kit} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Montar Kit — {kit?.code}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Será consumida a BOM × quantidade abaixo e gerado o SKU pai no estoque.
          </p>
          <div>
            <Label>Quantidade a montar</Label>
            <Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </div>
          <div className="rounded border p-3 bg-muted/30 space-y-1">
            <p className="text-xs font-medium">Consumo previsto:</p>
            {(kit?.components ?? []).map((c) => (
              <div key={c.id} className="text-xs flex justify-between">
                <span>
                  {c.product?.code ?? "?"} — {c.product?.name ?? ""}
                </span>
                <span className="font-mono">{c.quantity * qty}</span>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={assemble}>Confirmar Montagem</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
