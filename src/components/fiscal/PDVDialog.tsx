import { useState } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';

interface CartItem {
  productCode: string;
  productName: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  unit: string;
}

interface PDVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmit: (data: {
    items: { productCode: string; productName: string; productId?: string; quantity: number; unitPrice: number; unit?: string }[];
    paymentMethod: string;
    amountPaid: number;
    discount?: number;
    customerName?: string;
    customerDocument?: string;
    terminalId?: string;
    operatorName?: string;
  }) => Promise<any>;
}

const paymentMethods = [
  { value: 'cash', label: 'Dinheiro', icon: Banknote },
  { value: 'credit_card', label: 'Crédito', icon: CreditCard },
  { value: 'debit_card', label: 'Débito', icon: CreditCard },
  { value: 'pix', label: 'PIX', icon: QrCode },
];

export function PDVDialog({ open, onOpenChange, onEmit }: PDVDialogProps) {
  const { products } = useProducts();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [amountPaid, setAmountPaid] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredProducts = search
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.code.toLowerCase().includes(search.toLowerCase()) ||
            p.barcode?.includes(search)
        )
        .slice(0, 6)
    : [];

  const subtotal = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const total = subtotal - discount;
  const change = amountPaid - total;

  const addToCart = (product: { id: string; code: string; name: string; salePrice: number; unit: string }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        { productCode: product.code, productName: product.name, productId: product.id, quantity: 1, unitPrice: product.salePrice, unit: product.unit },
      ];
    });
    setSearch('');
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const handleFinalize = async () => {
    if (cart.length === 0) return;
    setSaving(true);
    const paid = paymentMethod === 'cash' ? amountPaid : total;
    await onEmit({
      items: cart.map((i) => ({
        productCode: i.productCode,
        productName: i.productName,
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        unit: i.unit,
      })),
      paymentMethod,
      amountPaid: paid,
      discount: discount || undefined,
      customerName: customerName || undefined,
      customerDocument: customerDocument || undefined,
      terminalId: 'PDV-01',
      operatorName: 'Operador',
    });
    setSaving(false);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setCart([]);
    setSearch('');
    setPaymentMethod('pix');
    setAmountPaid(0);
    setDiscount(0);
    setCustomerName('');
    setCustomerDocument('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <div className="grid grid-cols-1 lg:grid-cols-5">
          {/* Left: Product Search & Cart */}
          <div className="lg:col-span-3 p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Ponto de Venda - NFC-e
              </DialogTitle>
            </DialogHeader>

            {/* Product Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar produto (nome, código ou código de barras)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 text-lg h-12"
                autoFocus
              />
            </div>

            {search && filteredProducts.length > 0 && (
              <div className="rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-accent text-left border-b last:border-0"
                    onClick={() => addToCart(p)}
                  >
                    <div>
                      <span className="font-medium">{p.name}</span>
                      <span className="text-muted-foreground ml-2">({p.code})</span>
                    </div>
                    <span className="font-bold">{formatCurrency(p.salePrice)}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Cart Items */}
            <div className="space-y-2 min-h-[200px]">
              {cart.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  Adicione produtos para iniciar a venda
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-xs text-muted-foreground">{item.productCode} • {formatCurrency(item.unitPrice)}/{item.unit}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.productId, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.productId, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="w-24 text-right font-bold">{formatCurrency(item.quantity * item.unitPrice)}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFromCart(item.productId)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Payment */}
          <div className="lg:col-span-2 bg-muted/30 p-6 space-y-4 border-l">
            <div className="text-center space-y-1">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-4xl font-bold text-primary">{formatCurrency(total)}</div>
              {discount > 0 && (
                <div className="text-sm text-muted-foreground line-through">{formatCurrency(subtotal)}</div>
              )}
            </div>

            <Separator />

            {/* Payment Method */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Forma de Pagamento</Label>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.value}
                      className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                        paymentMethod === pm.value
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => setPaymentMethod(pm.value)}
                    >
                      <Icon className="h-4 w-4" />
                      {pm.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash: amount paid */}
            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <Label>Valor Recebido</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={amountPaid || ''}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="text-lg h-12"
                  placeholder="0,00"
                />
                {amountPaid > 0 && amountPaid >= total && (
                  <div className="rounded-lg bg-success/10 p-3 text-center">
                    <span className="text-sm text-muted-foreground">Troco: </span>
                    <span className="text-lg font-bold text-success">{formatCurrency(change)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Discount */}
            <div className="space-y-2">
              <Label>Desconto</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value))}
                placeholder="0,00"
              />
            </div>

            <Separator />

            {/* Optional Customer */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cliente (opcional)</Label>
              <Input
                placeholder="Nome do cliente"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <Input
                placeholder="CPF/CNPJ"
                value={customerDocument}
                onChange={(e) => setCustomerDocument(e.target.value)}
              />
            </div>

            {/* Summary */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Itens</span>
                <span>{cart.reduce((s, i) => s + i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Desconto</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
            </div>

            {/* Finalize */}
            <Button
              className="w-full h-12 text-lg"
              onClick={handleFinalize}
              disabled={saving || cart.length === 0 || (paymentMethod === 'cash' && amountPaid < total)}
            >
              {saving ? 'Emitindo...' : 'Finalizar Venda'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
