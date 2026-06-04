import { useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatBRL } from '@/lib/formatters';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useProducts, type DbProduct } from '@/hooks/inventory/useProducts';

export interface LineItem {
  product_id?: string | null;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  discount: number;
}

interface OrderItemsEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}

export function OrderItemsEditor({ items, onChange }: OrderItemsEditorProps) {
  const { data: products = [] } = useProducts();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const addItem = () => {
    onChange([...items, { product_id: null, product_name: '', product_code: '', quantity: 1, unit_price: 0, discount: 0 }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const selectProduct = (index: number, product: DbProduct) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      product_id: product.id,
      product_name: product.name,
      product_code: product.code,
      unit_price: product.sale_price,
    };
    onChange(updated);
    setOpenIndex(null);
  };

  const getItemTotal = (item: LineItem) => item.quantity * item.unit_price - item.discount;
  const grandTotal = items.reduce((s, i) => s + getItemTotal(i), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Itens</Label>
        <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Adicionar Item
        </Button>
      </div>

      {items.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
          Nenhum item adicionado. Clique em "Adicionar Item" para começar.
        </div>
      )}

      {items.map((item, index) => (
        <div key={index} className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-muted-foreground">Item {index + 1}</span>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(index)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Produto</Label>
            <Popover open={openIndex === index} onOpenChange={(open) => setOpenIndex(open ? index : null)}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                  {item.product_name || 'Selecionar produto...'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar produto..." />
                  <CommandList>
                    <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                    <CommandGroup>
                      {products.filter(p => p.status === 'active').map((product) => (
                        <CommandItem
                          key={product.id}
                          onSelect={() => selectProduct(index, product)}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <span className="font-medium">{product.name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{product.code}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatBRL(product.sale_price)}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Quantidade</Label>
              <Input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', Number(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Preço Unit.</Label>
              <Input
                type="number"
                step="0.01"
                value={item.unit_price}
                onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Desconto</Label>
              <Input
                type="number"
                step="0.01"
                value={item.discount}
                onChange={(e) => updateItem(index, 'discount', Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Total</Label>
              <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm font-medium">
                {formatBRL(getItemTotal(item))}
              </div>
            </div>
          </div>
        </div>
      ))}

      {items.length > 0 && (
        <div className="flex justify-end rounded-lg border bg-muted/50 p-4">
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-8 justify-between">
              <span className="text-muted-foreground">Subtotal ({items.length} {items.length === 1 ? 'item' : 'itens'})</span>
              <span className="font-semibold text-lg">
                {formatBRL(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
