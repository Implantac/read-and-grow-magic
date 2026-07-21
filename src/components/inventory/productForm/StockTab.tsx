import { TabsContent } from '@/ui/base/tabs';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import type { ProductForm, Update } from './formState';

export function StockTab({ form, update }: { form: ProductForm; update: Update }) {
  return (
    <TabsContent value="stock" className="space-y-4 pt-4">
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2"><Label>Estoque Mín.</Label>
          <Input type="number" value={form.min_stock} onChange={(e) => update({ min_stock: e.target.value })} /></div>
        <div className="space-y-2"><Label>Estoque Máx.</Label>
          <Input type="number" value={form.max_stock} onChange={(e) => update({ max_stock: e.target.value })} /></div>
        <div className="space-y-2"><Label>Ponto Reposição</Label>
          <Input type="number" value={form.reorder_point} onChange={(e) => update({ reorder_point: e.target.value })} /></div>
        <div className="space-y-2"><Label>Lead Time (dias)</Label>
          <Input type="number" value={form.lead_time_days} onChange={(e) => update({ lead_time_days: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Localização</Label>
          <Input value={form.location} onChange={(e) => update({ location: e.target.value })} /></div>
        <div className="space-y-2"><Label>Fornecedor</Label>
          <Input value={form.supplier} onChange={(e) => update({ supplier: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2"><Label>Peso (kg)</Label>
          <Input type="number" step="0.001" value={form.weight} onChange={(e) => update({ weight: e.target.value })} /></div>
        <div className="space-y-2"><Label>Largura (cm)</Label>
          <Input type="number" step="0.01" value={form.width} onChange={(e) => update({ width: e.target.value })} /></div>
        <div className="space-y-2"><Label>Altura (cm)</Label>
          <Input type="number" step="0.01" value={form.height} onChange={(e) => update({ height: e.target.value })} /></div>
        <div className="space-y-2"><Label>Profundidade (cm)</Label>
          <Input type="number" step="0.01" value={form.depth} onChange={(e) => update({ depth: e.target.value })} /></div>
      </div>
    </TabsContent>
  );
}
