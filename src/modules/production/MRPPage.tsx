import { useState, useMemo } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Progress } from '@/ui/base/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { useProductionOrders } from '@/hooks/production/useProductionOrders';
import { useTechnicalSheets } from '@/hooks/production/useTechnicalSheets';
import { useSupplyStock } from '@/hooks/inventory/useSupplyStock';
import { useProductionCapacity } from '@/hooks/production/useProductionCapacity';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Package, Calculator, ShoppingCart, CheckCircle, XCircle, Layers, RefreshCw, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import MRPSimulation from '@/components/producao/MRPSimulation';

import { formatBRL, formatNumber } from '@/lib/formatters';

interface MaterialNeed {
  materialCode: string;
  materialName: string;
  unit: string;
  totalRequired: number;
  inStock: number;
  reserved: number;
  available: number;
  deficit: number;
  coveragePct: number;
  relatedOPs: string[];
  status: 'ok' | 'partial' | 'critical';
  supplier?: string;
}

export default function MRPPage() {
  const { orders, loading: loadingOrders } = useProductionOrders();
  const { sheets, loading: loadingSheets } = useTechnicalSheets();
  const { supplies, loading: loadingSupplies } = useSupplyStock();
  const { capacities } = useProductionCapacity();
  const [selectedTab, setSelectedTab] = useState('needs');
  const [generatingPO, setGeneratingPO] = useState(false);

  const handleGeneratePurchaseOrder = async () => {
    const deficits = materialNeeds.filter(m => m.deficit > 0);
    if (deficits.length === 0) return;
    setGeneratingPO(true);
    try {
      const poNumber = `PC-MRP-${format(new Date(), 'yyyyMMdd-HHmm')}`;
      const totalValue = deficits.reduce((s, m) => {
        const supply = supplies.find(su => su.code === m.materialCode || su.name === m.materialName);
        return s + m.deficit * (supply?.unit_cost || 0);
      }, 0);
      const supplierName = deficits[0]?.supplier || 'A definir';

      const { data: po, error: poErr } = await (supabase as any).from('purchase_orders').insert({
        number: poNumber,
        supplier_name: supplierName,
        status: 'draft',
        total: totalValue,
        notes: `Gerado automaticamente pelo MRP com ${deficits.length} item(s) em déficit`,
      }).select('id').single();

      if (poErr) throw poErr;

      for (const m of deficits) {
        const supply = supplies.find(su => su.code === m.materialCode || su.name === m.materialName);
        await (supabase as any).from('purchase_order_items').insert({
          purchase_order_id: po.id,
          product_code: m.materialCode,
          product_name: m.materialName,
          quantity: m.deficit,
          unit_price: supply?.unit_cost || 0,
          total: m.deficit * (supply?.unit_cost || 0),
          unit: m.unit,
        });
      }

      toast.success(`Pedido de compra ${poNumber} gerado com ${deficits.length} itens`);
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao gerar pedido de compra');
    } finally {
      setGeneratingPO(false);
    }
  };

  const loading = loadingOrders || loadingSheets || loadingSupplies;

  // Active OPs (planned or in_progress) that need materials
  const activeOPs = useMemo(() =>
    orders.filter(o => ['planned', 'in_progress'].includes(o.status)),
    [orders]
  );

  // Calculate material requirements by exploding BOMs
  const materialNeeds = useMemo<MaterialNeed[]>(() => {
    const needsMap: Record<string, { totalRequired: number; relatedOPs: string[]; unit: string; name: string }> = {};

    activeOPs.forEach(op => {
      // Find technical sheet for this product
      const sheet = sheets.find(s =>
        s.product_code === op.product_code ||
        s.product_id === op.product_id
      );

      if (sheet && Array.isArray(sheet.materials)) {
        const remainingQty = Math.max(0, op.quantity - op.produced_quantity);
        sheet.materials.forEach((mat: any) => {
          const code = mat.code || mat.componentCode || mat.material_code || '';
          const name = mat.name || mat.componentName || mat.material_name || code;
          const qtyPerUnit = mat.quantity || mat.qty || 0;
          const waste = mat.waste_pct || mat.wastePercentage || 0;
          const needed = remainingQty * qtyPerUnit * (1 + waste / 100);

          if (!needsMap[code]) {
            needsMap[code] = { totalRequired: 0, relatedOPs: [], unit: mat.unit || 'UN', name };
          }
          needsMap[code].totalRequired += needed;
          if (!needsMap[code].relatedOPs.includes(op.order_number)) {
            needsMap[code].relatedOPs.push(op.order_number);
          }
        });
      }
    });

    return Object.entries(needsMap).map(([code, data]) => {
      const supply = supplies.find(s => s.code === code || s.name === data.name);
      const inStock = supply?.current_quantity || 0;
      const available = inStock; // simplified: available = in stock
      const deficit = Math.max(0, data.totalRequired - available);
      const coveragePct = data.totalRequired > 0 ? Math.min(100, (available / data.totalRequired) * 100) : 100;

      let status: 'ok' | 'partial' | 'critical' = 'ok';
      if (coveragePct < 50) status = 'critical';
      else if (coveragePct < 100) status = 'partial';

      return {
        materialCode: code,
        materialName: data.name,
        unit: data.unit,
        totalRequired: Math.ceil(data.totalRequired * 100) / 100,
        inStock,
        reserved: 0,
        available,
        deficit: Math.ceil(deficit * 100) / 100,
        coveragePct: Math.round(coveragePct),
        relatedOPs: data.relatedOPs,
        status,
        supplier: supply?.supplier || undefined,
      };
    }).sort((a, b) => a.coveragePct - b.coveragePct);
  }, [activeOPs, sheets, supplies]);

  // OPs without technical sheets
  const opsWithoutSheet = useMemo(() =>
    activeOPs.filter(op => !sheets.find(s => s.product_code === op.product_code || s.product_id === op.product_id)),
    [activeOPs, sheets]
  );

  // KPIs
  const totalMaterials = materialNeeds.length;
  const criticalCount = materialNeeds.filter(m => m.status === 'critical').length;
  const partialCount = materialNeeds.filter(m => m.status === 'partial').length;
  const okCount = materialNeeds.filter(m => m.status === 'ok').length;
  const totalDeficitValue = materialNeeds.reduce((s, m) => {
    const supply = supplies.find(su => su.code === m.materialCode || su.name === m.materialName);
    return s + m.deficit * (supply?.unit_cost || 0);
  }, 0);

  const statusBadge = (status: string) => {
    if (status === 'critical') return <Badge variant="destructive">Crítico</Badge>;
    if (status === 'partial') return <Badge className="bg-warning/15 text-warning border-warning/30">Parcial</Badge>;
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">OK</Badge>;
  };

  return (
    <PageContainer loading={loading}>
      <PageHeader title="MRP — Planejamento de Materiais" description="Cálculo de necessidades de insumos baseado nas OPs ativas e fichas técnicas">
        <Button variant="outline" onClick={() => toast.info('Recalculando...')}>
          <RefreshCw className="h-4 w-4 mr-2" /> Recalcular
        </Button>
      </PageHeader>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <KPICard title="OPs Ativas" value={activeOPs.length} icon={<Layers className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Materiais" value={totalMaterials} icon={<Package className="h-5 w-5" />} accentColor="info" index={1} />
        <KPICard title="Disponíveis" value={okCount} icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={2} />
        <KPICard title="Faltantes" value={criticalCount + partialCount} icon={<XCircle className="h-5 w-5" />} accentColor="danger" index={3} />
        <KPICard title="Custo Déficit" value={`R$ ${(totalDeficitValue / 1000).toFixed(1)}k`} icon={<ShoppingCart className="h-5 w-5" />} accentColor="warning" index={4} />
      </div>

      {opsWithoutSheet.length > 0 && (
        <Card className="border-warning/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning text-sm">
              <AlertTriangle className="h-4 w-4" /> {opsWithoutSheet.length} OP(s) sem Ficha Técnica cadastrada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {opsWithoutSheet.slice(0, 10).map(op => (
                <Badge key={op.id} variant="outline" className="text-xs">
                  {op.order_number} — {op.product_name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="needs">Necessidades de Material</TabsTrigger>
          <TabsTrigger value="ops">OPs × Materiais</TabsTrigger>
          <TabsTrigger value="purchase">Sugestão de Compra</TabsTrigger>
          <TabsTrigger value="simulation"><FlaskConical className="h-4 w-4 mr-1" /> Simulação What-If</TabsTrigger>
        </TabsList>

        <TabsContent value="needs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" /> Explosão de Necessidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              {materialNeeds.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhuma necessidade calculada. Verifique se as OPs ativas possuem fichas técnicas com materiais.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead className="text-right">Necessário</TableHead>
                      <TableHead className="text-right">Em Estoque</TableHead>
                      <TableHead className="text-right">Déficit</TableHead>
                      <TableHead>Cobertura</TableHead>
                      <TableHead>OPs</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materialNeeds.map(m => (
                      <TableRow key={m.materialCode} className={cn(m.status === 'critical' && 'bg-destructive/5')}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{m.materialName}</span>
                            <span className="text-xs text-muted-foreground ml-2">{m.materialCode}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatNumber(m.totalRequired)} {m.unit}</TableCell>
                        <TableCell className="text-right font-mono">{formatNumber(m.inStock)} {m.unit}</TableCell>
                        <TableCell className={cn('text-right font-mono font-bold', m.deficit > 0 ? 'text-destructive' : 'text-green-600')}>
                          {m.deficit > 0 ? `-${formatNumber(m.deficit)}` : '0'} {m.unit}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={m.coveragePct} className="w-16 h-2" />
                            <span className="text-xs">{m.coveragePct}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {m.relatedOPs.slice(0, 3).map(op => (
                              <Badge key={op} variant="outline" className="text-xs">{op}</Badge>
                            ))}
                            {m.relatedOPs.length > 3 && <span className="text-xs text-muted-foreground">+{m.relatedOPs.length - 3}</span>}
                          </div>
                        </TableCell>
                        <TableCell>{statusBadge(m.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ops">
          <Card>
            <CardHeader><CardTitle>OPs Ativas × Materiais</CardTitle></CardHeader>
            <CardContent>
              {activeOPs.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nenhuma OP ativa.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>OP</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Qtd. Pendente</TableHead>
                      <TableHead>Ficha Técnica</TableHead>
                      <TableHead>Materiais</TableHead>
                      <TableHead>Cobertura</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeOPs.map(op => {
                      const sheet = sheets.find(s => s.product_code === op.product_code || s.product_id === op.product_id);
                      const matCount = sheet ? (sheet.materials?.length || 0) : 0;
                      const remaining = Math.max(0, op.quantity - op.produced_quantity);

                      // Calculate coverage for this OP
                      let opCoverage = 100;
                      if (sheet && Array.isArray(sheet.materials)) {
                        sheet.materials.forEach((mat: any) => {
                          const code = mat.code || mat.componentCode || mat.material_code || '';
                          const need = materialNeeds.find(n => n.materialCode === code);
                          if (need && need.coveragePct < opCoverage) opCoverage = need.coveragePct;
                        });
                      }

                      return (
                        <TableRow key={op.id}>
                          <TableCell className="font-mono text-sm">{op.order_number}</TableCell>
                          <TableCell className="font-medium">{op.product_name}</TableCell>
                          <TableCell className="text-right">{remaining}</TableCell>
                          <TableCell>
                            {sheet ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">v{sheet.version}</Badge>
                            ) : (
                              <Badge variant="destructive">Sem ficha</Badge>
                            )}
                          </TableCell>
                          <TableCell>{matCount} itens</TableCell>
                          <TableCell>
                            {sheet ? (
                              <div className="flex items-center gap-2">
                                <Progress value={opCoverage} className="w-16 h-2" />
                                <span className={cn('text-xs font-bold', opCoverage < 100 ? 'text-destructive' : 'text-green-600')}>{opCoverage}%</span>
                              </div>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" /> Sugestão de Compra
                </CardTitle>
                {materialNeeds.filter(m => m.deficit > 0).length > 0 && (
                  <Button size="sm" onClick={handleGeneratePurchaseOrder} disabled={generatingPO}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {generatingPO ? 'Gerando...' : 'Gerar Pedido de Compra'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {materialNeeds.filter(m => m.deficit > 0).length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Todos os materiais possuem cobertura suficiente. Nenhuma compra sugerida.</p>
              ) : (
                <>
                  <div className="mb-4 p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total de itens faltantes: <strong className="text-foreground">{materialNeeds.filter(m => m.deficit > 0).length}</strong></span>
                      <span className="text-muted-foreground">Custo estimado total: <strong className="text-foreground">{formatBRL(materialNeeds.filter(m => m.deficit > 0).reduce((s, m) => {
                        const supply = supplies.find(su => su.code === m.materialCode || su.name === m.materialName);
                        return s + m.deficit * (supply?.unit_cost || 0);
                      }, 0))}</strong></span>

                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead className="text-right">Qtd. a Comprar</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead className="text-right">Custo Est.</TableHead>
                        <TableHead>Urgência</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialNeeds.filter(m => m.deficit > 0).map(m => {
                        const supply = supplies.find(s => s.code === m.materialCode || s.name === m.materialName);
                        const estCost = m.deficit * (supply?.unit_cost || 0);
                        return (
                          <TableRow key={m.materialCode}>
                            <TableCell className="font-medium">{m.materialName}</TableCell>
                            <TableCell className="text-right font-mono font-bold">{formatNumber(m.deficit)}</TableCell>
                            <TableCell>{m.unit}</TableCell>
                            <TableCell>{m.supplier || <span className="text-muted-foreground">—</span>}</TableCell>
                            <TableCell className="text-right">R$ {formatNumber(estCost, 2)}</TableCell>
                            <TableCell>
                              <Badge variant={m.status === 'critical' ? 'destructive' : 'secondary'}>
                                {m.status === 'critical' ? 'Urgente' : 'Normal'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulation">
          <MRPSimulation orders={orders} sheets={sheets} supplies={supplies} capacities={capacities} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
