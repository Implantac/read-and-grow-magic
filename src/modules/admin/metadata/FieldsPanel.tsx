import { useState } from "react";
import { Plus, Trash2, Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Textarea } from "@/ui/base/textarea";
import { Badge } from "@/ui/base/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/base/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/base/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/base/table";
import { EmptyState } from "@/shared/components/EmptyState";
import { useCustomFields, useFieldMutations } from "@/hooks/useCustomEntities";
import { FIELD_TYPES, toKey } from "./utils";

export function FieldsPanel({ entityId }: { entityId: string }) {
  const { data: fields = [] } = useCustomFields(entityId);
  const { remove } = useFieldMutations(entityId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Campos</CardTitle>
        <NewFieldDialog entityId={entityId} nextOrder={fields.length} />
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <EmptyState icon={Settings2} title="Nenhum campo" description="Adicione o primeiro campo para esta entidade." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rótulo</TableHead>
                <TableHead>Chave</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Obrigatório</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.label}</TableCell>
                  <TableCell><code className="text-xs">{f.field_key}</code></TableCell>
                  <TableCell><Badge variant="outline">{f.field_type}</Badge></TableCell>
                  <TableCell>{f.is_required ? "Sim" : "Não"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate(f.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function NewFieldDialog({ entityId, nextOrder }: { entityId: string; nextOrder: number }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [type, setType] = useState("text");
  const [required, setRequired] = useState(false);
  const [optionsText, setOptionsText] = useState("");
  const { create } = useFieldMutations(entityId);

  const submit = async () => {
    if (!label.trim()) return;
    const options =
      type === "select"
        ? optionsText.split("\n").map((s) => s.trim()).filter(Boolean).map((v) => ({ value: toKey(v), label: v }))
        : null;
    await create.mutateAsync({
      field_key: toKey(label),
      label: label.trim(),
      field_type: type,
      is_required: required,
      options,
      display_order: nextOrder,
    });
    setLabel("");
    setType("text");
    setRequired(false);
    setOptionsText("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Adicionar Campo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Campo</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Rótulo</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {type === "select" && (
            <div>
              <Label>Opções (uma por linha)</Label>
              <Textarea value={optionsText} onChange={(e) => setOptionsText(e.target.value)} rows={4} />
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
            Obrigatório
          </label>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={create.isPending}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
