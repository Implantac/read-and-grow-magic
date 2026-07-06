import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { formatBRL } from '@/lib/formatters';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, CreditCard,
  Banknote, QrCode, User, X, CheckCircle2,
  ChevronRight, ArrowLeft, Monitor, Send, Keyboard, ScanLine,
  Camera, CameraOff, Package, Lock, Unlock, ArrowDownLeft, ArrowUpRight,
  Percent, Wallet, Star, Clock, UserCheck, Loader2, AlertCircle,
  Pause, Play, HandCoins, LayoutGrid,
} from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Dialog, DialogContent, DialogClose } from '@/ui/base/dialog';
import { Separator } from '@/ui/base/separator';
import { Badge } from '@/ui/base/badge';
import { useProducts, type DbProduct } from '@/hooks/inventory/useProducts';
import { useClients, type DbClient, useUpdateClient } from '@/hooks/commercial/useClients';
import { useActiveCategories, hashColor } from '@/hooks/inventory/useCategories';
import { ScrollArea } from '@/ui/base/scroll-area';
import { cn } from '@/lib/utils';
import { toSafeNumber } from '@/lib/numericValidation';
import { toastError, toastSuccess } from '@/lib/toastHelpers';
import { openReceipt } from './pdvReceipt';
import { PDVPixDialog } from './PDVPixDialog';
import { PDVCloseSessionDialog, type CashCloseSummary } from './PDVCloseSessionDialog';
import { PDVParkedDialog } from './PDVParkedDialog';
import { loadParked, parkSale, removeParked, type ParkedSale } from './pdvParkedStorage';

interface CartItem {
  productCode: string;
  productName: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  itemDiscount?: number;
}

interface SplitPayment {
  id: string;
  method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'voucher' | 'credit';
  amount: number;
  installments?: number;
}

interface CashSession {
  operatorName: string;
  terminalId: string;
  openedAt: string;
  openingAmount: number;
  movements: { type: 'sale' | 'sangria' | 'suprimento'; amount: number; at: string; note?: string }[];
}

interface PDVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Renderiza como página (sem overlay/dialog). Padrão: false = modal. */
  asPage?: boolean;
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
  { value: 'cash', label: 'Dinheiro', hint: 'F1', icon: Banknote, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' },
  { value: 'credit_card', label: 'Crédito', hint: 'F2', icon: CreditCard, color: 'text-blue-600 bg-blue-500/10 border-blue-500/30' },
  { value: 'debit_card', label: 'Débito', hint: 'F3', icon: CreditCard, color: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/30' },
  { value: 'pix', label: 'PIX', hint: 'F4', icon: QrCode, color: 'text-cyan-600 bg-cyan-500/10 border-cyan-500/30' },
  { value: 'voucher', label: 'Voucher', hint: 'F5', icon: Wallet, color: 'text-amber-600 bg-amber-500/10 border-amber-500/30' },
  { value: 'credit', label: 'Fiado', hint: 'F6', icon: HandCoins, color: 'text-rose-600 bg-rose-500/10 border-rose-500/30' },
] as const;

const SESSION_KEY = 'pdv:session:v1';
const AUDIT_KEY = 'pdv:audit:v1';

const onlyDigits = (s: string) => (s || '').replace(/\D/g, '');
const maskDoc = (s: string) => {
  const d = onlyDigits(s);
  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d{3})?(\d{3})?(\d{2})?/, (_, a, b, c, e) => [a, b, c, e].filter(Boolean).join('.').replace(/\.(\d{2})$/, '-$1'));
  }
  return d.replace(/(\d{2})(\d{3})?(\d{3})?(\d{4})?(\d{2})?/, (_, a, b, c, d2, e) => {
    let out = a;
    if (b) out += '.' + b;
    if (c) out += '.' + c;
    if (d2) out += '/' + d2;
    if (e) out += '-' + e;
    return out;
  });
};

const logAudit = (event: string, payload: Record<string, unknown> = {}) => {
  try {
    const arr = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    arr.unshift({ event, at: new Date().toISOString(), ...payload });
    localStorage.setItem(AUDIT_KEY, JSON.stringify(arr.slice(0, 500)));
  } catch { /* noop */ }
};

export function PDVDialog({ open, onOpenChange, onEmit, asPage = false }: PDVDialogProps) {
  const productsQuery = useProducts();
  const clientsQuery = useClients();
  const updateClient = useUpdateClient();
  const { categories } = useActiveCategories();
  const products = useMemo(
    () => (productsQuery.data || []).filter((p) => p.status === 'active'),
    [productsQuery.data],
  );
  const clients = useMemo(() => clientsQuery.data || [], [clientsQuery.data]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('search');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'value' | 'percent'>('value');
  const [customer, setCustomer] = useState<DbClient | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerQuery, setCustomerQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [splits, setSplits] = useState<SplitPayment[]>([]);
  const [splitDrafts, setSplitDrafts] = useState<Record<string, string>>({});
  const [installments, setInstallments] = useState(1);
  const [screenLocked, setScreenLocked] = useState(false);

  // Cash session
  const [session, setSession] = useState<CashSession | null>(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  });
  const [showOpenSession, setShowOpenSession] = useState(false);
  const [showCashMovement, setShowCashMovement] = useState<null | 'sangria' | 'suprimento'>(null);
  const [openingAmount, setOpeningAmount] = useState(0);
  const [movementAmount, setMovementAmount] = useState(0);
  const [movementNote, setMovementNote] = useState('');

  // Novos gaps
  const [showPixDialog, setShowPixDialog] = useState<{ splitId: string; amount: number } | null>(null);
  const [showCloseSession, setShowCloseSession] = useState(false);
  const [showParked, setShowParked] = useState(false);
  const [parkedList, setParkedList] = useState<ParkedSale[]>(() => loadParked());
  const refreshParked = useCallback(() => setParkedList(loadParked()), []);

  const searchRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanRafRef = useRef<number | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);

  useEffect(() => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }, [session]);

  // Cash balance in drawer
  const cashBalance = useMemo(() => {
    if (!session) return 0;
    return session.movements.reduce((sum, m) => {
      if (m.type === 'sangria') return sum - m.amount;
      return sum + m.amount;
    }, session.openingAmount);
  }, [session]);

  const term = search.trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategoryId) list = list.filter((p) => p.category_id === selectedCategoryId);
    if (!term) return list.slice(0, 24);
    return list
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term) ||
          (p.barcode || '').includes(term),
      )
      .slice(0, 24);
  }, [products, term, selectedCategoryId]);

  const filteredClients = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return clients.slice(0, 12);
    const digits = onlyDigits(q);
    return clients
      .filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (digits && onlyDigits(c.document || '').includes(digits)) ||
        (c.email || '').toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [clients, customerQuery]);

  const subtotal = cart.reduce((s, i) => s + i.quantity * i.unitPrice - (i.itemDiscount || 0), 0);
  const discountValue = discountType === 'percent'
    ? Math.min(subtotal, (subtotal * discount) / 100)
    : Math.min(subtotal, discount);
  const total = Math.max(0, subtotal - discountValue);
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const paidTotal = splits.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, total - paidTotal);
  const change = Math.max(0, paidTotal - total);
  const loyaltyPoints = customer ? Math.floor(total) : 0;

  const addToCart = useCallback((product: Pick<DbProduct, 'id' | 'code' | 'name' | 'sale_price' | 'unit'>) => {
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
  }, []);

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

  useEffect(() => {
    if (open && !showPayment && inputMode !== 'camera' && !screenLocked) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [open, showPayment, inputMode, screenLocked]);

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
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
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
                lastValue = v; lastAt = now;
                handleScanValue(v);
              }
            }
          } catch { /* transient */ }
          scanRafRef.current = requestAnimationFrame(tick);
        };
        scanRafRef.current = requestAnimationFrame(tick);
      } catch {
        toastError('Não foi possível acessar a câmera.');
        setInputMode('scanner');
      }
    })();
    return () => { cancelled = true; stopCamera(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMode, open]);

  useEffect(() => { if (!open) stopCamera(); }, [open]);

  const flashLine = (productId: string) => {
    setFlashId(productId);
    window.setTimeout(() => setFlashId((cur) => (cur === productId ? null : cur)), 350);
  };

  const MAX_QTY = 9999;
  const MAX_PRICE = 1_000_000;

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.productId !== productId) return i;
          const next = i.quantity + delta;
          return { ...i, quantity: Math.min(MAX_QTY, Math.max(0, next)) };
        })
        .filter((i) => i.quantity > 0),
    );
    flashLine(productId);
  };

  const setQty = (productId: string, raw: number): boolean => {
    if (!Number.isFinite(raw)) { toastError('Quantidade inválida.'); return false; }
    if (raw < 0) { toastError('Quantidade não pode ser negativa.'); return false; }
    if (raw > MAX_QTY) { toastError(`Quantidade máxima por item é ${MAX_QTY}.`); return false; }
    const v = Math.floor(raw * 1000) / 1000;
    setCart((prev) =>
      v === 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, quantity: v } : i)),
    );
    flashLine(productId);
    return true;
  };

  const setUnitPrice = (productId: string, raw: number): boolean => {
    if (!Number.isFinite(raw)) { toastError('Preço inválido.'); return false; }
    if (raw < 0) { toastError('Preço unitário não pode ser negativo.'); return false; }
    if (raw > MAX_PRICE) { toastError('Preço unitário acima do limite permitido.'); return false; }
    const v = Math.round(raw * 100) / 100;
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, unitPrice: v } : i)));
    flashLine(productId);
    return true;
  };

  const removeFromCart = (productId: string) => setCart((prev) => prev.filter((i) => i.productId !== productId));

  const clearAll = () => {
    setCart([]);
    setDiscount(0);
    setSplits([]);
    setCustomer(null);
    setCustomerName('');
    setCustomerDocument('');
    setInstallments(1);
  };

  const applyCustomer = (c: DbClient) => {
    setCustomer(c);
    setCustomerName(c.name);
    setCustomerDocument(c.document || '');
    setShowCustomerPicker(false);
    toastSuccess(`Cliente vinculado: ${c.name}`);
  };

  // Crédito (fiado) disponível para o cliente selecionado
  const availableCredit = useMemo(() => {
    if (!customer) return 0;
    return Math.max(0, (customer.credit_limit || 0) - (customer.current_balance || 0));
  }, [customer]);

  const addSplit = (method: SplitPayment['method']) => {
    const amount = Math.round(remaining * 100) / 100;
    if (amount <= 0) { toastError('Total já foi pago.'); return; }

    if (method === 'credit') {
      if (!customer) { toastError('Selecione um cliente antes de vender no fiado.'); setShowCustomerPicker(true); return; }
      const jaFiado = splits.filter((s) => s.method === 'credit').reduce((s, p) => s + p.amount, 0);
      if (jaFiado + amount > availableCredit + 0.001) {
        toastError(`Crédito insuficiente. Disponível: ${formatBRL(availableCredit - jaFiado)}`);
        return;
      }
    }

    const inst = method === 'credit_card' ? installments : undefined;
    const id = crypto.randomUUID();
    setSplits((prev) => [...prev, { id, method, amount, installments: inst }]);
    if (method === 'pix') setShowPixDialog({ splitId: id, amount });
  };

  // Suspender / retomar cupom
  const suspendSale = () => {
    if (cart.length === 0) { toastError('Carrinho vazio.'); return; }
    parkSale({
      items: cart,
      discount,
      discountType,
      customerId: customer?.id || null,
      customerName: customer?.name || customerName || undefined,
      customerDocument: customerDocument || undefined,
      total,
      label: customer?.name ? `${customer.name} · ${cart.length} itens` : undefined,
    });
    refreshParked();
    clearAll();
    logAudit('sale.suspended', { total, items: cart.length });
    toastSuccess('Cupom suspenso. Retome pelo menu de suspensos.');
  };

  const resumeParked = (id: string) => {
    const p = parkedList.find((x) => x.id === id);
    if (!p) return;
    setCart(p.items);
    setDiscount(p.discount);
    setDiscountType(p.discountType);
    setCustomerName(p.customerName || '');
    setCustomerDocument(p.customerDocument || '');
    const c = clients.find((cl) => cl.id === p.customerId);
    if (c) setCustomer(c);
    removeParked(id); refreshParked(); setShowParked(false);
    toastSuccess('Cupom retomado.');
  };

  const discardParked = (id: string) => { removeParked(id); refreshParked(); };

  const updateSplitAmount = (id: string, raw: number) => {
    if (!Number.isFinite(raw) || raw < 0) return; // silencioso: não bloqueia digitação
    const v = Math.round(raw * 100) / 100;
    setSplits((prev) => prev.map((p) => (p.id === id ? { ...p, amount: v } : p)));
  };

  // Aceita digitação livre (vazio, "12,", "12.5") sem quebrar o input controlado
  const handleSplitAmountChange = (id: string, text: string) => {
    // normaliza vírgula → ponto; aceita apenas dígitos e um separador decimal
    const cleaned = text.replace(',', '.').replace(/[^0-9.]/g, '');
    // impede múltiplos pontos
    const parts = cleaned.split('.');
    const normalized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
    setSplitDrafts((prev) => ({ ...prev, [id]: normalized }));
    if (normalized === '' || normalized === '.') {
      setSplits((prev) => prev.map((p) => (p.id === id ? { ...p, amount: 0 } : p)));
      return;
    }
    const n = Number(normalized);
    if (Number.isFinite(n) && n >= 0) {
      setSplits((prev) => prev.map((p) => (p.id === id ? { ...p, amount: Math.round(n * 100) / 100 } : p)));
    }
  };

  const commitSplitAmount = (id: string) => {
    setSplitDrafts((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const removeSplit = (id: string) => {
    setSplits((prev) => prev.filter((p) => p.id !== id));
    setSplitDrafts((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleFinalize = async () => {
    if (cart.length === 0) return;
    if (!session) { toastError('Abra o caixa antes de finalizar uma venda.'); setShowOpenSession(true); return; }
    if (splits.length === 0) { toastError('Adicione ao menos uma forma de pagamento.'); return; }
    if (paidTotal + 0.001 < total) { toastError('Valor pago insuficiente.'); return; }

    setSaving(true);
    const primary = splits.length === 1 ? splits[0].method : 'multiple';
    // Snapshot para o comprovante (o clearAll limpa o estado depois)
    const receiptSnapshot = {
      items: cart.map((i) => ({
        productCode: i.productCode,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        unit: i.unit,
      })),
      subtotal,
      discount: discountValue,
      total,
      paid: paidTotal,
      change,
      splits: splits.map((s) => ({ method: s.method, amount: s.amount, installments: s.installments })),
      customerName: customerName || undefined,
      customerDocument: customerDocument || undefined,
      loyaltyPoints,
      terminalId: session.terminalId,
      operatorName: session.operatorName,
    };
    try {
      const emitResult = await onEmit({
        items: cart,
        paymentMethod: primary,
        amountPaid: paidTotal,
        discount: discountValue || undefined,
        customerName: customerName || undefined,
        customerDocument: customerDocument || undefined,
        terminalId: session.terminalId,
        operatorName: session.operatorName,
      });
      // Update cash drawer: only cash portion affects the drawer
      const cashPortion = splits.filter((s) => s.method === 'cash').reduce((s, p) => s + Math.min(p.amount, total), 0);
      setSession((prev) => prev ? {
        ...prev,
        movements: [...prev.movements, { type: 'sale', amount: cashPortion, at: new Date().toISOString(), note: `Venda ${formatBRL(total)}` }],
      } : prev);
      // Fiado: debita do saldo do cliente (current_balance sobe = dívida cresce)
      const fiadoAmount = splits.filter((s) => s.method === 'credit').reduce((s, p) => s + p.amount, 0);
      if (fiadoAmount > 0 && customer) {
        try {
          await updateClient.mutateAsync({
            id: customer.id,
            current_balance: Math.round(((customer.current_balance || 0) + fiadoAmount) * 100) / 100,
          });
        } catch { toastError('Falha ao debitar fiado do cliente.'); }
      }
      logAudit('sale.finalized', { total, methods: splits.map((s) => s.method), customer: customer?.id, fiado: fiadoAmount });

      // Emissão do comprovante (PDF + impressão) em nova janela
      const emitData = (emitResult ?? {}) as { number?: string; accessKey?: string; protocol?: string };
      const printed = openReceipt({
        ...receiptSnapshot,
        issuedAt: new Date(),
        saleNumber: emitData.number,
        accessKey: emitData.accessKey,
        authorizationProtocol: emitData.protocol,
      });
      if (!printed) {
        toastError('Popup bloqueado: libere a janela para imprimir o comprovante.');
      }

      clearAll();
      setShowPayment(false);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!open || screenLocked) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && ['INPUT', 'TEXTAREA'].includes(target.tagName);
      if (e.key === 'Escape' && !typing && !showPayment && search) { e.preventDefault(); setSearch(''); return; }
      if (e.key === 'F9' && !typing) { e.preventDefault(); clearAll(); }
      if (e.key === 'F10') { e.preventDefault(); if (!showPayment && cart.length > 0) setShowPayment(true); else if (showPayment) handleFinalize(); }
      if (e.key === 'F12') { e.preventDefault(); setScreenLocked(true); }
      if (e.key === 'F7' && !typing && cart.length > 0) { e.preventDefault(); suspendSale(); }
      if (e.key === 'F8' && !typing) { e.preventDefault(); setShowParked(true); }
      if (!showPayment) return;
      if (e.key === 'F1') { e.preventDefault(); addSplit('cash'); }
      if (e.key === 'F2') { e.preventDefault(); addSplit('credit_card'); }
      if (e.key === 'F3') { e.preventDefault(); addSplit('debit_card'); }
      if (e.key === 'F4') { e.preventDefault(); addSplit('pix'); }
      if (e.key === 'F5') { e.preventDefault(); addSplit('voucher'); }
      if (e.key === 'F6') { e.preventDefault(); addSplit('credit'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, showPayment, cart.length, screenLocked, remaining, installments]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputMode === 'scanner') {
        if (search.trim()) { handleScanValue(search); setSearch(''); }
        return;
      }
      if (filteredProducts[0]) { addToCart(filteredProducts[0]); setSearch(''); }
    }
  };

  const placeholderByMode: Record<InputMode, string> = {
    search: 'Buscar por nome, código ou EAN...',
    scanner: 'Aponte o leitor e pressione ENTER',
    camera: 'Aponte a câmera para o QR Code ou código de barras',
  };

  const openSession = () => {
    if (openingAmount < 0) { toastError('Valor de abertura inválido.'); return; }
    const s: CashSession = {
      operatorName: 'Operador Sistema',
      terminalId: 'PDV-01',
      openedAt: new Date().toISOString(),
      openingAmount: Math.round(openingAmount * 100) / 100,
      movements: [],
    };
    setSession(s);
    setShowOpenSession(false);
    setOpeningAmount(0);
    logAudit('session.open', { openingAmount: s.openingAmount });
    toastSuccess('Caixa aberto com sucesso.');
  };

  // Fechamento com contagem cega
  const closeSessionSummary: CashCloseSummary | null = useMemo(() => {
    if (!session) return null;
    const sales = session.movements.filter((m) => m.type === 'sale');
    const sangria = session.movements.filter((m) => m.type === 'sangria').reduce((s, m) => s + m.amount, 0);
    const suprimento = session.movements.filter((m) => m.type === 'suprimento').reduce((s, m) => s + m.amount, 0);
    const totalSales = sales.reduce((s, m) => s + m.amount, 0);
    return {
      operatorName: session.operatorName,
      terminalId: session.terminalId,
      openedAt: session.openedAt,
      openingAmount: session.openingAmount,
      totalSales,
      salesCount: sales.length,
      sangria,
      suprimento,
      expectedCash: cashBalance,
    };
  }, [session, cashBalance]);

  const requestCloseSession = () => {
    if (!session) return;
    setShowCloseSession(true);
  };

  const confirmCloseSession = (result: { countedAmount: number; difference: number }) => {
    if (!session) return;
    logAudit('session.close', {
      closingBalance: cashBalance,
      counted: result.countedAmount,
      difference: result.difference,
      movements: session.movements.length,
    });
    setSession(null);
    setShowCloseSession(false);
    toastSuccess(
      Math.abs(result.difference) < 0.005
        ? 'Caixa fechado sem divergência.'
        : `Caixa fechado com ${result.difference > 0 ? 'sobra' : 'falta'} de ${formatBRL(Math.abs(result.difference))}.`,
    );
  };

  const registerMovement = () => {
    if (!showCashMovement || !session) return;
    if (movementAmount <= 0) { toastError('Valor deve ser maior que zero.'); return; }
    if (showCashMovement === 'sangria' && movementAmount > cashBalance) {
      toastError('Sangria maior que o saldo em caixa.'); return;
    }
    setSession({
      ...session,
      movements: [...session.movements, {
        type: showCashMovement,
        amount: Math.round(movementAmount * 100) / 100,
        at: new Date().toISOString(),
        note: movementNote.trim() || undefined,
      }],
    });
    logAudit(`cash.${showCashMovement}`, { amount: movementAmount, note: movementNote });
    toastSuccess(`${showCashMovement === 'sangria' ? 'Sangria' : 'Suprimento'} registrado.`);
    setShowCashMovement(null);
    setMovementAmount(0);
    setMovementNote('');
  };

  const sessionElapsed = session
    ? Math.floor((Date.now() - new Date(session.openedAt).getTime()) / 60000)
    : 0;

  const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (asPage) {
      return (
        <div className="relative w-full h-[calc(100dvh-13rem)] min-h-[560px] max-h-[calc(100dvh-8rem)] rounded-lg border bg-background overflow-hidden shadow-sm">
          {children}
        </div>
      );
    }
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) stopCamera(); onOpenChange(o); }}>
        <DialogContent className="max-w-[98vw] w-[1500px] h-[94vh] p-0 overflow-hidden bg-background gap-0">
          {children}
        </DialogContent>
      </Dialog>
    );
  };

  if (!asPage && !open) return null;

  return (
    <Shell>
      <>
        {/* Lock overlay */}
        {screenLocked && (
          <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center gap-6">
            <Lock className="h-16 w-16 text-primary" />
            <div className="text-center">
              <p className="text-2xl font-black uppercase tracking-widest">PDV Bloqueado</p>
              <p className="text-sm text-muted-foreground mt-2">Aguardando reautenticação do operador</p>
            </div>
            <Button size="lg" onClick={() => setScreenLocked(false)} className="gap-2">
              <Unlock className="h-4 w-4" /> Desbloquear
            </Button>
          </div>
        )}

        <div className="flex flex-col h-full">
          {/* TOP BAR: session + operator */}
          <div className="min-h-14 border-b bg-gradient-to-r from-primary/5 via-background to-primary/5 px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary p-1.5 rounded-md text-primary-foreground">
                  <Monitor className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold leading-none">Terminal</div>
                  <div className="font-black text-sm leading-tight">PDV-01 · Loja Matriz</div>
                </div>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="flex items-center gap-2">
                <div className={cn(
                  'h-2 w-2 rounded-full',
                  session ? 'bg-emerald-500 animate-pulse' : 'bg-red-500',
                )} />
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold leading-none">
                    {session ? 'Caixa aberto' : 'Caixa fechado'}
                  </div>
                  <div className="text-xs font-semibold leading-tight">
                    {session ? (
                      <>Saldo <span className="tabular-nums font-bold text-primary">{formatBRL(cashBalance)}</span> · <Clock className="inline h-3 w-3 -mt-0.5" /> {sessionElapsed}min</>
                    ) : 'Abra o caixa para iniciar as vendas'}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {session ? (
                <>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setShowCashMovement('suprimento')}>
                    <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" /> Suprimento
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setShowCashMovement('sangria')}>
                    <ArrowUpRight className="h-3.5 w-3.5 text-red-600" /> Sangria
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setScreenLocked(true)}>
                    <Lock className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-destructive" onClick={requestCloseSession}>
                    Fechar caixa
                  </Button>
                </>
              ) : (
                <Button size="sm" className="h-8 gap-1.5" onClick={() => setShowOpenSession(true)}>
                  <Unlock className="h-3.5 w-3.5" /> Abrir caixa
                </Button>
              )}
              <Separator orientation="vertical" className="h-6 mx-1" />
              <div className="flex items-center gap-2 text-xs">
                <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">OS</div>
                <div className="leading-tight">
                  <div className="font-bold">Operador Sistema</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Caixa</div>
                </div>
              </div>
              {!asPage && (
                <DialogClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <X className="h-4 w-4" />
                  </Button>
                </DialogClose>
              )}
            </div>
          </div>

          {/* MAIN */}
          <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
            {/* LEFT: catalog + cart */}
            <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r bg-muted/10 min-w-0 min-h-0">

              {/* Input mode tabs */}
              <div className="px-6 pt-4 flex items-center justify-between">
                <div className="inline-flex bg-muted/60 rounded-lg p-1 gap-1">
                  {([
                    { key: 'search', label: 'Busca manual', Icon: Keyboard },
                    { key: 'scanner', label: 'Leitor', Icon: ScanLine },
                    { key: 'camera', label: 'Câmera / QR', Icon: QrCode },
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
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </button>
                  ))}
                </div>
                <Badge variant="secondary" className="gap-1 h-7">
                  <Package className="h-3 w-3" /> {products.length} produtos
                </Badge>
              </div>

              {/* Input / Camera area */}
              <div className="px-6 pt-3">
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
                      className="pl-12 h-12 text-base font-medium border-2 focus-visible:ring-primary/20 bg-background shadow-sm"
                      inputMode={inputMode === 'scanner' ? 'numeric' : 'text'}
                      autoComplete="off"
                    />
                    {inputMode === 'scanner' && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-muted px-2 py-1 rounded">Enter</div>
                    )}
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30 bg-black aspect-[16/6]">
                    <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-2/3 h-24 border-2 border-primary/70 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                    </div>
                    <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 text-white text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded">
                      <Camera className="h-3 w-3" /> Escaneando...
                    </div>
                    <Button variant="secondary" size="sm" className="absolute top-3 right-3" onClick={() => setInputMode('search')}>
                      <CameraOff className="h-4 w-4 mr-1" /> Parar
                    </Button>
                  </div>
                )}
              </div>

              {/* Category tabs */}
              {inputMode !== 'camera' && categories.length > 0 && (
                <div className="px-6 pt-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                    <button
                      onClick={() => setSelectedCategoryId(null)}
                      className={cn(
                        'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border-2',
                        !selectedCategoryId
                          ? 'bg-primary text-primary-foreground border-primary shadow-md'
                          : 'bg-background border-transparent hover:border-primary/30 text-muted-foreground',
                      )}
                    >
                      <LayoutGrid className="h-3 w-3" /> Todas
                    </button>
                    {categories.map((cat) => {
                      const c = cat.color || hashColor(cat.name);
                      const active = selectedCategoryId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategoryId(cat.id)}
                          style={active ? { backgroundColor: c, borderColor: c, color: '#fff' } : { borderColor: `${c}55` }}
                          className={cn(
                            'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border-2',
                            !active && 'bg-background hover:brightness-95',
                          )}
                        >
                          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: active ? '#fff' : c }} />
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Product grid */}
              {inputMode !== 'camera' && (
                <div className="px-6 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                      {term ? `Resultados (${filteredProducts.length})` : 'Sugestões rápidas'}
                    </p>
                    {productsQuery.isLoading && <span className="text-[10px] text-muted-foreground">Carregando...</span>}
                  </div>
                  {filteredProducts.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</div>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {filteredProducts.slice(0, 12).map((p) => (
                        <button
                          key={p.id}
                          className="flex flex-col text-left p-2.5 rounded-lg bg-background border hover:border-primary hover:shadow-md transition-all group"
                          onClick={() => addToCart(p)}
                        >
                          <div className="font-semibold text-xs line-clamp-2 leading-tight mb-1 min-h-[2rem]">{p.name}</div>
                          <div className="text-[9px] text-muted-foreground font-mono mb-1 truncate">{p.code}</div>
                          <div className="mt-auto flex items-center justify-between">
                            <div className="text-sm font-black text-primary tabular-nums">{formatBRL(p.sale_price)}</div>
                            <span className="text-[9px] uppercase text-muted-foreground">{p.unit}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Cart header */}
              <div className="px-6 pt-4 pb-2 flex items-center justify-between border-t mt-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  <p className="text-xs uppercase tracking-widest text-foreground font-black">
                    Carrinho · {cart.length} {cart.length === 1 ? 'item' : 'itens'}
                  </p>
                  <Badge variant="outline" className="h-5 text-[10px]">{totalItems} un.</Badge>
                </div>
                {cart.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={suspendSale} className="h-7 text-xs text-amber-600 gap-1" title="Suspender cupom (F7)">
                      <Pause className="h-3 w-3" /> Suspender
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs text-muted-foreground gap-1">
                      <Trash2 className="h-3 w-3" /> Limpar (F9)
                    </Button>
                  </div>
                )}
                {cart.length === 0 && parkedList.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setShowParked(true)} className="h-7 text-xs gap-1 border-amber-500/40 text-amber-700">
                    <Play className="h-3 w-3" /> Retomar ({parkedList.length})
                  </Button>
                )}
              </div>
              <ScrollArea className="flex-1 px-6 pb-4">
                {cart.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-2xl opacity-40">
                    <Package className="h-10 w-10 mb-2" />
                    <p className="font-semibold text-sm">Nenhum produto adicionado</p>
                    <p className="text-xs mt-1">Use busca, leitor ou câmera para incluir itens</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {cart.map((item, idx) => (
                      <div
                        key={item.productId}
                        className={cn(
                          'flex items-center gap-3 bg-background p-2.5 rounded-lg border transition-all animate-in slide-in-from-left-2',
                          flashId === item.productId
                            ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                            : 'hover:border-primary/40',
                        )}
                      >
                        <div className="bg-primary/10 text-primary w-7 h-7 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0">
                          {cart.length - idx}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate text-sm">{item.productName}</div>
                          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                            {item.productCode} · {item.unit}
                          </div>
                        </div>

                        <div className="w-24 shrink-0">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground">R$</span>
                            <Input
                              type="number" step="0.01" min={0} value={item.unitPrice}
                              onChange={(e) => setUnitPrice(item.productId, toSafeNumber(e.target.value))}
                              onFocus={(e) => e.currentTarget.select()}
                              className="h-8 pl-7 pr-1 text-right font-bold tabular-nums text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-md shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded bg-background" onClick={() => updateQty(item.productId, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number" min={0} step="1" value={item.quantity}
                            onChange={(e) => setQty(item.productId, toSafeNumber(e.target.value))}
                            onFocus={(e) => e.currentTarget.select()}
                            className="h-7 w-12 px-1 text-center font-bold tabular-nums border-none shadow-none focus-visible:ring-1 bg-background"
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded bg-background" onClick={() => updateQty(item.productId, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="w-24 text-right shrink-0">
                          <div className="text-[9px] uppercase text-muted-foreground font-bold">Total</div>
                          <div className="font-black tabular-nums text-primary text-sm">{formatBRL(item.quantity * item.unitPrice)}</div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-full shrink-0" onClick={() => removeFromCart(item.productId)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* RIGHT: checkout */}
            <div className="w-full lg:w-[400px] xl:w-[460px] bg-muted/30 flex flex-col shrink-0 min-h-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {!showPayment ? (
                  <>
                    {/* Customer card */}
                    <div className="rounded-xl bg-background border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-black text-xs uppercase tracking-widest text-muted-foreground">Cliente</Label>
                        {customer && (
                          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => { setCustomer(null); setCustomerName(''); setCustomerDocument(''); }}>
                            Remover
                          </Button>
                        )}
                      </div>
                      {customer ? (
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                              <UserCheck className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm truncate">{customer.name}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">{maskDoc(customer.document || '')}</div>
                            </div>
                            {customer.abc_classification && (
                              <Badge variant="secondary" className="text-[9px] h-5">Cliente {customer.abc_classification}</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                            <div>
                              <div className="text-[9px] uppercase font-bold text-muted-foreground">Ticket médio</div>
                              <div className="text-xs font-bold tabular-nums">{formatBRL(customer.avg_ticket || 0)}</div>
                            </div>
                            <div>
                              <div className="text-[9px] uppercase font-bold text-muted-foreground">Compras</div>
                              <div className="text-xs font-bold tabular-nums">{customer.total_purchases || 0}</div>
                            </div>
                            <div>
                              <div className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-0.5"><Star className="h-2.5 w-2.5" />Pontos</div>
                              <div className="text-xs font-bold tabular-nums text-amber-600">+{loyaltyPoints}</div>
                            </div>
                          </div>
                          {(customer.credit_limit || 0) > 0 && (
                            <div className="mt-2 rounded-md bg-rose-500/5 border border-rose-500/20 p-2 flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-700 uppercase tracking-widest">
                                <HandCoins className="h-3 w-3" /> Crédito p/ fiado
                              </div>
                              <div className="text-xs font-black tabular-nums text-rose-700">{formatBRL(availableCredit)}</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Button variant="outline" className="w-full h-11 gap-2" onClick={() => setShowCustomerPicker(true)}>
                          <User className="h-4 w-4" /> Identificar cliente
                        </Button>
                      )}
                      {!customer && (
                        <div className="grid gap-2">
                          <Input placeholder="CPF/CNPJ no cupom (opcional)" value={customerDocument} onChange={(e) => setCustomerDocument(maskDoc(e.target.value))} className="h-10 bg-background" />
                        </div>
                      )}
                    </div>

                    {/* Totals */}
                    <div className="rounded-xl bg-background border p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-bold text-xs uppercase">Subtotal</span>
                        <span className="text-lg font-bold tabular-nums">{formatBRL(subtotal)}</span>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-muted-foreground font-bold text-xs uppercase">Desconto</span>
                          <div className="inline-flex bg-muted/60 rounded p-0.5">
                            <button
                              className={cn('px-2 py-0.5 text-[10px] font-bold rounded', discountType === 'value' ? 'bg-background shadow-sm' : 'text-muted-foreground')}
                              onClick={() => setDiscountType('value')}
                            >R$</button>
                            <button
                              className={cn('px-2 py-0.5 text-[10px] font-bold rounded', discountType === 'percent' ? 'bg-background shadow-sm' : 'text-muted-foreground')}
                              onClick={() => setDiscountType('percent')}
                            >%</button>
                          </div>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                            {discountType === 'value' ? 'R$' : <Percent className="h-3 w-3" />}
                          </span>
                          <Input
                            type="number" min={0} step="0.01"
                            value={discount || ''}
                            onChange={(e) => {
                              const v = toSafeNumber(e.target.value);
                              if (!Number.isFinite(v) || v < 0) { toastError('Desconto inválido.'); return; }
                              if (discountType === 'percent' && v > 100) { toastError('Desconto máximo 100%.'); return; }
                              if (discountType === 'value' && v > subtotal) { toastError('Desconto maior que subtotal.'); setDiscount(subtotal); return; }
                              setDiscount(Math.round(v * 100) / 100);
                            }}
                            className="text-right font-bold h-10 pl-8 bg-background"
                            placeholder="0,00"
                          />
                        </div>
                        {discountValue > 0 && (
                          <div className="text-right text-[10px] text-emerald-600 font-bold mt-1">− {formatBRL(discountValue)}</div>
                        )}
                      </div>
                      <Separator />
                      <div className="space-y-0.5">
                        <div className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">Total a pagar</div>
                        <div className="text-4xl font-black text-primary tracking-tight tabular-nums leading-none">
                          {formatBRL(total)}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-5 animate-in zoom-in-95">
                    <Button variant="ghost" size="sm" onClick={() => setShowPayment(false)} className="-ml-3 gap-2">
                      <ArrowLeft className="h-4 w-4" /> Voltar ao resumo
                    </Button>

                    {/* Payment status */}
                    <div className="rounded-xl bg-background border-2 border-primary/20 p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Total</span>
                        <span className="text-lg font-bold tabular-nums">{formatBRL(total)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Pago</span>
                        <span className="text-lg font-bold tabular-nums text-emerald-600">{formatBRL(paidTotal)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">
                          {remaining > 0 ? 'Restante' : change > 0 ? 'Troco' : 'Pago integralmente'}
                        </span>
                        <span className={cn(
                          'text-2xl font-black tabular-nums',
                          remaining > 0 ? 'text-primary' : 'text-emerald-600',
                        )}>
                          {remaining > 0 ? formatBRL(remaining) : formatBRL(change)}
                        </span>
                      </div>
                      {remaining > 0 && (
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, (paidTotal / total) * 100)}%` }} />
                        </div>
                      )}
                    </div>

                    {/* Installments for credit */}
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Parcelas (crédito)</Label>
                      <div className="grid grid-cols-6 gap-1">
                        {[1, 2, 3, 4, 6, 12].map((n) => (
                          <button
                            key={n}
                            onClick={() => setInstallments(n)}
                            className={cn(
                              'h-9 rounded text-xs font-bold border-2 transition-all',
                              installments === n ? 'border-primary bg-primary/10 text-primary' : 'bg-background hover:border-primary/40',
                            )}
                          >{n}x</button>
                        ))}
                      </div>
                    </div>

                    {/* Payment method buttons */}
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Formas de pagamento</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {paymentMethods.map((pm) => {
                          const Icon = pm.icon;
                          return (
                            <button
                              key={pm.value}
                              disabled={remaining <= 0}
                              onClick={() => addSplit(pm.value as SplitPayment['method'])}
                              className={cn(
                                'flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left group',
                                remaining <= 0 ? 'opacity-40 cursor-not-allowed bg-background' : `bg-background hover:${pm.color}`,
                              )}
                            >
                              <div className={cn('p-1.5 rounded', pm.color)}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="font-bold text-xs uppercase">{pm.label}</div>
                                <div className="text-[9px] text-muted-foreground font-bold">{pm.hint}</div>
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Splits list */}
                    {splits.length > 0 && (
                      <div className="space-y-2">
                        <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Pagamentos aplicados</Label>
                        <div className="space-y-1.5">
                          {splits.map((s) => {
                            const meta = paymentMethods.find((pm) => pm.value === s.method)!;
                            const Icon = meta.icon;
                            return (
                              <div key={s.id} className="flex items-center gap-2 bg-background p-2 rounded-lg border">
                                <div className={cn('p-1.5 rounded', meta.color)}>
                                  <Icon className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-bold text-xs">{meta.label}{s.installments && s.installments > 1 ? ` · ${s.installments}x` : ''}</div>
                                  {s.method === 'credit_card' && s.installments && s.installments > 1 && (
                                    <div className="text-[9px] text-muted-foreground">{formatBRL(s.amount / s.installments)} / parcela</div>
                                  )}
                                </div>
                                <div className="relative w-28">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">R$</span>
                                  <Input
                                    type="number" step="0.01" min={0} value={s.amount}
                                    onChange={(e) => updateSplitAmount(s.id, toSafeNumber(e.target.value))}
                                    onFocus={(e) => e.currentTarget.select()}
                                    className="h-8 pl-7 pr-1 text-right font-bold tabular-nums text-xs"
                                  />
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSplit(s.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sticky footer */}
              <div className="border-t bg-background/80 backdrop-blur p-4 shrink-0">
                {!showPayment ? (
                  <Button
                    className="w-full h-14 text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30"
                    disabled={cart.length === 0 || !session}
                    onClick={() => setShowPayment(true)}
                  >
                    {!session ? (
                      <><AlertCircle className="h-4 w-4 mr-2" /> Abra o caixa para continuar</>
                    ) : (
                      <>Ir para pagamento <ChevronRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full h-14 text-sm font-black uppercase tracking-[0.2em] bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-500/30"
                    disabled={saving || remaining > 0.001 || cart.length === 0}
                    onClick={handleFinalize}
                  >
                    {saving ? (
                      <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Emitindo NFC-e...</div>
                    ) : (
                      <>Finalizar venda <Send className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                )}
                <div className="mt-3 flex items-center justify-center gap-3 text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex-wrap">
                  <span>F1 Dinh</span><span>F2 Créd</span><span>F3 Déb</span><span>F4 PIX</span><span>F5 Voucher</span><span>F6 Fiado</span>
                  <span className="opacity-40">|</span>
                  <span>F7 Suspender</span><span>F8 Retomar</span><span>F9 Limpar</span><span>F10 Finalizar</span><span>F12 Bloq</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Open session dialog */}
        {showOpenSession && (
          <div className="absolute inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowOpenSession(false)}>
            <div className="bg-background border-2 rounded-2xl p-6 w-96 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-lg"><Unlock className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-black text-lg">Abertura de caixa</h3>
                  <p className="text-xs text-muted-foreground">Informe o troco inicial em dinheiro.</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Valor de abertura</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">R$</span>
                  <Input
                    type="number" step="0.01" min={0} value={openingAmount || ''}
                    onChange={(e) => setOpeningAmount(toSafeNumber(e.target.value))}
                    className="pl-10 h-12 text-lg font-bold tabular-nums" autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setShowOpenSession(false)}>Cancelar</Button>
                <Button onClick={openSession} className="gap-2"><Unlock className="h-4 w-4" /> Abrir caixa</Button>
              </div>
            </div>
          </div>
        )}

        {/* Cash movement dialog */}
        {showCashMovement && (
          <div className="absolute inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowCashMovement(null)}>
            <div className="bg-background border-2 rounded-2xl p-6 w-96 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className={cn('p-2.5 rounded-lg', showCashMovement === 'sangria' ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600')}>
                  {showCashMovement === 'sangria' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-black text-lg capitalize">{showCashMovement}</h3>
                  <p className="text-xs text-muted-foreground">
                    {showCashMovement === 'sangria' ? 'Retirar dinheiro do caixa' : 'Adicionar dinheiro ao caixa'}
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase">Saldo atual</span>
                <span className="font-black tabular-nums text-primary">{formatBRL(cashBalance)}</span>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Valor</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">R$</span>
                  <Input
                    type="number" step="0.01" min={0} value={movementAmount || ''}
                    onChange={(e) => setMovementAmount(toSafeNumber(e.target.value))}
                    className="pl-10 h-12 text-lg font-bold tabular-nums" autoFocus
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Observação (opcional)</Label>
                <Input value={movementNote} onChange={(e) => setMovementNote(e.target.value)} placeholder="Motivo da movimentação" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setShowCashMovement(null)}>Cancelar</Button>
                <Button onClick={registerMovement}>Confirmar</Button>
              </div>
            </div>
          </div>
        )}

        {/* Customer picker dialog */}
        {showCustomerPicker && (
          <div className="absolute inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowCustomerPicker(false)}>
            <div className="bg-background border-2 rounded-2xl p-6 w-[520px] max-h-[70vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-primary/10 text-primary rounded-lg"><User className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-black text-lg">Identificar cliente</h3>
                  <p className="text-xs text-muted-foreground">Busque por nome, CPF/CNPJ ou email.</p>
                </div>
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  autoFocus placeholder="Buscar cliente..." value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  className="pl-9 h-11"
                />
              </div>
              <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="space-y-1">
                  {filteredClients.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">Nenhum cliente encontrado.</div>
                  ) : filteredClients.map((c) => (
                    <button
                      key={c.id}
                      className="w-full text-left p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all"
                      onClick={() => applyCustomer(c)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate">{c.name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground truncate">
                            {maskDoc(c.document || '')} {c.email ? `· ${c.email}` : ''}
                          </div>
                        </div>
                        {c.abc_classification && (
                          <Badge variant="secondary" className="text-[9px]">{c.abc_classification}</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* PIX QR dialog */}
        <PDVPixDialog
          open={!!showPixDialog}
          amount={showPixDialog?.amount || 0}
          onConfirm={() => setShowPixDialog(null)}
          onCancel={() => {
            if (showPixDialog) removeSplit(showPixDialog.splitId);
            setShowPixDialog(null);
          }}
        />

        {/* Blind cash close */}
        <PDVCloseSessionDialog
          open={showCloseSession}
          summary={closeSessionSummary}
          onCancel={() => setShowCloseSession(false)}
          onClose={confirmCloseSession}
        />

        {/* Parked sales */}
        <PDVParkedDialog
          open={showParked}
          parked={parkedList}
          onClose={() => setShowParked(false)}
          onResume={resumeParked}
          onDelete={discardParked}
        />
      </>
    </Shell>

  );
}
