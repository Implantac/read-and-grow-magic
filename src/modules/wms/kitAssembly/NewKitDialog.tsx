import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/base/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/base/select";
import { Plus, Trash2 } from "lucide-react";
import { toastError, toastSuccess } from "@/lib/toastHelpers";
import type { ComponentDraft, Product } from "./types";

interface Props {
  products: Product[];
  onCreated: () => void;
}

export function NewKitDialog({ products, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [components, setComponents] = useState<ComponentDraft[]>([]);

  function reset() {
    setCode("");
    setName("");
    setParentId("");
    setComponents([]);
  }

  async function createKit() {
    if (!code || !name || !parentId || components.length === 0) {
      toastError("Preencha código, nome, SKU pai e ao menos 1 componente.");
      return;
    }
    const { data: companyId } = await supabase.rpc("get_user_company_id", {
      _user_id: (await supabase.auth.getUser()).data.user?.id,
    });
    if (!companyId) {
      toastError("Empresa não identificada.");
      return;
    }
    const { data: kit, error } = await supabase
      .from("wms_kits")
      .insert({ code, name, parent_product_id: parentId, company_id: companyId })
      .select()
      .single();
    if (error || !kit) {
      toastError(`Falha ao criar kit: ${error?.message ?? ""}`);
      return;
    }
    const { error: cerr } = await supabase.from("wms_kit_components").insert(
      components.map((c) => ({
        kit_id: kit.id,
        company_id: companyId,
        component_product_id: c.product_id,
        quantity: c.quantity,
      })),
    );
    if (cerr) {
      toastError(`Componentes: ${cerr.message}`);
      return;
    }
    toastSuccess("Kit cadastrado.");
    setOpen(false);
    reset();
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : (setOpen(false), reset()))}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Novo Kit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cadastrar Kit</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Código</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="KIT-001" />
            </div>
            <div>
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kit Promocional" />
            </div>
          </div>
          <div>
            <Label>SKU Pai</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o produto pai" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Componentes</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setComponents((c) => [...c, { product_id: "", quantity: 1 }])}
              >
                <Plus className="h-3 w-3" /> Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {components.map((c, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Select
                    value={c.product_id}
                    onValueChange={(v) =>
                      setComponents((arr) => arr.map((it, i) => (i === idx ? { ...it, product_id: v } : it)))
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Componente" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.code} — {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    className="w-24"
                    value={c.quantity}
                    onChange={(e) =>
                      setComponents((arr) =>
                        arr.map((it, i) => (i === idx ? { ...it, quantity: Number(e.target.value) } : it)),
                      )
                    }
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setComponents((arr) => arr.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {components.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum componente adicionado.</p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={createKit}>Salvar Kit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
