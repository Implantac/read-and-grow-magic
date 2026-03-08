import { useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { cfopOptions } from '@/config/fiscal';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';

interface NFeItemForm {
  productCode: string;
  productName: string;
  productId?: string;
  ncm: string;
  cfop: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

interface CreateNFeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    clientName: string;
    clientId?: string;
    clientDocument?: string;
    operationType: string;
    items: { productCode: string; productName: string; productId?: string; quantity: number; unitPrice: number; unit?: string; ncm?: string; cfop?: string }[];
    discount?: number;
    shipping?: number;
  }) => Promise<any>;
}

export function CreateNFeDialog({ open, onOpenChange, onCreate }: CreateNFeDialogProps) {
  const clientsQuery = useClients();
  const productsQuery = useProducts();
  const clients = clientsQuery.data || [];
  const products = productsQuery.data || [];
  const [saving, setSaving] = useState(false);

  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientDocument, setClientDocument] = useState('');
  const [operationType, setOperationType] = useState('saida');
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [items, setItems] = useState<NFeItemForm[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 8);

  const handleSelectClient = (id: string) => {
    const client = clients.find((c) => c.id === id);
    if (client) {
      setClientId(id);
      setClientName(client.name);
      setClientDocument(client.document);
    }
  };

  const handleAddProduct = (product: { id: string; code: string; name: string; sale_price: number; unit: string }) => {
    setItems((prev) => [
      ...prev,
      {
        productCode: product.code,
        productName: product.name,
        productId: product.id,
        ncm: '',
        cfop: '5102',
        unit: product.unit || 'UN',
        quantity: 1,
        unitPrice: product.sale_price,
      },
      },
    ]);
    setProductSearch('');
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof NFeItemForm, value: string | number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const total = subtotal - discount + shipping;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const handleSubmit = async () => {
    if (!clientName.trim() || items.length === 0) return;
    setSaving(true);
    await onCreate({
      clientName,
      clientId: clientId || undefined,
      clientDocument: clientDocument || undefined,
      operationType,
      items: items.map((i) => ({
        productCode: i.productCode,
        productName: i.productName,
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        unit: i.unit,
        ncm: i.ncm,
        cfop: i.cfop,
      })),
      discount,
      shipping,
    });
    setSaving(false);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setClientId('');
    setClientName('');
    setClientDocument('');
    setOperationType('saida');
    setDiscount(0);
    setShipping(0);
    setItems([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova NF-e</DialogTitle>
          <DialogDescription>Preencha os dados para criar uma nova nota fiscal eletrônica</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client & Operation */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cliente/Destinatário</Label>
              <Select value={clientId} onValueChange={handleSelectClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} - {c.document}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!clientId && (
                <Input
                  placeholder="Ou digite o nome do cliente"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Tipo de Operação</Label>
              <Select value={operationType} onValueChange={setOperationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Add Items */}
          <div className="space-y-3">
            <Label>Itens da Nota</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar produto por nome ou código..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {productSearch && filteredProducts.length > 0 && (
              <div className="rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent text-left"
                    onClick={() => handleAddProduct(p)}
                  >
                    <span>
                      <span className="font-medium">{p.code}</span> - {p.name}
                    </span>
                    <span className="text-muted-foreground">{formatCurrency(p.salePrice)}</span>
                  </button>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>CFOP</TableHead>
                      <TableHead className="w-20">Qtd</TableHead>
                      <TableHead className="w-28">Valor Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <div className="text-sm font-medium">{item.productName}</div>
                          <div className="text-xs text-muted-foreground">{item.productCode}</div>
                        </TableCell>
                        <TableCell>
                          <Select value={item.cfop} onValueChange={(v) => updateItem(idx, 'cfop', v)}>
                            <SelectTrigger className="h-8 w-24 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {cfopOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value}>{o.value}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                            className="h-8 w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.unitPrice}
                            onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                            className="h-8 w-28"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveItem(idx)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <Separator />

          {/* Totals */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Subtotal</Label>
              <div className="text-lg font-bold">{formatCurrency(subtotal)}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Desconto</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Frete</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={shipping}
                onChange={(e) => setShipping(Number(e.target.value))}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Total</Label>
              <div className="text-xl font-bold text-primary">{formatCurrency(total)}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving || !clientName.trim() || items.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              {saving ? 'Criando...' : 'Criar NF-e'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
