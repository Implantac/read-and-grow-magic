import { useState, useRef, useEffect } from 'react';
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, 
  Banknote, QrCode, User, Package, X, CheckCircle2, 
  ChevronRight, Receipt, Printer, ArrowLeft, MoreHorizontal,
  Monitor, Calculator, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
  { value: 'cash', label: 'Dinheiro (F1)', icon: Banknote, color: 'text-success bg-success/10' },
  { value: 'credit_card', label: 'Crédito (F2)', icon: CreditCard, color: 'text-blue-500 bg-blue-500/10' },
  { value: 'debit_card', label: 'Débito (F3)', icon: CreditCard, color: 'text-indigo-500 bg-indigo-500/10' },
  { value: 'pix', label: 'PIX (F4)', icon: QrCode, color: 'text-cyan-500 bg-cyan-500/10' },
];

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function PDVDialog({ open, onOpenChange, onEmit }: PDVDialogProps) {
  const productsQuery = useProducts();
  const products = productsQuery.data || [];
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [amountPaid, setAmountPaid] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredProducts = search
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.code.toLowerCase().includes(search.toLowerCase()) ||
            p.barcode?.includes(search)
        )
        .slice(0, 8)
    : [];

  const subtotal = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const total = subtotal - discount;
  const change = amountPaid - total;

  useEffect(() => {
    if (open && !showPayment) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [open, showPayment]);

  const addToCart = (product: { id: string; code: string; name: string; sale_price: number; unit: string }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        { productCode: product.code, productName: product.name, productId: product.id, quantity: 1, unitPrice: product.sale_price, unit: product.unit },
        ...prev,
      ];
    });
    setSearch('');
    searchRef.current?.focus();
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

  const handleFinalize = async () => {
    if (cart.length === 0) return;
    setSaving(true);
    const paid = paymentMethod === 'cash' ? amountPaid : total;
    await onEmit({
      items: cart,
      paymentMethod,
      amountPaid: paid,
      discount: discount || undefined,
      customerName: customerName || undefined,
      customerDocument: customerDocument || undefined,
      terminalId: 'PDV-01',
      operatorName: 'Operador Sistema',
    });
    setSaving(false);
    setCart([]);
    setShowPayment(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] p-0 overflow-hidden bg-background">
        <div className="flex h-full">
          {/* Main POS Interface (Left) */}
          <div className="flex-1 flex flex-col border-r bg-muted/10">
            <div className="px-6 py-4 border-b bg-background flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary p-2 rounded-lg text-primary-foreground">
                  <Monitor className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Ponto de Venda</h2>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    <span>Terminal: PDV-01</span>
                    <span className="opacity-30">|</span>
                    <span>Operador: Sistema</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Valor Total</p>
                  <p className="text-2xl font-black text-primary tabular-nums">{fmt(total)}</p>
                </div>
                <DialogClose asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <X className="h-5 w-5" />
                  </Button>
                </DialogClose>
              </div>
            </div>

            {/* Search & Results Area */}
            <div className="p-6 space-y-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  ref={searchRef}
                  placeholder="DIGITE O NOME, CÓDIGO OU BARCODE DO PRODUTO..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-14 h-16 text-xl font-bold border-2 focus-visible:ring-primary/20 bg-background shadow-lg"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    className="flex flex-col text-left p-4 rounded-xl bg-background border hover:border-primary hover:shadow-md transition-all group"
                    onClick={() => addToCart(p)}
                  >
                    <div className="font-bold text-sm line-clamp-1 mb-1">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground mb-3">{p.code}</div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="text-lg font-black text-primary">{fmt(p.sale_price)}</div>
                      <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cart Items List */}
            <ScrollArea className="flex-1 px-6 pb-6">
              <div className="space-y-3">
                {cart.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-3xl opacity-30">
                    <ShoppingCart className="h-16 w-16 mb-4" />
                    <p className="font-bold uppercase tracking-widest text-sm">Aguardando Produtos</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map((item, idx) => (
                      <div key={item.productId} className="flex items-center gap-4 bg-background p-4 rounded-2xl border hover:shadow-sm transition-all animate-in slide-in-from-left-2">
                        <div className="bg-muted w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground font-black">
                          {cart.length - idx}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold">{item.productName}</div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase">{item.productCode} • {fmt(item.unitPrice)}/{item.unit}</div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-3 bg-muted/50 p-1 rounded-xl border">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-background" onClick={() => updateQty(item.productId, -1)}>
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-black">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-background" onClick={() => updateQty(item.productId, 1)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="w-32 text-right">
                            <div className="text-lg font-black tabular-nums">{fmt(item.quantity * item.unitPrice)}</div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-full" onClick={() => removeFromCart(item.productId)}>
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Checkout Side (Right) */}
          <div className="w-[450px] bg-muted/30 p-8 flex flex-col">
            <div className="flex-1 space-y-8">
              {!showPayment ? (
                <>
                  <div className="space-y-1">
                    <h3 className="font-black text-2xl uppercase italic text-primary">Resumo da Venda</h3>
                    <p className="text-xs text-muted-foreground">Confira os valores antes do fechamento</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-muted-foreground font-bold text-xs uppercase">Subtotal</span>
                      <span className="text-xl font-bold tabular-nums">{fmt(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-muted-foreground font-bold text-xs uppercase">Desconto</span>
                      <div className="w-32">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                          <Input 
                            type="number" 
                            value={discount || ''} 
                            onChange={(e) => setDiscount(Number(e.target.value))}
                            className="text-right font-bold h-10 pl-8 bg-background border-2"
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-1 pt-2">
                      <div className="text-muted-foreground font-black text-xs uppercase">Valor Total</div>
                      <div className="text-6xl font-black text-primary tracking-tighter tabular-nums leading-none">
                        {fmt(total)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <Label className="font-bold text-xs uppercase text-muted-foreground">Cliente na Nota (Opcional)</Label>
                    <div className="grid gap-3">
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Nome completo" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="pl-10 h-11 bg-background" />
                      </div>
                      <Input placeholder="CPF ou CNPJ para o cupom" value={customerDocument} onChange={(e) => setCustomerDocument(e.target.value)} className="h-11 bg-background" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-8 animate-in zoom-in-95">
                  <div className="space-y-1">
                    <Button variant="ghost" size="sm" onClick={() => setShowPayment(false)} className="-ml-3 gap-2">
                      <ArrowLeft className="h-4 w-4" /> Voltar ao carrinho
                    </Button>
                    <h3 className="font-black text-2xl uppercase italic text-primary">Pagamento</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {paymentMethods.map((pm) => {
                      const Icon = pm.icon;
                      const active = paymentMethod === pm.value;
                      return (
                        <button
                          key={pm.value}
                          className={cn(
                            "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group",
                            active ? "border-primary bg-primary/10" : "bg-background hover:border-muted-foreground/30"
                          )}
                          onClick={() => setPaymentMethod(pm.value)}
                        >
                          <div className={cn("p-3 rounded-xl transition-colors", active ? pm.color : "bg-muted group-hover:bg-primary/5")}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <div className={cn("font-black uppercase tracking-wider", active ? "text-primary" : "text-muted-foreground")}>
                              {pm.label}
                            </div>
                          </div>
                          {active && <CheckCircle2 className="h-6 w-6 text-primary" />}
                        </button>
                      );
                    })}
                  </div>

                  {paymentMethod === 'cash' && (
                    <div className="space-y-3 bg-background p-6 rounded-2xl border-2 border-success/20 animate-in slide-in-from-bottom-4">
                      <Label className="font-bold text-success uppercase text-xs">Valor em Dinheiro</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-muted-foreground">R$</span>
                        <Input
                          type="number"
                          value={amountPaid || ''}
                          onChange={(e) => setAmountPaid(Number(e.target.value))}
                          className="h-16 pl-14 text-3xl font-black tabular-nums border-none shadow-none focus-visible:ring-0"
                          autoFocus
                        />
                      </div>
                      {amountPaid >= total && (
                        <div className="pt-4 border-t border-success/20 flex items-center justify-between">
                          <span className="font-bold text-success text-sm uppercase">Troco:</span>
                          <span className="text-2xl font-black text-success">{fmt(change)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-6">
              {!showPayment ? (
                <Button 
                  className="w-full h-20 text-xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30"
                  disabled={cart.length === 0}
                  onClick={() => setShowPayment(true)}
                >
                  FECHAR PEDIDO <ChevronRight className="ml-2 h-6 w-6" />
                </Button>
              ) : (
                <Button 
                  className="w-full h-20 text-xl font-black uppercase tracking-[0.2em] bg-success hover:bg-success/90 shadow-2xl shadow-success/30"
                  disabled={saving || (paymentMethod === 'cash' && amountPaid < total)}
                  onClick={handleFinalize}
                >
                  {saving ? (
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 border-4 border-white border-t-transparent rounded-full animate-spin" />
                      EMITINDO...
                    </div>
                  ) : (
                    <>EMITIR NFC-E <Send className="ml-2 h-6 w-6" /></>
                  )}
                </Button>
              )}
              <div className="mt-4 flex items-center justify-center gap-4 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                <span>Esc - Sair</span>
                <span>F10 - Finalizar</span>
                <span>F9 - Limpar</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}