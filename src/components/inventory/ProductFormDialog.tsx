import { useEffect, useMemo, useState } from 'react';
import { Factory, Store, Briefcase, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/ui/base/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Switch } from '@/ui/base/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/ui/base/select';
import { cn } from '@/lib/utils';
import { productTypeConfig, productStatusConfig } from '@/config/inventory';
import { useCreateProduct, useUpdateProduct, type DbProduct, type ProductNature } from '@/hooks/inventory/useProducts';
import {
  ITEM_KIND_LABELS, allowedKindsFor, isValidGtin, isValidNcm, normalizeNcm,
  type ItemKind,
} from '@/lib/validators/product';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: DbProduct | null;
  categories: Array<{ id: string; name: string }>;
}

const natures: { value: ProductNature; label: string; hint: string; icon: any }[] = [
  { value: 'industry', label: 'Indústria', hint: 'Fabricação própria com BOM e roteiro', icon: Factory },
  { value: 'commerce', label: 'Comércio', hint: 'Revenda de mercadorias', icon: Store },
  { value: 'service', label: 'Serviço', hint: 'Serviços tributados por ISS', icon: Briefcase },
];

const emptyForm = {
  code: '', barcode: '', gtin: '', name: '', description: '',
  type: 'finished', category_id: '', unit: 'UN',
  cost_price: '', sale_price: '', status: 'active',
  product_nature: 'commerce' as ProductNature,
  // Estoque
  min_stock: '0', max_stock: '0', reorder_point: '0', lead_time_days: '0',
  location: '', supplier: '',
  // Dimensões
  weight: '', width: '', height: '', depth: '',
  // Fiscal
  ncm: '', cest: '', cfop_default: '', origin: '0',
  icms_cst: '', ipi_cst: '', pis_cst: '', cofins_cst: '',
  // Indústria
  standard_batch_size: '', technical_sheet_url: '',
  // Comércio
  brand: '', model: '', warranty_months: '',
  // Serviço
  service_code_lc116: '', iss_rate: '', service_duration_minutes: '', is_recurring: false,
};

export function ProductFormDialog({ open, onOpenChange, product, categories }: Props) {
  const [form, setForm] = useState(emptyForm);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  useEffect(() => {
    if (product) {
      setForm({
        ...emptyForm,
        code: product.code ?? '', barcode: product.barcode ?? '', gtin: product.gtin ?? '',
        name: product.name ?? '', description: product.description ?? '',
        type: product.type ?? 'finished', category_id: product.category_id ?? '',
        unit: product.unit ?? 'UN',
        cost_price: String(product.cost_price ?? ''), sale_price: String(product.sale_price ?? ''),
        status: product.status ?? 'active',
        product_nature: (product.product_nature as ProductNature) ?? 'commerce',
        min_stock: String(product.min_stock ?? 0), max_stock: String(product.max_stock ?? 0),
        reorder_point: String(product.reorder_point ?? 0), lead_time_days: String(product.lead_time_days ?? 0),
        location: product.location ?? '', supplier: product.supplier ?? '',
        weight: product.weight != null ? String(product.weight) : '',
        width: product.width != null ? String(product.width) : '',
        height: product.height != null ? String(product.height) : '',
        depth: product.depth != null ? String(product.depth) : '',
        ncm: product.ncm ?? '', cest: product.cest ?? '',
        cfop_default: product.cfop_default ?? '', origin: product.origin ?? '0',
        icms_cst: product.icms_cst ?? '', ipi_cst: product.ipi_cst ?? '',
        pis_cst: product.pis_cst ?? '', cofins_cst: product.cofins_cst ?? '',
        standard_batch_size: product.standard_batch_size != null ? String(product.standard_batch_size) : '',
        technical_sheet_url: product.technical_sheet_url ?? '',
        brand: product.brand ?? '', model: product.model ?? '',
        warranty_months: product.warranty_months != null ? String(product.warranty_months) : '',
        service_code_lc116: product.service_code_lc116 ?? '',
        iss_rate: product.iss_rate != null ? String(product.iss_rate) : '',
        service_duration_minutes: product.service_duration_minutes != null ? String(product.service_duration_minutes) : '',
        is_recurring: !!product.is_recurring,
      });
    } else {
      setForm(emptyForm);
    }
  }, [product, open]);

  const isService = form.product_nature === 'service';
  const isIndustry = form.product_nature === 'industry';
  const isCommerce = form.product_nature === 'commerce';

  const update = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const buildPayload = (): Partial<DbProduct> => {
    const num = (v: string) => (v === '' ? null : Number(v));
    const base: Partial<DbProduct> = {
      code: form.code, barcode: form.barcode || null, gtin: form.gtin || null,
      name: form.name, description: form.description || null,
      type: form.type, category_id: form.category_id || null, unit: form.unit,
      cost_price: Number(form.cost_price) || 0, sale_price: Number(form.sale_price) || 0,
      status: form.status, product_nature: form.product_nature,
      // Fiscais (comuns)
      ncm: form.ncm || null, cest: form.cest || null,
      cfop_default: form.cfop_default || null, origin: form.origin || null,
      icms_cst: form.icms_cst || null, ipi_cst: form.ipi_cst || null,
      pis_cst: form.pis_cst || null, cofins_cst: form.cofins_cst || null,
    };
    if (isService) {
      // Serviço: não precisa estoque físico/dimensões
      return {
        ...base,
        min_stock: 0, max_stock: 0, reorder_point: 0, lead_time_days: 0,
        location: null, supplier: null,
        weight: null, width: null, height: null, depth: null,
        service_code_lc116: form.service_code_lc116 || null,
        iss_rate: num(form.iss_rate),
        service_duration_minutes: form.service_duration_minutes ? Number(form.service_duration_minutes) : null,
        is_recurring: form.is_recurring,
        // limpa campos de indústria/comércio
        standard_batch_size: null, technical_sheet_url: null,
        brand: null, model: null, warranty_months: null,
      };
    }
    const stockAndDims = {
      min_stock: Number(form.min_stock) || 0, max_stock: Number(form.max_stock) || 0,
      reorder_point: Number(form.reorder_point) || 0,
      lead_time_days: Number(form.lead_time_days) || 0,
      location: form.location || null, supplier: form.supplier || null,
      weight: num(form.weight), width: num(form.width),
      height: num(form.height), depth: num(form.depth),
    };
    if (isIndustry) {
      return {
        ...base, ...stockAndDims,
        standard_batch_size: num(form.standard_batch_size),
        technical_sheet_url: form.technical_sheet_url || null,
        brand: null, model: null, warranty_months: null,
        service_code_lc116: null, iss_rate: null, service_duration_minutes: null, is_recurring: false,
      };
    }
    // Comércio
    return {
      ...base, ...stockAndDims,
      brand: form.brand || null, model: form.model || null,
      warranty_months: form.warranty_months ? Number(form.warranty_months) : null,
      standard_batch_size: null, technical_sheet_url: null,
      service_code_lc116: null, iss_rate: null, service_duration_minutes: null, is_recurring: false,
    };
  };

  const handleSave = async () => {
    if (!form.code || !form.name) return;
    const payload = buildPayload();
    if (product) {
      await updateProduct.mutateAsync({ id: product.id, ...payload } as any);
    } else {
      await createProduct.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const saving = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>

        {/* Seletor de natureza */}
        <div className="grid grid-cols-3 gap-3">
          {natures.map((n) => {
            const Icon = n.icon;
            const active = form.product_nature === n.value;
            return (
              <button
                key={n.value}
                type="button"
                onClick={() => update({ product_nature: n.value })}
                className={cn(
                  'rounded-lg border p-4 text-left transition-all',
                  active
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                    : 'border-border hover:border-primary/40 hover:bg-muted/40'
                )}
              >
                <Icon className={cn('h-5 w-5 mb-2', active ? 'text-primary' : 'text-muted-foreground')} />
                <div className="font-semibold text-sm">{n.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{n.hint}</div>
              </button>
            );
          })}
        </div>

        <Tabs defaultValue="general" className="w-full mt-2">
          <TabsList className={cn('grid w-full', isService ? 'grid-cols-3' : 'grid-cols-4')}>
            <TabsTrigger value="general">Geral</TabsTrigger>
            {!isService && <TabsTrigger value="stock">Estoque</TabsTrigger>}
            <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
            <TabsTrigger value="specific">
              {isIndustry ? 'Produção' : isService ? 'Serviço' : 'Comércio'}
            </TabsTrigger>
          </TabsList>

          {/* GERAL */}
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
          </TabsContent>

          {/* ESTOQUE — oculta para serviços */}
          {!isService && (
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
          )}

          {/* FISCAL */}
          <TabsContent value="fiscal" className="space-y-4 pt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{isService ? 'Código LC 116' : 'NCM'}</Label>
                <Input
                  value={isService ? form.service_code_lc116 : form.ncm}
                  onChange={(e) => update(isService ? { service_code_lc116: e.target.value } : { ncm: e.target.value })}
                  placeholder={isService ? '00.00' : '00000000'}
                />
              </div>
              {!isService && (
                <>
                  <div className="space-y-2"><Label>CEST</Label>
                    <Input value={form.cest} onChange={(e) => update({ cest: e.target.value })} /></div>
                  <div className="space-y-2"><Label>CFOP Padrão</Label>
                    <Input value={form.cfop_default} onChange={(e) => update({ cfop_default: e.target.value })} placeholder="5102" /></div>
                </>
              )}
              <div className="space-y-2"><Label>GTIN</Label>
                <Input value={form.gtin} onChange={(e) => update({ gtin: e.target.value })} /></div>
            </div>
            {!isService ? (
              <div className="grid grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Origem</Label>
                  <Select value={form.origin} onValueChange={(v) => update({ origin: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 - Nacional</SelectItem>
                      <SelectItem value="1">1 - Estrangeira (Import. direta)</SelectItem>
                      <SelectItem value="2">2 - Estrangeira (Merc. interno)</SelectItem>
                      <SelectItem value="3">3 - Nacional {'>'} 40% import.</SelectItem>
                      <SelectItem value="6">6 - Nacional s/ similar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>CST ICMS</Label>
                  <Input value={form.icms_cst} onChange={(e) => update({ icms_cst: e.target.value })} /></div>
                <div className="space-y-2"><Label>CST IPI</Label>
                  <Input value={form.ipi_cst} onChange={(e) => update({ ipi_cst: e.target.value })} /></div>
                <div className="space-y-2"><Label>CST PIS</Label>
                  <Input value={form.pis_cst} onChange={(e) => update({ pis_cst: e.target.value })} /></div>
                <div className="space-y-2"><Label>CST COFINS</Label>
                  <Input value={form.cofins_cst} onChange={(e) => update({ cofins_cst: e.target.value })} /></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Alíquota ISS (%)</Label>
                  <Input type="number" step="0.01" value={form.iss_rate}
                    onChange={(e) => update({ iss_rate: e.target.value })} placeholder="Ex: 5" />
                </div>
              </div>
            )}
          </TabsContent>

          {/* ABA ESPECÍFICA — Indústria / Comércio / Serviço */}
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
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Marca</Label>
                  <Input value={form.brand} onChange={(e) => update({ brand: e.target.value })} /></div>
                <div className="space-y-2"><Label>Modelo</Label>
                  <Input value={form.model} onChange={(e) => update({ model: e.target.value })} /></div>
                <div className="space-y-2"><Label>Garantia (meses)</Label>
                  <Input type="number" value={form.warranty_months}
                    onChange={(e) => update({ warranty_months: e.target.value })} /></div>
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
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !form.code || !form.name}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
