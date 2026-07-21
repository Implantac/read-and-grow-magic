import { useState } from "react";
import { Plus, Trash2, Settings2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Textarea } from "@/ui/base/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/base/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/base/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/base/table";
import { EmptyState } from "@/shared/components/EmptyState";
import { useCustomFields, useCustomRecords, useRecordMutations, type CustomField } from "@/hooks/useCustomEntities";
import { formatValue } from "./utils";

export function RecordsPanel({ entityId }: { entityId: string }) {
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
            <DialogHeader><DialogTitle>Novo Registro</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {fields.map((f) => (
                <FieldInput
                  key={f.id}
                  field={f}
                  value={values[f.field_key]}
                  onChange={(v) => setValues((s) => ({ ...s, [f.field_key]: v }))}
                />
              ))}
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={create.isPending}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <EmptyState icon={Settings2} title="Configure os campos primeiro" description="Adicione campos à entidade antes de criar registros." />
        ) : records.length === 0 ? (
          <EmptyState icon={FileText} title="Nenhum registro" description="Nenhum registro criado para esta entidade ainda." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {fields.map((f) => (<TableHead key={f.id}>{f.label}</TableHead>))}
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  {fields.map((f) => (
                    <TableCell key={f.id}>{formatValue(r.data?.[f.field_key], f.field_type)}</TableCell>
                  ))}
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate(r.id)}>
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

function FieldInput({ field, value, onChange }: { field: CustomField; value: any; onChange: (v: any) => void }) {
  return (
    <div>
      <Label>
        {field.label}
        {field.is_required && <span className="text-destructive"> *</span>}
      </Label>
      {field.field_type === "boolean" ? (
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="ml-2" />
      ) : field.field_type === "select" ? (
        <Select value={value ?? ""} onValueChange={onChange}>
          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
          <SelectContent>
            {(Array.isArray(field.options) ? field.options : []).map((opt: any) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.field_type === "json" ? (
        <Textarea
          value={typeof value === "string" ? value : JSON.stringify(value ?? "", null, 2)}
          onChange={(e) => {
            try { onChange(JSON.parse(e.target.value)); } catch { onChange(e.target.value); }
          }}
          rows={4}
        />
      ) : (
        <Input
          type={
            field.field_type === "number" ? "number"
              : field.field_type === "date" ? "date"
              : field.field_type === "datetime" ? "datetime-local"
              : "text"
          }
          value={value ?? ""}
          onChange={(e) => onChange(field.field_type === "number" ? e.target.valueAsNumber : e.target.value)}
        />
      )}
      {field.help_text && (<p className="mt-1 text-xs text-muted-foreground">{field.help_text}</p>)}
    </div>
  );
}
