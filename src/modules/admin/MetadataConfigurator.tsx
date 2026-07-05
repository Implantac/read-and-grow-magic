import { useMemo, useState } from "react";
import { Database, Plus, Trash2, Settings2, FileText, GitBranch, Pencil } from "lucide-react";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { EmptyState } from "@/shared/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Textarea } from "@/ui/base/textarea";
import { Badge } from "@/ui/base/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/ui/base/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/base/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/base/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/base/table";
import {
  useCustomEntities,
  useCustomFields,
  useCustomRecords,
  useCustomRelationships,
  useEntityMutations,
  useFieldMutations,
  useRecordMutations,
  useRelationshipMutations,
  type CustomField,
} from "@/hooks/useCustomEntities";

const FIELD_TYPES = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "boolean", label: "Sim/Não" },
  { value: "date", label: "Data" },
  { value: "datetime", label: "Data/Hora" },
  { value: "select", label: "Lista (Seleção)" },
  { value: "json", label: "JSON" },
];

function toKey(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function MetadataConfigurator() {
  const { data: entities = [], isLoading } = useCustomEntities();
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const selectedEntity = useMemo(
    () => entities.find((e) => e.id === selectedId),
    [entities, selectedId]
  );

  return (
    <PageContainer>
      <PageHeader
        title="Metadata Engine"
        description="Crie entidades e campos personalizados sem código para adaptar o ERP ao seu segmento."
        icon={Database}
        actions={<NewEntityDialog />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {isLoading && (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            )}
            {!isLoading && entities.length === 0 && (
              <EmptyState
                icon={Database}
                title="Nenhuma entidade"
                description="Crie a primeira entidade personalizada para começar."
              />
            )}
            {entities.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedId(e.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                  selectedId === e.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                <div className="font-medium">{e.label}</div>
                <div className="text-xs text-muted-foreground">
                  {e.entity_key}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div>
          {selectedEntity ? (
            <Tabs defaultValue="fields">
              <TabsList>
                <TabsTrigger value="fields">
                  <Settings2 className="mr-2 h-4 w-4" /> Campos
                </TabsTrigger>
                <TabsTrigger value="relationships">
                  <GitBranch className="mr-2 h-4 w-4" /> Relacionamentos
                </TabsTrigger>
                <TabsTrigger value="records">
                  <FileText className="mr-2 h-4 w-4" /> Registros
                </TabsTrigger>
              </TabsList>
              <TabsContent value="fields">
                <FieldsPanel entityId={selectedEntity.id} />
              </TabsContent>
              <TabsContent value="relationships">
                <RelationshipsPanel entityId={selectedEntity.id} />
              </TabsContent>
              <TabsContent value="records">
                <RecordsPanel entityId={selectedEntity.id} />
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Selecione ou crie uma entidade.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

function NewEntityDialog() {
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
        <DialogHeader>
          <DialogTitle>Nova Entidade</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex.: Coleção, Tecido, Fornecedor Externo"
            />
            {label && (
              <p className="mt-1 text-xs text-muted-foreground">
                chave: <code>{toKey(label)}</code>
              </p>
            )}
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={create.isPending}>
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldsPanel({ entityId }: { entityId: string }) {
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
          <EmptyState
            icon={Settings2}
            title="Nenhum campo"
            description="Adicione o primeiro campo para esta entidade."
          />
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
                  <TableCell>
                    <code className="text-xs">{f.field_key}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{f.field_type}</Badge>
                  </TableCell>
                  <TableCell>{f.is_required ? "Sim" : "Não"}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove.mutate(f.id)}
                    >
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

function NewFieldDialog({
  entityId,
  nextOrder,
}: {
  entityId: string;
  nextOrder: number;
}) {
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
        ? optionsText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((v) => ({ value: toKey(v), label: v }))
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
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Adicionar Campo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Campo</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Rótulo</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {type === "select" && (
            <div>
              <Label>Opções (uma por linha)</Label>
              <Textarea
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                rows={4}
              />
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
            />
            Obrigatório
          </label>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={create.isPending}>
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RecordsPanel({ entityId }: { entityId: string }) {
  const { data: fields = [] } = useCustomFields(entityId);
  const { data: records = [] } = useCustomRecords(entityId);
  const { create, remove } = useRecordMutations(entityId);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, any>>({});

  const submit = async () => {
    await create.mutateAsync(values);
    setValues({});
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Registros</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={fields.length === 0}>
              <Plus className="mr-2 h-4 w-4" /> Novo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Registro</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {fields.map((f) => (
                <FieldInput
                  key={f.id}
                  field={f}
                  value={values[f.field_key]}
                  onChange={(v) =>
                    setValues((s) => ({ ...s, [f.field_key]: v }))
                  }
                />
              ))}
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={create.isPending}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Adicione campos antes de criar registros.
          </p>
        ) : records.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum registro.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {fields.map((f) => (
                  <TableHead key={f.id}>{f.label}</TableHead>
                ))}
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  {fields.map((f) => (
                    <TableCell key={f.id}>
                      {formatValue(r.data?.[f.field_key], f.field_type)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove.mutate(r.id)}
                    >
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

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: CustomField;
  value: any;
  onChange: (v: any) => void;
}) {
  return (
    <div>
      <Label>
        {field.label}
        {field.is_required && <span className="text-destructive"> *</span>}
      </Label>
      {field.field_type === "boolean" ? (
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="ml-2"
        />
      ) : field.field_type === "select" ? (
        <Select value={value ?? ""} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {(Array.isArray(field.options) ? field.options : []).map(
              (opt: any) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      ) : field.field_type === "json" ? (
        <Textarea
          value={typeof value === "string" ? value : JSON.stringify(value ?? "", null, 2)}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              onChange(e.target.value);
            }
          }}
          rows={4}
        />
      ) : (
        <Input
          type={
            field.field_type === "number"
              ? "number"
              : field.field_type === "date"
              ? "date"
              : field.field_type === "datetime"
              ? "datetime-local"
              : "text"
          }
          value={value ?? ""}
          onChange={(e) =>
            onChange(
              field.field_type === "number"
                ? e.target.valueAsNumber
                : e.target.value
            )
          }
        />
      )}
      {field.help_text && (
        <p className="mt-1 text-xs text-muted-foreground">{field.help_text}</p>
      )}
    </div>
  );
}

function formatValue(v: any, type: string): string {
  if (v === null || v === undefined || v === "") return "—";
  if (type === "boolean") return v ? "Sim" : "Não";
  if (type === "json") return JSON.stringify(v);
  return String(v);
}

const RELATIONSHIP_TYPES = [
  { value: "one_to_many", label: "1:N (Um para Muitos)" },
  { value: "many_to_one", label: "N:1 (Muitos para Um)" },
  { value: "many_to_many", label: "N:N (Muitos para Muitos)" },
];

const INVERSE_TYPE: Record<string, string> = {
  one_to_many: "many_to_one",
  many_to_one: "one_to_many",
  many_to_many: "many_to_many",
};

function RelationshipsPanel({ entityId }: { entityId: string }) {
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

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

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
    if (!RELATIONSHIP_TYPES.some((t) => t.value === relType))
      return "Tipo de relacionamento inválido.";

    const fromKeys = new Set<string>(["id", ...fromFields.map((f: any) => f.field_key)]);
    const toKeys = new Set<string>(["id", ...toFields.map((f: any) => f.field_key)]);
    if (!fromKeys.has(from))
      return `Campo origem "${from}" não existe na entidade atual.`;
    if (toEntityId && toFields.length >= 0 && !toKeys.has(to))
      return `Campo destino "${to}" não existe na entidade destino.`;

    // Cardinality compatibility: the "one" side must reference a unique key (we require "id").
    if (relType === "many_to_one" && to !== "id")
      return "Para N:1, o campo destino deve ser a chave única (id) da entidade destino.";
    if (relType === "one_to_many" && from !== "id")
      return "Para 1:N, o campo origem deve ser a chave única (id) da entidade atual.";

    // Duplicate / inverse-duplicate detection.
    const duplicate = rels.find((r: any) => {
      if (editingId && r.id === editingId) return false;
      const sameOutgoing =
        r.from_entity_id === entityId &&
        r.to_entity_id === toEntityId &&
        r.relationship_type === relType &&
        r.from_field === from &&
        r.to_field === to;
      const sameInverse =
        r.to_entity_id === entityId &&
        r.from_entity_id === toEntityId &&
        r.relationship_type === INVERSE_TYPE[relType] &&
        r.to_field === from &&
        r.from_field === to;
      return sameOutgoing || sameInverse;
    });
    if (duplicate) return "Já existe um relacionamento equivalente entre estas entidades.";

    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
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
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Novo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar" : "Novo"} Relacionamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Entidade Destino</Label>
                <Select value={toEntityId} onValueChange={setToEntityId}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {otherEntities.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={relType} onValueChange={setRelType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
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
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
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
          <p className="text-sm text-muted-foreground">Nenhum relacionamento definido.</p>
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

