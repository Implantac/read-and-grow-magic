import { TabsContent } from '@/ui/base/tabs';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import type { ProductForm, Update } from './formState';

export function LotTab({ form, update }: { form: ProductForm; update: Update }) {
  return (
    <TabsContent value="lot" className="space-y-4 pt-4">
      <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
        Este produto será controlado por <strong>lote e validade</strong> em todas as movimentações
        (entrada, saída, inventário e picking). O motor FEFO é aplicado automaticamente no WMS.
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Validade padrão (dias)</Label>
          <Input
            type="number"
            value={form.shelf_life_days}
            onChange={(e) => update({ shelf_life_days: e.target.value })}
            placeholder="Ex: 180"
          />
          <p className="text-xs text-muted-foreground">
            Data de validade sugerida ao entrar um lote novo.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Condições de armazenamento</Label>
          <Input
            value={form.storage_conditions}
            onChange={(e) => update({ storage_conditions: e.target.value })}
            placeholder="Ex: 2°C a 8°C, seco, ao abrigo da luz"
          />
        </div>
      </div>
    </TabsContent>
  );
}
