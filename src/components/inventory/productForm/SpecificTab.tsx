import { toast } from 'sonner';
import { TabsContent } from '@/ui/base/tabs';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Switch } from '@/ui/base/switch';
import { isValidGtin } from '@/lib/validators/product';
import type { ProductForm, Update } from './formState';

interface Props {
  form: ProductForm;
  update: Update;
  isIndustry: boolean;
  isCommerce: boolean;
  isService: boolean;
}

export function SpecificTab({ form, update, isIndustry, isCommerce, isService }: Props) {
  return (
    <TabsContent value="specific" className="space-y-4 pt-4">
      {isIndustry && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Lote Padrão de Produção</Label>
            <Input type="number" step="0.01" value={form.standard_batch_size}
              onChange={(e) => update({ standard_batch_size: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Ficha Técnica (URL)</Label>
            <Input value={form.technical_sheet_url}
              onChange={(e) => update({ technical_sheet_url: e.target.value })}
              placeholder="https://..." />
          </div>
          <div className="col-span-2 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
            Vincule BOM e roteiro na tela <strong>Produção › Rotas & BOM</strong>.
          </div>
        </div>
      )}
      {isCommerce && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Marca</Label>
              <Input value={form.brand} onChange={(e) => update({ brand: e.target.value })} /></div>
            <div className="space-y-2"><Label>Modelo</Label>
              <Input value={form.model} onChange={(e) => update({ model: e.target.value })} /></div>
            <div className="space-y-2"><Label>Garantia (meses)</Label>
              <Input type="number" value={form.warranty_months}
                onChange={(e) => update({ warranty_months: e.target.value })} /></div>
          </div>
          <div className="space-y-2 rounded-md border p-3">
            <Label className="text-sm">Códigos EAN adicionais (multi-embalagem)</Label>
            <p className="text-xs text-muted-foreground">
              Cadastre variações de embalagem (unidade, pack, caixa) que compartilham o mesmo SKU.
            </p>
            <div className="flex gap-2">
              <Input
                value={form.new_ean}
                onChange={(e) => update({ new_ean: e.target.value.replace(/\D/g, '') })}
                placeholder="Digite o EAN e clique em Adicionar"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const v = form.new_ean.trim();
                  if (!v) return;
                  if (form.multi_ean.includes(v)) {
                    toast.error('Este EAN já foi adicionado');
                    return;
                  }
                  if (!isValidGtin(v)) {
                    toast.error('EAN inválido (dígito verificador incorreto)');
                    return;
                  }
                  update({ multi_ean: [...form.multi_ean, v], new_ean: '' });
                }}
              >
                Adicionar
              </Button>
            </div>
            {form.multi_ean.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {form.multi_ean.map((ean) => (
                  <div
                    key={ean}
                    className="flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs"
                  >
                    <span className="font-mono">{ean}</span>
                    <button
                      type="button"
                      onClick={() =>
                        update({ multi_ean: form.multi_ean.filter((e) => e !== ean) })
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {isService && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Duração (minutos)</Label>
            <Input type="number" value={form.service_duration_minutes}
              onChange={(e) => update({ service_duration_minutes: e.target.value })} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="text-sm">Serviço Recorrente</Label>
              <p className="text-xs text-muted-foreground">Gera cobrança periódica automática</p>
            </div>
            <Switch checked={form.is_recurring}
              onCheckedChange={(v) => update({ is_recurring: v })} />
          </div>
        </div>
      )}
    </TabsContent>
  );
}
