import { useState, useRef, useEffect, useMemo } from 'react';
import { formatBRL } from '@/lib/formatters';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, CreditCard,
  Banknote, QrCode, User, X, CheckCircle2,
  ChevronRight, ArrowLeft, Monitor, Send, Keyboard, ScanLine,
  Camera, CameraOff, Package,
} from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/ui/base/dialog';
import { Separator } from '@/ui/base/separator';
import { Badge } from '@/ui/base/badge';
import { useProducts, type DbProduct } from '@/hooks/inventory/useProducts';
import { ScrollArea } from '@/ui/base/scroll-area';
import { cn } from '@/lib/utils';
import { toSafeNumber } from '@/lib/numericValidation';
import { toastError, toastSuccess } from '@/lib/toastHelpers';

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

type InputMode = 'search' | 'scanner' | 'camera';

const paymentMethods = [
  { value: 'cash', label: 'Dinheiro', hint: 'F1', icon: Banknote, color: 'text-success bg-success/10' },
  { value: 'credit_card', label: 'Crédito', hint: 'F2', icon: CreditCard, color: 'text-blue-500 bg-blue-500/10' },
  { value: 'debit_card', label: 'Débito', hint: 'F3', icon: CreditCard, color: 'text-indigo-500 bg-indigo-500/10' },
  { value: 'pix', label: 'PIX', hint: 'F4', icon: QrCode, color: 'text-cyan-500 bg-cyan-500/10' },
];

export function PDVDialog({ open, onOpenChange, onEmit }: PDVDialogProps) {
  const productsQuery = useProducts();
  const products = useMemo(
    () => (productsQuery.data || []).filter((p) => p.status === 'active'),
    [productsQuery.data],
  );

  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('search');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [amountPaid, setAmountPaid] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanRafRef = useRef<number | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);

  const term = search.trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    if (!term) return products.slice(0, 24);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term) ||
          (p.barcode || '').includes(term),
      )
      .slice(0, 24);
  }, [products, term]);

  const subtotal = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const total = Math.max(0, subtotal - discount);
  const change = amountPaid - total;
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  const addToCart = (product: Pick<DbProduct, 'id' | 'code' | 'name' | 'sale_price' | 'unit'>) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        {
          productCode: product.code,
          productName: product.name,
          productId: product.id,
          quantity: 1,
          unitPrice: product.sale_price,
          unit: product.unit,
        },
        ...prev,
      ];
    });
    setFlashId(product.id);
    window.setTimeout(() => setFlashId((cur) => (cur === product.id ? null : cur)), 350);
  };

  const findByCode = (raw: string): DbProduct | undefined => {
    const val = raw.trim();
    if (!val) return undefined;
    return products.find(
      (p) => p.barcode === val || p.code === val || p.code.toLowerCase() === val.toLowerCase(),
    );
  };

  const handleScanValue = (value: string) => {
    const prod = findByCode(value);
    if (prod) {
      addToCart(prod);
      toastSuccess(`+ ${prod.name}`);
    } else {
      toastError(`Código não encontrado: ${value}`);
    }
  };

  // Auto-focus search when opening
  useEffect(() => {
    if (open && !showPayment && inputMode !== 'camera') {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [open, showPayment, inputMode]);

  // Camera scanning
  const stopCamera = () => {
    if (scanRafRef.current) cancelAnimationFrame(scanRafRef.current);
    scanRafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (inputMode !== 'camera' || !open) {
      stopCamera();
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const BD = (window as any).BarcodeDetector;
        if (!BD) {
          toastError('Câmera de códigos não é suportada neste navegador. Use um leitor USB.');
          setInputMode('scanner');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const detector = new BD({
          formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e'],
        });
        let lastValue = '';
        let lastAt = 0;
        const tick = async () => {
          if (!videoRef.current || cancelled) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes && codes[0]?.rawValue) {
              const v: string = codes[0].rawValue;
              const now = Date.now();
              if (v !== lastValue || now - lastAt > 1500) {
                lastValue = v;
                lastAt = now;
                handleScanValue(v);
              }
            }
          } catch {
            // ignore transient
          }
          scanRafRef.current = requestAnimationFrame(tick);
        };
        scanRafRef.current = requestAnimationFrame(tick);
      } catch {
        toastError('Não foi possível acessar a câmera.');
        setInputMode('scanner');
      }
    })();
    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMode, open]);

  useEffect(() => {
    if (!open) stopCamera();
  }, [open]);

  const flashLine = (productId: string) => {
    setFlashId(productId);
    window.setTimeout(() => setFlashId((cur) => (cur === productId ? null : cur)), 350);
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0),
    );
    flashLine(productId);
  };

  const setQty = (productId: string, value: number) => {
    const v = Math.max(0, Number.isFinite(value) ? value : 0);
    setCart((prev) =>
      v === 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, quantity: v } : i)),
    );
    flashLine(productId);
  };

  const setUnitPrice = (productId: string, value: number) => {
    const v = Math.max(0, Number.isFinite(value) ? value : 0);
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, unitPrice: v } : i)));
    flashLine(productId);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearAll = () => {
    setCart([]);
    setDiscount(0);
    setAmountPaid(0);
    setCustomerName('');
    setCustomerDocument('');
  };

  const handleFinalize = async () => {
    if (cart.length === 0) return;
    setSaving(true);
    const paid = paymentMethod === 'cash' ? amountPaid : total;
    try {
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
      clearAll();
      setShowPayment(false);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F9') { e.preventDefault(); clearAll(); }
      if (e.key === 'F10') { e.preventDefault(); if (!showPayment && cart.length > 0) setShowPayment(true); else if (showPayment) handleFinalize(); }
      if (!showPayment) return;
      if (e.key === 'F1') { e.preventDefault(); setPaymentMethod('cash'); }
      if (e.key === 'F2') { e.preventDefault(); setPaymentMethod('credit_card'); }
      if (e.key === 'F3') { e.preventDefault(); setPaymentMethod('debit_card'); }
      if (e.key === 'F4') { e.preventDefault(); setPaymentMethod('pix'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, showPayment, cart.length]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputMode === 'scanner') {
        if (search.trim()) {
          handleScanValue(search);
          setSearch('');
        }
        return;
      }
      // search mode: add first match
      if (filteredProducts[0]) {
        addToCart(filteredProducts[0]);
        setSearch('');
      }
    }
  };

  const placeholderByMode: Record<InputMode, string> = {
    search: 'Buscar por nome, código ou EAN...',
    scanner: 'Aponte o leitor e pressione ENTER (código será adicionado)...',
    camera: 'Aponte a câmera para o QR Code ou código de barras',
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) stopCamera(); onOpenChange(o); }}>
      <DialogContent className="max-w-[96vw] w-[1400px] h-[92vh] p-0 overflow-hidden bg-background">
        <div className="flex h-full">
          {/* LEFT: catalog + cart */}
          <div className="flex-1 flex flex-col border-r bg-muted/10 min-w-0">
            {/* Header */}
            <div className="px-6 py-3 border-b bg-background flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary p-2 rounded-lg text-primary-foreground">
                  <Monitor className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base leading-tight">Ponto de Venda</h2>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    <span>PDV-01</span>
                    <span className="opacity-30">•</span>
                    <span>Operador Sistema</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="gap-1">
                  <ShoppingCart className="h-3 w-3" /> {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                </Badge>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Total</p>
                  <p className="text-2xl font-black text-primary tabular-nums leading-none">{formatBRL(total)}</p>
                </div>
                <DialogClose asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <X className="h-5 w-5" />
                  </Button>
                </DialogClose>
              </div>
            </div>

            {/* Input mode tabs */}
            <div className="px-6 pt-4">
              <div className="inline-flex bg-muted/60 rounded-lg p-1 gap-1">
                {([
                  { key: 'search', label: 'Busca manual', Icon: Keyboard },
                  { key: 'scanner', label: 'Leitor de código', Icon: ScanLine },
                  { key: 'camera', label: 'Câmera / QR Code', Icon: QrCode },
                ] as const).map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setSearch(''); setInputMode(key); }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                      inputMode === key
                        ? 'bg-background shadow-sm text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input / Camera area */}
            <div className="p-6 pt-3 space-y-4">
              {inputMode !== 'camera' ? (
                <div className="relative group">
                  {inputMode === 'search'
                    ? <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary" />
                    : <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                  }
                  <Input
                    ref={searchRef}
                    placeholder={placeholderByMode[inputMode]}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="pl-12 h-14 text-base font-medium border-2 focus-visible:ring-primary/20 bg-background shadow-sm"
                    inputMode={inputMode === 'scanner' ? 'numeric' : 'text'}
                    autoComplete="off"
                  />
                  {inputMode === 'scanner' && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-muted px-2 py-1 rounded">
                      Enter
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30 bg-black aspect-[16/7]">
                  <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-2/3 h-24 border-2 border-primary/70 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                  </div>
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 text-white text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded">
                    <Camera className="h-3 w-3" /> Escaneando...
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-3 right-3"
                    onClick={() => setInputMode('search')}
                  >
                    <CameraOff className="h-4 w-4 mr-1" /> Parar
                  </Button>
                </div>
              )}

              {/* Product grid (search mode only). Scanner/camera keep the grid too for quick add. */}
              {inputMode !== 'camera' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                      {term ? `Resultados (${filteredProducts.length})` : 'Produtos populares'}
                    </p>
                    {productsQuery.isLoading && (
                      <span className="text-[10px] text-muted-foreground">Carregando...</span>
                    )}
                  </div>
                  {filteredProducts.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Nenhum produto encontrado.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {filteredProducts.map((p) => (
                        <button
                          key={p.id}
                          className="flex flex-col text-left p-3 rounded-xl bg-background border hover:border-primary hover:shadow-md transition-all group"
                          onClick={() => addToCart(p)}
                        >
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <div className="font-semibold text-sm line-clamp-2 leading-tight">{p.name}</div>
                            <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0" />
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono mb-2 truncate">
                            {p.code}{p.barcode ? ` • ${p.barcode}` : ''}
                          </div>
                          <div className="mt-auto flex items-center justify-between">
                            <div className="text-base font-black text-primary tabular-nums">{formatBRL(p.sale_price)}</div>
                            <span className="text-[9px] uppercase text-muted-foreground">{p.unit}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart */}
            <div className="px-6 pb-2 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                Carrinho ({cart.length})
              </p>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs text-muted-foreground gap-1">
                  <Trash2 className="h-3 w-3" /> Limpar
                </Button>
              )}
            </div>
            <ScrollArea className="flex-1 px-6 pb-6">
              {cart.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-2xl opacity-40">
                  <Package className="h-12 w-12 mb-3" />
                  <p className="font-semibold text-sm">Nenhum produto adicionado</p>
                  <p className="text-xs mt-1">Use a busca, o leitor ou a câmera para incluir itens</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item, idx) => (
                    <div
                      key={item.productId}
                      className={cn(
                        'flex items-center gap-3 bg-background p-3 rounded-xl border transition-all animate-in slide-in-from-left-2',
                        flashId === item.productId
                          ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                          : 'hover:border-primary/40',
                      )}
                    >
                      <div className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                        {cart.length - idx}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{item.productName}</div>
                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                          {item.productCode} • {item.unit}
                        </div>
                      </div>

                      {/* Unit price inline edit */}
                      <div className="w-24 shrink-0">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">R$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            value={item.unitPrice}
                            onChange={(e) => setUnitPrice(item.productId, toSafeNumber(e.target.value))}
                            onFocus={(e) => e.currentTarget.select()}
                            className="h-9 pl-7 pr-1 text-right font-bold tabular-nums text-sm"
                          />
                        </div>
                      </div>

                      {/* Quantity: -/input/+ */}
                      <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md bg-background" onClick={() => updateQty(item.productId, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min={0}
                          step="1"
                          value={item.quantity}
                          onChange={(e) => setQty(item.productId, toSafeNumber(e.target.value))}
                          onFocus={(e) => e.currentTarget.select()}
                          className="h-7 w-12 px-1 text-center font-bold tabular-nums border-none shadow-none focus-visible:ring-1 bg-background"
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md bg-background" onClick={() => updateQty(item.productId, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="w-24 text-right shrink-0">
                        <div className="text-[9px] uppercase text-muted-foreground font-bold">Total</div>
                        <div className="font-black tabular-nums text-primary">{formatBRL(item.quantity * item.unitPrice)}</div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full shrink-0" onClick={() => removeFromCart(item.productId)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* RIGHT: checkout */}
          <div className="w-[440px] bg-muted/30 p-8 flex flex-col shrink-0">
            <div className="flex-1 space-y-8">
              {!showPayment ? (
                <>
                  <div className="space-y-1">
                    <h3 className="font-black text-2xl uppercase italic text-primary">Resumo</h3>
                    <p className="text-xs text-muted-foreground">Confira os valores antes do fechamento</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-muted-foreground font-bold text-xs uppercase">Subtotal</span>
                      <span className="text-xl font-bold tabular-nums">{formatBRL(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-muted-foreground font-bold text-xs uppercase">Desconto</span>
                      <div className="w-32">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                          <Input
                            type="number"
                            value={discount || ''}
                            onChange={(e) => setDiscount(toSafeNumber(e.target.value))}
                            className="text-right font-bold h-10 pl-8 bg-background border-2"
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-1 pt-2">
                      <div className="text-muted-foreground font-black text-xs uppercase">Total</div>
                      <div className="text-5xl font-black text-primary tracking-tight tabular-nums leading-none">
                        {formatBRL(total)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="font-bold text-xs uppercase text-muted-foreground">Cliente (opcional)</Label>
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
                      <ArrowLeft className="h-4 w-4" /> Voltar
                    </Button>
                    <h3 className="font-black text-2xl uppercase italic text-primary">Pagamento</h3>
                    <p className="text-sm text-muted-foreground">Total <span className="font-bold text-foreground">{formatBRL(total)}</span></p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {paymentMethods.map((pm) => {
                      const Icon = pm.icon;
                      const active = paymentMethod === pm.value;
                      return (
                        <button
                          key={pm.value}
                          className={cn(
                            'flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left group',
                            active ? 'border-primary bg-primary/10' : 'bg-background hover:border-muted-foreground/30',
                          )}
                          onClick={() => setPaymentMethod(pm.value)}
                        >
                          <div className={cn('p-2 rounded-lg transition-colors', active ? pm.color : 'bg-muted group-hover:bg-primary/5')}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex items-center justify-between w-full">
                            <div className={cn('font-bold text-sm uppercase', active ? 'text-primary' : 'text-foreground')}>
                              {pm.label}
                            </div>
                            {active ? (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            ) : (
                              <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{pm.hint}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {paymentMethod === 'cash' && (
                    <div className="space-y-3 bg-background p-6 rounded-2xl border-2 border-success/20 animate-in slide-in-from-bottom-4">
                      <Label className="font-bold text-success uppercase text-xs">Valor recebido</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-muted-foreground">R$</span>
                        <Input
                          type="number"
                          value={amountPaid || ''}
                          onChange={(e) => setAmountPaid(toSafeNumber(e.target.value))}
                          className="h-16 pl-14 text-3xl font-black tabular-nums border-none shadow-none focus-visible:ring-0"
                          autoFocus
                        />
                      </div>
                      {amountPaid >= total && total > 0 && (
                        <div className="pt-4 border-t border-success/20 flex items-center justify-between">
                          <span className="font-bold text-success text-sm uppercase">Troco</span>
                          <span className="text-2xl font-black text-success">{formatBRL(change)}</span>
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
                  className="w-full h-16 text-base font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30"
                  disabled={cart.length === 0}
                  onClick={() => setShowPayment(true)}
                >
                  Fechar pedido <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button
                  className="w-full h-16 text-base font-black uppercase tracking-[0.2em] bg-success hover:bg-success/90 shadow-2xl shadow-success/30"
                  disabled={saving || (paymentMethod === 'cash' && amountPaid < total)}
                  onClick={handleFinalize}
                >
                  {saving ? (
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 border-4 border-white border-t-transparent rounded-full animate-spin" />
                      Emitindo...
                    </div>
                  ) : (
                    <>Emitir NFC-e <Send className="ml-2 h-5 w-5" /></>
                  )}
                </Button>
              )}
              <div className="mt-4 flex items-center justify-center gap-4 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                <span>Esc sair</span>
                <span>F9 limpar</span>
                <span>F10 finalizar</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
