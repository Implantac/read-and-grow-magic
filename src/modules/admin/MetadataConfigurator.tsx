import { useMemo, useState } from "react";
import { Database, Plus, Trash2, Settings2, FileText, GitBranch } from "lucide-react";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
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
              <p className="text-sm text-muted-foreground">
                Nenhuma entidade. Crie a primeira.
              </p>
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
          <p className="text-sm text-muted-foreground">
            Nenhum campo. Adicione o primeiro.
          </p>
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
