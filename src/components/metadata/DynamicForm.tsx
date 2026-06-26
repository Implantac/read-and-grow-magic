import { useState, useEffect } from "react";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Textarea } from "@/ui/base/textarea";
import { Switch } from "@/ui/base/switch";
import { Button } from "@/ui/base/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/base/select";
import { parseNumericInput } from "@/lib/numericValidation";
import type { CustomField } from "@/hooks/useCustomEntities";

interface Props {
  fields: CustomField[];
  initial?: Record<string, any>;
  submitting?: boolean;
  onSubmit: (data: Record<string, any>) => void;
  onCancel?: () => void;
}

export function DynamicForm({ fields, initial, submitting, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<Record<string, any>>(initial ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => setValues(initial ?? {}), [initial]);

  function set(key: string, v: any) {
    setValues((s) => ({ ...s, [key]: v }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    for (const f of fields) {
      const v = values[f.field_key];
      if (f.is_required && (v === undefined || v === null || v === "")) {
        next[f.field_key] = "Campo obrigatório";
      }
      if (f.field_type === "number" && v !== "" && v !== undefined && v !== null && isNaN(Number(v))) {
        next[f.field_key] = "Número inválido";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const normalized: Record<string, any> = {};
    for (const f of fields) {
      let v = values[f.field_key];
      if (f.field_type === "number" && v !== "" && v !== undefined && v !== null) v = Number(v);
      if (f.field_type === "boolean") v = !!v;
      normalized[f.field_key] = v ?? null;
    }
    onSubmit(normalized);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum campo configurado para esta entidade.</p>
      )}
      {fields.map((f) => (
        <div key={f.id} className="space-y-1">
          <Label htmlFor={f.field_key}>
            {f.label} {f.is_required && <span className="text-destructive">*</span>}
          </Label>
          <FieldInput field={f} value={values[f.field_key]} onChange={(v) => set(f.field_key, v)} />
          {f.help_text && <p className="text-xs text-muted-foreground">{f.help_text}</p>}
          {errors[f.field_key] && <p className="text-xs text-destructive">{errors[f.field_key]}</p>}
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" disabled={submitting}>Salvar</Button>
      </div>
    </form>
  );
}

function FieldInput({ field, value, onChange }: { field: CustomField; value: any; onChange: (v: any) => void }) {
  switch (field.field_type) {
    case "boolean":
      return <Switch checked={!!value} onCheckedChange={onChange} />;
    case "number":
      return <Input id={field.field_key} type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "date":
      return <Input id={field.field_key} type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "datetime":
      return <Input id={field.field_key} type="datetime-local" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "json":
      return (
        <Textarea
          id={field.field_key}
          rows={4}
          value={typeof value === "string" ? value : JSON.stringify(value ?? {}, null, 2)}
          onChange={(e) => {
            try { onChange(JSON.parse(e.target.value)); } catch { onChange(e.target.value); }
          }}
        />
      );
    case "select": {
      const opts: Array<{ value: string; label: string }> = Array.isArray(field.options)
        ? field.options.map((o: any) => typeof o === "string" ? { value: o, label: o } : o)
        : [];
      return (
        <Select value={value ?? ""} onValueChange={onChange}>
          <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
          <SelectContent>
            {opts.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    }
    case "multiselect": {
      const opts: string[] = Array.isArray(field.options) ? field.options.map((o: any) => String(o?.value ?? o)) : [];
      const arr: string[] = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-2">
          {opts.map((o) => (
            <label key={o} className="flex items-center gap-1 text-sm border rounded px-2 py-1 cursor-pointer">
              <input
                type="checkbox"
                checked={arr.includes(o)}
                onChange={(e) => onChange(e.target.checked ? [...arr, o] : arr.filter((x) => x !== o))}
              />
              {o}
            </label>
          ))}
        </div>
      );
    }
    default:
      return <Input id={field.field_key} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }
}
