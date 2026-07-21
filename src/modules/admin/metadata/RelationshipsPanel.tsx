import { useState } from "react";
import { Plus, Trash2, GitBranch, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Badge } from "@/ui/base/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/base/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/base/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/base/table";
import { EmptyState } from "@/shared/components/EmptyState";
import { useCustomEntities, useCustomFields, useCustomRelationships, useRelationshipMutations } from "@/hooks/useCustomEntities";
import { RELATIONSHIP_TYPES, INVERSE_TYPE } from "./utils";

export function RelationshipsPanel({ entityId }: { entityId: string }) {
  const { data: entities = [] } = useCustomEntities();
  const { data: rels = [], isLoading } = useCustomRelationships(entityId);
  const { create, update, remove } = useRelationshipMutations(entityId);
  const { data: fromFields = [] } = useCustomFields(entityId);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toEntityId, setToEntityId] = useState<string>("");
  const [relType, setRelType] = useState<string>("one_to_many");
  const [fromField, setFromField] = useState("");
  const [toField, setToField] = useState("");
  const [cascade, setCascade] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: toFields = [] } = useCustomFields(toEntityId || "");

  const otherEntities = entities.filter((e) => e.id !== entityId);
  const entityMap = new Map(entities.map((e) => [e.id, e]));

  const resetForm = () => {
    setEditingId(null);
    setToEntityId("");
    setRelType("one_to_many");
    setFromField("");
    setToField("");
    setCascade(false);
    setError(null);
  };

  const openCreate = () => { resetForm(); setOpen(true); };

  const openEdit = (r: any) => {
    setEditingId(r.id);
    setToEntityId(r.to_entity_id);
    setRelType(r.relationship_type);
    setFromField(r.from_field);
    setToField(r.to_field);
    setCascade(!!r.cascade_delete);
    setError(null);
    setOpen(true);
  };

  const validate = (): string | null => {
    const from = fromField.trim();
    const to = toField.trim();
    if (!toEntityId) return "Selecione a entidade destino.";
    if (!from || !to) return "Os campos origem e destino são obrigatórios.";
    if (toEntityId === entityId) return "A entidade destino deve ser diferente da entidade atual.";
    if (!RELATIONSHIP_TYPES.some((t) => t.value === relType)) return "Tipo de relacionamento inválido.";

    const fromKeys = new Set<string>(["id", ...fromFields.map((f: any) => f.field_key)]);
    const toKeys = new Set<string>(["id", ...toFields.map((f: any) => f.field_key)]);
    if (!fromKeys.has(from)) return `Campo origem "${from}" não existe na entidade atual.`;
    if (toEntityId && toFields.length >= 0 && !toKeys.has(to)) return `Campo destino "${to}" não existe na entidade destino.`;

    if (relType === "many_to_one" && to !== "id") return "Para N:1, o campo destino deve ser a chave única (id) da entidade destino.";
    if (relType === "one_to_many" && from !== "id") return "Para 1:N, o campo origem deve ser a chave única (id) da entidade atual.";

    const duplicate = rels.find((r: any) => {
      if (editingId && r.id === editingId) return false;
      const sameOutgoing =
        r.from_entity_id === entityId && r.to_entity_id === toEntityId &&
        r.relationship_type === relType && r.from_field === from && r.to_field === to;
      const sameInverse =
        r.to_entity_id === entityId && r.from_entity_id === toEntityId &&
        r.relationship_type === INVERSE_TYPE[relType] && r.to_field === from && r.from_field === to;
      return sameOutgoing || sameInverse;
    });
    if (duplicate) return "Já existe um relacionamento equivalente entre estas entidades.";

    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    const payload = {
      to_entity_id: toEntityId,
      relationship_type: relType,
      from_field: fromField.trim(),
      to_field: toField.trim(),
      cascade_delete: cascade,
    };
    if (editingId) {
      await update.mutateAsync({ id: editingId, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    resetForm();
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Relacionamentos</CardTitle>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Novo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Editar" : "Novo"} Relacionamento</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Entidade Destino</Label>
                <Select value={toEntityId} onValueChange={setToEntityId}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {otherEntities.map((e) => (<SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={relType} onValueChange={setRelType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Campo origem</Label>
                  <Input value={fromField} onChange={(e) => setFromField(e.target.value)} placeholder="ex.: cliente_id" />
                </div>
                <div>
                  <Label>Campo destino</Label>
                  <Input value={toField} onChange={(e) => setToField(e.target.value)} placeholder="ex.: id" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={cascade} onChange={(e) => setCascade(e.target.checked)} />
                Excluir em cascata
              </label>
              {error && (<p className="text-sm text-destructive" role="alert">{error}</p>)}
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={create.isPending || update.isPending}>
                {editingId ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : rels.length === 0 ? (
          <EmptyState icon={GitBranch} title="Nenhum relacionamento definido" description="Crie relacionamentos entre entidades para modelar seu domínio." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Direção</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Campos</TableHead>
                <TableHead>Cascata</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rels.map((r) => {
                const isOutgoing = r.from_entity_id === entityId;
                const other = entityMap.get(isOutgoing ? r.to_entity_id : r.from_entity_id);
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Badge variant={isOutgoing ? "default" : "outline"}>
                        {isOutgoing ? "→ saída" : "← entrada"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{other?.label ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{r.relationship_type}</Badge></TableCell>
                    <TableCell className="text-xs">
                      <code>{r.from_field}</code> → <code>{r.to_field}</code>
                    </TableCell>
                    <TableCell>{r.cascade_delete ? "Sim" : "Não"}</TableCell>
                    <TableCell>
                      {isOutgoing && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => remove.mutate(r.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
