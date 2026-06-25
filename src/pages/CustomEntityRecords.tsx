import { useMemo, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Database, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/ui/base/button";
import { Card, CardContent } from "@/ui/base/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/base/dialog";
import {
  useCustomEntities, useCustomFields, useCustomRecords, useRecordMutations,
  type CustomRecord,
} from "@/hooks/useCustomEntities";
import { DynamicForm } from "@/components/metadata/DynamicForm";

export default function CustomEntityRecords() {
  const { entityKey } = useParams<{ entityKey: string }>();
  const { data: entities = [], isLoading: loadingEntities } = useCustomEntities();
  const entity = useMemo(() => entities.find((e) => e.entity_key === entityKey), [entities, entityKey]);
  const { data: fields = [] } = useCustomFields(entity?.id);
  const { data: records = [], isLoading: loadingRecords } = useCustomRecords(entity?.id);
  const { create, update, remove } = useRecordMutations(entity?.id);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomRecord | null>(null);

  if (!loadingEntities && !entity) {
    return <Navigate to="/admin/metadata" replace />;
  }

  const visibleFields = fields.filter((f) => f.is_active).slice(0, 5);

  return (
    <PageContainer>
      <PageHeader
        title={entity?.label_plural ?? entity?.label ?? "Registros"}
        description={entity?.description ?? "Registros desta entidade customizada"}
        icon={Database}
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true); }} disabled={fields.length === 0}>
            <Plus className="h-4 w-4 mr-1" /> Novo
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {loadingRecords ? (
            <p className="p-4 text-sm text-muted-foreground">Carregando…</p>
          ) : records.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nenhum registro. Crie o primeiro.</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    {visibleFields.map((f) => (
                      <th key={f.id} className="text-left p-2 font-medium">{f.label}</th>
                    ))}
                    <th className="p-2 w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-t">
                      {visibleFields.map((f) => (
                        <td key={f.id} className="p-2">{formatCell(r.data?.[f.field_key])}</td>
                      ))}
                      <td className="p-2 text-right">
                        <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove.mutate(r.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar registro" : "Novo registro"}</DialogTitle>
          </DialogHeader>
          <DynamicForm
            fields={fields}
            initial={editing?.data}
            submitting={create.isPending || update.isPending}
            onCancel={() => setOpen(false)}
            onSubmit={async (data) => {
              if (editing) {
                await update.mutateAsync({ id: editing.id, data });
              } else {
                await create.mutateAsync(data);
              }
              setOpen(false);
              setEditing(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function formatCell(v: any) {
  if (v === null || v === undefined || v === "") return <span className="text-muted-foreground">—</span>;
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return <code className="text-xs">{JSON.stringify(v)}</code>;
  return String(v);
}
