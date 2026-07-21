import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Textarea } from "@/ui/base/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/base/dialog";
import { useEntityMutations } from "@/hooks/useCustomEntities";
import { toKey } from "./utils";

export function NewEntityDialog() {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const { create } = useEntityMutations();

  const submit = async () => {
    if (!label.trim()) return;
    await create.mutateAsync({
      entity_key: toKey(label),
      label: label.trim(),
      label_plural: label.trim(),
      description: description.trim() || undefined,
    });
    setLabel("");
    setDescription("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nova Entidade
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova Entidade</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex.: Coleção, Tecido, Fornecedor Externo" />
            {label && (
              <p className="mt-1 text-xs text-muted-foreground">chave: <code>{toKey(label)}</code></p>
            )}
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={create.isPending}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
