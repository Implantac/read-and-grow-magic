import { TabsContent } from '@/ui/base/tabs';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import type { ProductForm, Update } from './formState';

export function RetailQuickTab({ form, update }: { form: ProductForm; update: Update }) {
  return (
    <TabsContent value="general" className="space-y-4 pt-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="retail-code">Código do produto *</Label>
          <Input id="retail-code" value={form.code} onChange={(e) => update({ code: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="retail-barcode">Código de barras</Label>
          <Input id="retail-barcode" value={form.barcode} onChange={(e) => update({ barcode: e.target.value })} /></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="retail-name">Nome do produto *</Label>
          <Input id="retail-name" value={form.name} onChange={(e) => update({ name: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="retail-price">Preço de venda</Label>
          <Input id="retail-price" type="number" min="0" step="0.01" value={form.sale_price} onChange={(e) => update({ sale_price: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="retail-cost">Custo</Label>
          <Input id="retail-cost" type="number" min="0" step="0.01" value={form.cost_price} onChange={(e) => update({ cost_price: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="retail-unit">Unidade</Label>
          <Input id="retail-unit" value={form.unit} onChange={(e) => update({ unit: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="retail-min">Estoque mínimo</Label>
          <Input id="retail-min" type="number" min="0" value={form.min_stock} onChange={(e) => update({ min_stock: e.target.value })} /></div>
      </div>
      <p className="text-xs text-muted-foreground">O estoque disponível é atualizado na entrada de mercadorias, não neste cadastro.</p>
    </TabsContent>
  );
}