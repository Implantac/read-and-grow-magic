import { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/ui/base/sheet';
import { Badge } from '@/ui/base/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Skeleton } from '@/ui/base/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { ScrollArea } from '@/ui/base/scroll-area';
import { formatBRL, formatDate } from '@/lib/formatters';
import { Building2, ShoppingCart, Star, Clock, FileText, Phone, Mail, MapPin } from 'lucide-react';
import { usePurchasing } from '@/hooks/purchasing/usePurchasingQuery';
import type { Supplier } from '@/types/purchasing';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  supplier: Supplier | null;
}

export function Supplier360Drawer({ open, onOpenChange, supplier }: Props) {
  const { orders, ordersLoading } = usePurchasing();

  const supplierOrders = useMemo(() => 
    orders.filter(o => o.supplierId === supplier?.id).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
    [orders, supplier]
  );

  const stats = useMemo(() => {
    const valid = supplierOrders.filter(o => o.status !== 'cancelled');
    const totalSpent = valid.reduce((acc, o) => acc + o.total, 0);
    const avgDeliveryDays = valid.reduce((acc, o) => {
        if (!o.expectedDelivery || !o.date) return acc;
        const diff = new Date(o.expectedDelivery).getTime() - new Date(o.date).getTime();
        return acc + (diff / (1000 * 60 * 60 * 24));
    }, 0) / (valid.length || 1);

    return {
      totalSpent,
      orderCount: valid.length,
      avgDeliveryDays: Math.round(avgDeliveryDays),
    };
  }, [supplierOrders]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <SheetTitle className="truncate">{supplier?.name || 'Fornecedor'}</SheetTitle>
          </div>
          <SheetDescription>Visão consolidada 360° do Fornecedor</SheetDescription>
        </SheetHeader>

        {!supplier ? (
          <div className="mt-12 text-center text-muted-foreground">
            <p>Selecione um fornecedor para ver os detalhes.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card><CardContent className="p-3">
                <p className="text-[10px] uppercase text-muted-foreground font-bold">Total Comprado</p>
                <p className="text-lg font-black">{formatBRL(stats.totalSpent)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-[10px] uppercase text-muted-foreground font-bold">Pedidos</p>
                <p className="text-lg font-black">{stats.orderCount}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-[10px] uppercase text-muted-foreground font-bold">Lead Time Médio</p>
                <p className="text-lg font-black">{stats.avgDeliveryDays} dias</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-[10px] uppercase text-muted-foreground font-bold">Rating</p>
                <div className="flex items-center gap-1 mt-1 text-yellow-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < (supplier.rating || 0) ? 'fill-current' : 'opacity-20'}`} />
                  ))}
                </div>
              </CardContent></Card>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="overview">Geral</TabsTrigger>
                <TabsTrigger value="orders">Pedidos</TabsTrigger>
                <TabsTrigger value="contact">Contato</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-bold">Informações Cadastrais</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Código:</span>
                      <span className="font-mono font-bold">{supplier.code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nome Fantasia:</span>
                      <span>{supplier.tradeName || supplier.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CNPJ/CPF:</span>
                      <span>{supplier.document}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Categoria:</span>
                      <Badge variant="secondary">{supplier.category}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Condição de Pagto:</span>
                      <span>{supplier.paymentTerms || '—'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-bold">Endereço</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p>{supplier.address?.street}, {supplier.address?.number}</p>
                        <p>{supplier.address?.neighborhood} - {supplier.address?.city}/{supplier.address?.state}</p>
                        <p className="text-xs text-muted-foreground">CEP: {supplier.address?.zipCode}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Histórico de Compras</p>
                  <Badge variant="outline">{supplierOrders.length} registros</Badge>
                </div>

                <ScrollArea className="h-[400px] pr-4">
                  {ordersLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                  ) : supplierOrders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShoppingCart className="mx-auto h-8 w-8 opacity-20 mb-2" />
                      <p className="text-sm">Nenhum pedido de compra localizado.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {supplierOrders.map((order) => (
                        <div key={order.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold group-hover:text-primary transition-colors">{order.number}</span>
                              <Badge variant="outline" className="text-[9px] px-1 h-4">{order.status}</Badge>
                            </div>
                            <span className="text-sm font-bold">{formatBRL(order.total)}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(order.date)}</span>
                            <span>{order.items.length} itens</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4 mt-4">
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 p-4 border rounded-xl">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">E-mail Comercial</p>
                      <p className="text-sm font-medium">{supplier.email || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 border rounded-xl">
                    <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Telefone / WhatsApp</p>
                      <p className="text-sm font-medium">{supplier.phone || supplier.cellphone || '—'}</p>
                    </div>
                  </div>
                  <div className="p-4 border border-dashed rounded-xl bg-muted/20">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-bold uppercase text-muted-foreground">Notas Internas</span>
                    </div>
                    <p className="text-xs italic text-muted-foreground">Nenhuma observação interna registrada para este fornecedor.</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
