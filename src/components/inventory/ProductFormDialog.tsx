import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/ui/base/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { Button } from '@/ui/base/button';
import { Label } from '@/ui/base/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/ui/base/select';
import { cn } from '@/lib/utils';
import { useCreateProduct, useUpdateProduct, type DbProduct } from '@/hooks/inventory/useProducts';
import {
  ITEM_KIND_LABELS, allowedKindsFor, isValidGtin, isValidNcm,
  type ItemKind,
} from '@/lib/validators/product';
import {
  emptyForm, productToForm, buildPayload, type ProductForm,
} from './productForm/formState';
import { NatureSelector } from './productForm/NatureSelector';
import { GeneralTab } from './productForm/GeneralTab';
import { LotTab } from './productForm/LotTab';
import { StockTab } from './productForm/StockTab';
import { FiscalTab } from './productForm/FiscalTab';
import { SpecificTab } from './productForm/SpecificTab';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: DbProduct | null;
  categories: Array<{ id: string; name: string }>;
}

export function ProductFormDialog({ open, onOpenChange, product, categories }: Props) {
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  useEffect(() => {
    setForm(product ? productToForm(product) : emptyForm);
  }, [product, open]);

  const isService = form.product_nature === 'service';
  const isIndustry = form.product_nature === 'industry';
  const isCommerce = form.product_nature === 'commerce';

  const availableKinds = useMemo(() => allowedKindsFor(form.product_nature), [form.product_nature]);
  useEffect(() => {
    if (!availableKinds.includes(form.item_kind)) {
      setForm((f) => ({ ...f, item_kind: availableKinds[0] }));
    }
  }, [availableKinds, form.item_kind]);

  const ncmError = form.ncm && !isValidNcm(form.ncm) ? 'NCM deve ter 8 dígitos numéricos' : '';
  const gtinError = form.gtin && !isValidGtin(form.gtin) ? 'GTIN inválido (dígito verificador incorreto)' : '';

  const update = (patch: Partial<ProductForm>) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = async () => {
    if (!form.code || !form.name) return;
    if (ncmError || gtinError) {
      toast.error(ncmError || gtinError);
      return;
    }
    const payload = buildPayload(form);
    try {
      if (product) {
        await updateProduct.mutateAsync({ id: product.id, ...payload } as any);
      } else {
        await createProduct.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (e: any) {
      const msg = String(e?.message ?? '');
      if (msg.includes('products_company_code_unique')) {
        toast.error('Já existe um produto com este código nesta empresa.');
      } else if (msg.includes('products_company_gtin_unique')) {
        toast.error('Este GTIN já está cadastrado nesta empresa.');
      } else {
        toast.error('Erro ao salvar produto', { description: msg.slice(0, 140) });
      }
    }
  };

  const saving = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>

        <NatureSelector value={form.product_nature} onChange={(v) => update({ product_nature: v })} />

        <div className="grid grid-cols-[160px_1fr] items-center gap-3 rounded-lg border bg-muted/20 p-3">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Tipo de Item</Label>
          <Select value={form.item_kind} onValueChange={(v) => update({ item_kind: v as ItemKind })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {availableKinds.map((k) => (
                <SelectItem key={k} value={k}>{ITEM_KIND_LABELS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="general" className="w-full mt-2">
          <TabsList
            className={cn(
              'grid w-full',
              isService
                ? form.requires_lot_tracking ? 'grid-cols-4' : 'grid-cols-3'
                : form.requires_lot_tracking ? 'grid-cols-5' : 'grid-cols-4'
            )}
          >
            <TabsTrigger value="general">Geral</TabsTrigger>
            {!isService && <TabsTrigger value="stock">Estoque</TabsTrigger>}
            {form.requires_lot_tracking && (
              <TabsTrigger value="lot">Rastreabilidade</TabsTrigger>
            )}
            <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
            <TabsTrigger value="specific">
              {isIndustry ? 'Produção' : isService ? 'Serviço' : 'Comércio'}
            </TabsTrigger>
          </TabsList>

          <GeneralTab form={form} update={update} isService={isService} categories={categories} />
          {form.requires_lot_tracking && <LotTab form={form} update={update} />}
          {!isService && <StockTab form={form} update={update} />}
          <FiscalTab form={form} update={update} isService={isService} ncmError={ncmError} gtinError={gtinError} />
          <SpecificTab form={form} update={update} isIndustry={isIndustry} isCommerce={isCommerce} isService={isService} />
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !form.code || !form.name || !!ncmError || !!gtinError}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
