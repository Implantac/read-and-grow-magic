import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { formatBRL } from '@/lib/formatters';
import {
  Trash2, ShoppingCart, ChevronRight, Send, Package, Lock, Unlock,
  Loader2, AlertCircle, Pause, Play,
} from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Dialog, DialogContent } from '@/ui/base/dialog';
import { Badge } from '@/ui/base/badge';
import { useProducts } from '@/hooks/inventory/useProducts';
import { useClients, type DbClient, useUpdateClient } from '@/hooks/commercial/useClients';
import { useActiveCategories } from '@/hooks/inventory/useCategories';
import { toastError, toastSuccess } from '@/lib/toastHelpers';

import { PDVPixDialog } from './PDVPixDialog';
import { PDVCloseSessionDialog } from './PDVCloseSessionDialog';
import { PDVParkedDialog } from './PDVParkedDialog';
import { parkSale } from './pdvParkedStorage';
import { PDVCustomerCard } from './pdv/PDVCustomerCard';
import { PDVCustomerPicker } from './pdv/PDVCustomerPicker';
import { PDVPaymentPanel } from './pdv/PDVPaymentPanel';
import { PDVFinalizeConfirmDialog } from './pdv/PDVFinalizeConfirmDialog';
import { PDVSessionBar } from './pdv/PDVSessionBar';
import { PDVOpenSessionDialog, PDVCashMovementDialog } from './pdv/PDVCashDialogs';
import { PDVCatalogPanel } from './pdv/PDVCatalogPanel';
import { PDVCartLines } from './pdv/PDVCartLines';
import { PDVTotalsCard } from './pdv/PDVTotalsCard';
import { usePDVCashSession, logAudit } from './pdv/usePDVCashSession';
import { useBarcodeCameraScanner } from './pdv/useBarcodeCameraScanner';
import { usePDVCart } from './pdv/usePDVCart';
import { usePDVSplits } from './pdv/usePDVSplits';
import { usePDVParked } from './pdv/usePDVParked';
import { usePDVShortcuts } from './pdv/usePDVShortcuts';
import { usePDVProductFilter, usePDVClientFilter } from './pdv/usePDVFilters';
import { usePDVFinalize } from './pdv/usePDVFinalize';
import { onlyDigits } from './pdv/types';

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

  const cartApi = usePDVCart(products);
  const {
    cart, setCart, discount, setDiscount, discountType, setDiscountType,
    flashId, addToCart, findByCode,
    updateQty, setQty, setUnitPrice, removeFromCart,
    subtotal, discountValue, total, totalItems, resetCart,
  } = cartApi;

  const [search, setSearch] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('search');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<DbClient | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerQuery, setCustomerQuery] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [screenLocked, setScreenLocked] = useState(false);
  const [showPixDialog, setShowPixDialog] = useState<{ splitId: string; amount: number } | null>(null);

  const {
    splits, setSplits, splitDrafts, installments, setInstallments,
    paidTotal, remaining, change, availableCredit,
    addSplit, handleSplitAmountChange, commitSplitAmount, removeSplit, resetSplits,
  } = usePDVSplits({
    total,
    customer,
    onRequestCustomer: () => setShowCustomerPicker(true),
    onOpenPix: (p) => setShowPixDialog(p),
  });

  const {
    session, setSession,
    cashBalance, sessionElapsed,
    showOpenSession, setShowOpenSession,
    showCashMovement, setShowCashMovement,
    openingAmount, setOpeningAmount,
    movementAmount, setMovementAmount,
    movementNote, setMovementNote,
    showCloseSession, setShowCloseSession,
    openSession, closeSessionSummary, confirmCloseSession, registerMovement,
  } = usePDVCashSession();

  const { parkedList, refreshParked, showParked, setShowParked, discardParked } = usePDVParked();

  const searchRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const term = search.trim().toLowerCase();
  const filteredProducts = usePDVProductFilter(products, term, selectedCategoryId);
  const filteredClients = usePDVClientFilter(clients, customerQuery);

  const loyaltyPoints = customer ? Math.floor(total) : 0;

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

  const { stopCamera } = useBarcodeCameraScanner({
    inputMode, open, videoRef,
    onValue: (v) => handleScanValue(v),
    onFallback: () => setInputMode('scanner'),
  });

  const clearAll = useCallback(() => {
    resetCart();
    resetSplits();
    setCustomer(null);
    setCustomerName('');
    setCustomerDocument('');
  }, [resetCart, resetSplits]);

  const applyCustomer = (c: DbClient) => {
    setCustomer(c);
    setCustomerName(c.name);
    setCustomerDocument(c.document || '');
    setShowCustomerPicker(false);
    toastSuccess(`Cliente vinculado: ${c.name}`);
  };

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
    discardParked(id);
    setShowParked(false);
    toastSuccess('Cupom retomado.');
  };

  const { saving, showFinalizeConfirm, setShowFinalizeConfirm, handleFinalize } = usePDVFinalize({
    cart, splits, total, totalItems, subtotal, discountValue, paidTotal, change,
    loyaltyPoints, customer, customerName, customerDocument, session,
    setSession,
    setShowOpenSession,
    setShowCustomerPicker,
    setShowPayment,
    clearAll,
    onClose: () => onOpenChange(false),
    onEmit,
    updateClient,
  });

  usePDVShortcuts({
    open,
    screenLocked,
    showPayment,
    cartLength: cart.length,
    hasSearch: !!search,
    onClearSearch: () => setSearch(''),
    onClearAll: clearAll,
    onGoToPayment: () => setShowPayment(true),
    onFinalize: () => handleFinalize(),
    onSuspend: suspendSale,
    onOpenParked: () => setShowParked(true),
    onLock: () => setScreenLocked(true),
    onAddSplit: addSplit,
  });

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

  const requestCloseSession = () => {
    if (!session) return;
    setShowCloseSession(true);
  };

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
          <PDVSessionBar
            hasSession={!!session}
            cashBalance={cashBalance}
            sessionElapsed={sessionElapsed}
            asPage={asPage}
            onSuprimento={() => setShowCashMovement('suprimento')}
            onSangria={() => setShowCashMovement('sangria')}
            onLock={() => setScreenLocked(true)}
            onCloseSession={requestCloseSession}
            onOpenSession={() => setShowOpenSession(true)}
          />

          <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
            <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r bg-muted/10 min-w-0 min-h-0">
              <PDVCatalogPanel
                inputMode={inputMode}
                onChangeInputMode={setInputMode}
                search={search}
                onSearchChange={setSearch}
                onSearchKeyDown={handleSearchKeyDown}
                searchRef={searchRef}
                videoRef={videoRef}
                productsCount={products.length}
                isLoading={productsQuery.isLoading}
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                filteredProducts={filteredProducts}
                term={term}
                onPickProduct={addToCart}
              />

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
              <PDVCartLines
                cart={cart}
                flashId={flashId}
                onUpdateQty={updateQty}
                onSetQty={setQty}
                onSetUnitPrice={setUnitPrice}
                onRemove={removeFromCart}
              />
            </div>

            <div className="w-full lg:w-[400px] xl:w-[460px] bg-muted/30 flex flex-col shrink-0 min-h-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {!showPayment ? (
                  <>
                    <PDVCustomerCard
                      customer={customer}
                      customerDocument={customerDocument}
                      loyaltyPoints={loyaltyPoints}
                      availableCredit={availableCredit}
                      onClear={() => { setCustomer(null); setCustomerName(''); setCustomerDocument(''); }}
                      onDocumentChange={setCustomerDocument}
                      onOpenPicker={() => setShowCustomerPicker(true)}
                    />

                    <PDVTotalsCard
                      subtotal={subtotal}
                      discount={discount}
                      discountType={discountType}
                      discountValue={discountValue}
                      total={total}
                      onChangeDiscount={setDiscount}
                      onChangeDiscountType={setDiscountType}
                    />
                  </>
                ) : (
                  <PDVPaymentPanel
                    total={total}
                    paidTotal={paidTotal}
                    remaining={remaining}
                    change={change}
                    splits={splits}
                    splitDrafts={splitDrafts}
                    installments={installments}
                    onBack={() => setShowPayment(false)}
                    onInstallmentsChange={setInstallments}
                    onAddSplit={addSplit}
                    onSplitAmountChange={handleSplitAmountChange}
                    onCommitSplitAmount={commitSplitAmount}
                    onRemoveSplit={removeSplit}
                  />
                )}
              </div>

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
                    onClick={() => handleFinalize()}
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
                  <span>F7 Suspender</span><span>F8 Retomar</span><span>F9 Limpar</span><span>F10 Finalizar</span><span>Ctrl+L Bloq</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <PDVOpenSessionDialog
          open={showOpenSession}
          openingAmount={openingAmount}
          onChangeAmount={setOpeningAmount}
          onCancel={() => setShowOpenSession(false)}
          onConfirm={openSession}
        />

        <PDVCashMovementDialog
          type={showCashMovement}
          cashBalance={cashBalance}
          amount={movementAmount}
          note={movementNote}
          onChangeAmount={setMovementAmount}
          onChangeNote={setMovementNote}
          onCancel={() => setShowCashMovement(null)}
          onConfirm={registerMovement}
        />

        <PDVCustomerPicker
          open={showCustomerPicker}
          query={customerQuery}
          filteredClients={filteredClients}
          onQueryChange={setCustomerQuery}
          onSelect={applyCustomer}
          onClose={() => setShowCustomerPicker(false)}
        />

        <PDVPixDialog
          open={!!showPixDialog}
          amount={showPixDialog?.amount || 0}
          onConfirm={() => setShowPixDialog(null)}
          onCancel={() => {
            if (showPixDialog) removeSplit(showPixDialog.splitId);
            setShowPixDialog(null);
          }}
        />

        <PDVCloseSessionDialog
          open={showCloseSession}
          summary={closeSessionSummary}
          onCancel={() => setShowCloseSession(false)}
          onClose={confirmCloseSession}
        />

        <PDVParkedDialog
          open={showParked}
          parked={parkedList}
          onClose={() => setShowParked(false)}
          onResume={resumeParked}
          onDelete={discardParked}
        />

        <PDVFinalizeConfirmDialog
          open={showFinalizeConfirm}
          total={total}
          totalItems={totalItems}
          splitsCount={splits.length}
          onCancel={() => setShowFinalizeConfirm(false)}
          onConfirm={() => { setShowFinalizeConfirm(false); handleFinalize(true); }}
        />
      </>
    </Shell>
  );
}
