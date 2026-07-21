import { TabsContent } from '@/ui/base/tabs';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Switch } from '@/ui/base/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { productTypeConfig, productStatusConfig } from '@/config/inventory';
import type { ProductForm, Update } from './formState';

interface Props {
  form: ProductForm;
  update: Update;
  isService: boolean;
  categories: Array<{ id: string; name: string }>;
}

export function GeneralTab({ form, update, isService, categories }: Props) {
  return (
    <TabsContent value="general" className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Código *</Label>
          <Input value={form.code} onChange={(e) => update({ code: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Código de Barras</Label>
          <Input value={form.barcode} onChange={(e) => update({ barcode: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Nome *</Label>
        <Input value={form.name} onChange={(e) => update({ name: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea value={form.description} onChange={(e) => update({ description: e.target.value })} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={form.type} onValueChange={(v) => update({ type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {productTypeConfig.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={form.category_id} onValueChange={(v) => update({ category_id: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Unidade</Label>
          <Input value={form.unit} onChange={(e) => update({ unit: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Custo</Label>
          <Input type="number" step="0.01" value={form.cost_price}
            onChange={(e) => update({ cost_price: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>{isService ? 'Preço do Serviço' : 'Preço Venda'}</Label>
          <Input type="number" step="0.01" value={form.sale_price}
            onChange={(e) => update({ sale_price: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => update({ status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {productStatusConfig.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {!isService && (
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <Label className="text-sm">Exige rastreabilidade por lote</Label>
            <p className="text-xs text-muted-foreground">
              Obrigatório para alimentos, farmacêuticos, químicos e produtos perecíveis
            </p>
          </div>
          <Switch
            checked={form.requires_lot_tracking}
            onCheckedChange={(v) => update({ requires_lot_tracking: v })}
          />
        </div>
      )}
    </TabsContent>
  );
}
