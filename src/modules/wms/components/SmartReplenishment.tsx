import { useState, useMemo } from 'react';
import { RefreshCw, ArrowRight, AlertTriangle, CheckCircle, Search, Filter, Brain, CheckSquare, Square, Rocket, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Badge } from '@/ui/base/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { useEstoqueMatrix } from '@/hooks/inventory/useEstoqueMatrix';
import { useBranches } from '@/hooks/useBranches';
import { useCreateTransferenciaCanal } from '@/hooks/wms/useTransferenciasCanal';
import { EmptyState } from '@/shared/components/EmptyState';
import { toast } from 'sonner';
import { stockEngine } from '@/services/operational/inventory/stockEngine';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/ui/base/dialog';
import { Checkbox } from '@/ui/base/checkbox';

export function SmartReplenishment() {
  const [search, setSearch] = useState('');
  const [simulatedSug, setSimulatedSug] = useState<any>(null);
  const [showBulkPreview, setShowBulkPreview] = useState(false);
  const [bulkConfirmStep, setBulkConfirmStep] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editedQuantities, setEditedQuantities] = useState<Record<string, number>>({});
  const { data: matrix = [], isLoading, error, refetch } = useEstoqueMatrix(search, true);
  const { data: branches = [] } = useBranches();
  const createTransfer = useCreateTransferenciaCanal();
  const [isBulkApproving, setIsBulkApproving] = useState(false);



  const suggestions = useMemo(() => {
    const list: any[] = [];
    
    // Group matrix by product
    const byProduct = matrix.reduce((acc: Record<string, any>, curr) => {
      if (!acc[curr.product_id]) {

        acc[curr.product_id] = {
          id: curr.product_id,
          code: curr.product_code,
          name: curr.product_name,
          min_stock: curr.min_stock,
          balances: [],
        };
      }
      acc[curr.product_id].balances.push(curr);
      return acc;
    }, {});

    Object.values(byProduct).forEach((p: any) => {
      // Motor de Necessidade Profissional
      // Identifica destinos (filiais abaixo do estoque alvo)
      const lowStockBranches = p.balances.filter((b: any) => {
        // Se houver política específica, usa ela. Caso contrário, usa o global do produto.
        // Nota: A matriz atual traz o global, mas o motor de rede deve buscar a política SKU x Local.
        // Implementação simplificada mantendo a compatibilidade com a matriz atual:
        return b.quantity < p.min_stock;
      });

      // Identifica origens (filiais com surplus)
      const surplusBranches = p.balances.filter((b: any) => b.quantity > p.min_stock * 1.5); 

      lowStockBranches.forEach((target: any) => {
        const projected = stockEngine.calculateProjected(target);
        const needed = p.min_stock - projected.projected;
        
        if (needed <= 0) return;

        // Fluxo de Prioridade de Rede: 
        // 1. Balanceamento entre Lojas (Surplus de proximidade/tipo)
        // 2. Reabastecimento via CD (Distribuição)
        // 3. Produção (Indústria)
        const sortedSources = surplusBranches
          .map((s: any) => {
            let priority = 4;
            if (s.branch_tipo === 'STORE') priority = 1; // Prioridade 1: Balanceamento
            if (s.branch_tipo === 'DISTRIBUTION_CENTER') priority = 2; // Prioridade 2: CD
            if (s.branch_tipo === 'FACTORY') priority = 3; // Prioridade 3: Produção

            return { ...s, availableSurplus: s.quantity - p.min_stock, sourcePriority: priority };
          })
          .sort((a: any, b: any) => {
            if (a.sourcePriority !== b.sourcePriority) return a.sourcePriority - b.sourcePriority;
            return b.availableSurplus - a.availableSurplus;
          });

        const source = sortedSources[0];
        
        if (source && source.availableSurplus > 0) {
          const transferable = Math.min(needed, source.availableSurplus);
          
          if (transferable > 0) {
            list.push({
              id: `${p.id}-${source.branch_id}-${target.branch_id}`,
              productId: p.id,
              productCode: p.code,
              productName: p.name,
              sourceBranchId: source.branch_id,
              sourceBranchName: source.branch_name,
              sourceBranchTipo: source.branch_tipo,
              targetBranchId: target.branch_id,
              targetBranchName: target.branch_name,
              currentSourceQty: source.quantity,
              currentTargetQty: target.quantity,
              suggestedQty: transferable,
              priority: (target.quantity <= 0) ? 'critical' : (needed > p.min_stock * 0.5 ? 'high' : 'medium'),
              flowType: source.branch_tipo === 'STORE' ? 'BALANCEAMENTO' : 'REABASTECIMENTO',
              targetMetrics: stockEngine.calculateProjected(target),
              sourceMetrics: stockEngine.calculateProjected(source),
              minStock: p.min_stock,
              maxStock: target.max_stock,
              leadTime: target.lead_time_days,
            });
          }
        }
      });
    });

    return list;
  }, [matrix]);

  const handleExecute = (sug: any) => {
    createTransfer.mutate({
      origem_branch_id: sug.sourceBranchId,
      destino_branch_id: sug.targetBranchId,
      canal_origem: sug.sourceBranchTipo === 'FACTORY' || sug.sourceBranchTipo === 'DISTRIBUTION_CENTER' ? 'ATACADO_INDUSTRIA' : 'VAREJO_PDV',
      canal_destino: 'VAREJO_PDV',
      observacoes: `Reposição via IA: ${sug.sourceBranchName} -> ${sug.targetBranchName}`,
      itens: [{ product_id: sug.productId, quantidade: sug.suggestedQty }],
    }, {
      onSuccess: () => toast.success(`Transferência de ${sug.productName} solicitada!`),
    });
  };

  const bulkPreviewData = useMemo(() => {
    const toApprove = suggestions.filter(s => selectedIds.has(s.id));
    if (toApprove.length === 0) return null;

    const groups = toApprove.reduce((acc: any, sug) => {
      const key = `${sug.sourceBranchId}-${sug.targetBranchId}`;
      if (!acc[key]) {
        acc[key] = {
          sourceId: sug.sourceBranchId,
          targetId: sug.targetBranchId,
          sourceName: sug.sourceBranchName,
          targetName: sug.targetBranchName,
          sourceTipo: sug.sourceBranchTipo,
          itens: []
        };
      }
      acc[key].itens.push({ 
        id: sug.id,
        product_id: sug.productId, 
        productName: sug.productName,
        productCode: sug.productCode,
        quantidade: editedQuantities[sug.id] ?? sug.suggestedQty 
      });
      return acc;
    }, {});

    return Object.values(groups);
  }, [suggestions, selectedIds, editedQuantities]);

  const handleUpdateQuantity = (id: string, value: number) => {
    setEditedQuantities(prev => ({ ...prev, [id]: value }));
  };

  const handleRemoveItem = (id: string) => {
    const newSet = new Set(selectedIds);
    newSet.delete(id);
    setSelectedIds(newSet);
  };

  const handleBulkApprove = async () => {
    if (!bulkPreviewData || bulkPreviewData.length === 0) return;

    setIsBulkApproving(true);
    let successCount = 0;

    try {
      for (const group of bulkPreviewData as any[]) {
        await createTransfer.mutateAsync({
          origem_branch_id: group.sourceId,
          destino_branch_id: group.targetId,
          canal_origem: group.sourceTipo === 'FACTORY' || group.sourceTipo === 'DISTRIBUTION_CENTER' ? 'ATACADO_INDUSTRIA' : 'VAREJO_PDV',
          canal_destino: 'VAREJO_PDV',
          observacoes: `Aprovação em lote IA: ${group.sourceName} -> ${group.targetName}`,
          itens: group.itens.map((i: any) => ({ product_id: i.product_id, quantidade: i.quantidade })),
        });
        successCount += group.itens.length;
      }
      
      toast.success(`${successCount} sugestões aprovadas e transferências geradas!`);
      setSelectedIds(new Set());
      setShowBulkPreview(false);
      setBulkConfirmStep(false);

    } catch (err) {
      console.error("Bulk approval error:", err);
      toast.error("Erro ao processar aprovação em lote.");
    } finally {
      setIsBulkApproving(false);
    }
  };


  const toggleSelectAll = () => {
    if (selectedIds.size === suggestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(suggestions.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary animate-spin-slow" />
              <div>
                <CardTitle>Sugestões de Reposição Inteligente</CardTitle>
                <CardDescription>Análise preditiva de ruptura e surplus para balanceamento de malha</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedIds.size > 0 && (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-primary hover:bg-primary/90 shadow-lg animate-in fade-in zoom-in duration-300"
                  onClick={() => setShowBulkPreview(true)}
                  disabled={isBulkApproving}
                >
                  <Rocket className={`h-4 w-4 mr-2 ${isBulkApproving ? 'animate-bounce' : ''}`} />
                  Revisar {selectedIds.size} {selectedIds.size === 1 ? 'Sugestão' : 'Sugestões'}
                </Button>

              )}
              <Badge variant="outline" className="bg-background">IA Analítica Ativa</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Filtrar produtos..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="pl-9 bg-background" 
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          </div>

          {error ? (
            <EmptyState 
              compact
              icon={AlertTriangle}
              title="Erro na análise"
              description="Não foi possível analisar a malha logística."
              action={{ label: "Tentar Novamente", onClick: () => refetch() }}
            />
          ) : isLoading ? (
            <div className="py-8 text-center text-muted-foreground flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="font-medium">Analisando malha logística em tempo real...</p>
              <p className="text-xs opacity-70">Cruzando dados de ruptura, surplus e lead-times...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <EmptyState 
              compact
              icon={CheckCircle}
              title="Estoque Balanceado"
              description="Nenhuma sugestão de transferência necessária no momento."
            />
          ) : (
            <div className="border rounded-lg bg-background overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={suggestions.length > 0 && selectedIds.size === suggestions.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Origem (Surplus)</TableHead>
                    <TableHead>Fluxo</TableHead>
                    <TableHead></TableHead>
                    <TableHead>Destino (Ruptura)</TableHead>
                    <TableHead className="text-right">Qtd Sugerida</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {suggestions.map(sug => (
                    <TableRow key={sug.id} className={selectedIds.has(sug.id) ? 'bg-primary/5' : ''}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.has(sug.id)}
                          onCheckedChange={() => toggleSelect(sug.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{sug.productName}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{sug.productCode}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-semibold">{sug.sourceBranchName}</div>
                        <div className="text-[10px] text-muted-foreground">Saldo: {sug.currentSourceQty}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] uppercase">
                          {sug.flowType}
                        </Badge>
                      </TableCell>
                      <TableCell><ArrowRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                      <TableCell>
                        <div className="text-xs font-semibold">{sug.targetBranchName}</div>
                        <div className="text-[10px] text-red-500 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Falta: {Math.abs(sug.currentTargetQty)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        <Badge variant={sug.priority === 'critical' ? 'destructive' : sug.priority === 'high' ? 'warning' : 'secondary'}>
                          {sug.suggestedQty}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSimulatedSug(sug)}
                            className="gap-2"
                          >
                            <Brain className="h-3.5 w-3.5" />
                            Explicar
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleExecute(sug)}
                            disabled={createTransfer.isPending}
                          >
                            Transferir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!simulatedSug} onOpenChange={(open) => !open && setSimulatedSug(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" /> Inteligência de Abastecimento (Explicar)
            </DialogTitle>
            <DialogDescription>
              Análise preditiva do efeito da transferência na malha logística.
            </DialogDescription>
          </DialogHeader>

          {simulatedSug && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-4 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Memória de Cálculo: {simulatedSug.targetBranchName}
                  </p>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase">1. Demanda Média Diária</p>
                        <p className="text-sm font-bold">{simulatedSug.targetMetrics.dailyDemand.toFixed(2)} un/dia</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase">2. Lead Time (D+N)</p>
                        <p className="text-sm font-bold">{simulatedSug.leadTime || 0} dias</p>
                      </div>
                    </div>

                    <div className="p-3 rounded bg-background/50 border border-dashed space-y-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Equação de Ressuprimento</p>
                      <div className="space-y-1 font-mono text-xs">
                        <div className="flex justify-between">
                          <span>Estoque Físico:</span>
                          <span>{simulatedSug.targetMetrics.physical}</span>
                        </div>
                        <div className="flex justify-between text-red-500">
                          <span>(-) Reservas:</span>
                          <span>{simulatedSug.targetMetrics.reserved}</span>
                        </div>
                        <div className="flex justify-between text-blue-500">
                          <span>(+) Em Trânsito:</span>
                          <span>{simulatedSug.targetMetrics.inTransitIn}</span>
                        </div>
                        <div className="border-t pt-1 flex justify-between font-bold">
                          <span>(=) Projetado:</span>
                          <span>{simulatedSug.targetMetrics.projected}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase">3. Cobertura Crítica</p>
                        <p className={`text-sm font-bold ${simulatedSug.targetMetrics.coverageDays < 3 ? 'text-destructive' : ''}`}>
                          {simulatedSug.targetMetrics.coverageDays.toFixed(1)} dias
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase">4. Gatilho (Mín/Máx)</p>
                        <p className="text-sm font-bold">{simulatedSug.minStock} / {simulatedSug.maxStock || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-4 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Viabilidade de Origem: {simulatedSug.sourceBranchName}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground italic text-xs">Saldo Disponível:</span>
                      <span className="font-bold text-success">{simulatedSug.sourceMetrics.available} un</span>
                    </div>
                    
                    <div className="p-3 rounded bg-background/50 border border-dashed space-y-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Análise de Impacto</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Cobertura Atual:</span>
                          <span>{simulatedSug.sourceMetrics.coverageDays.toFixed(1)} dias</span>
                        </div>
                        <div className="flex justify-between text-amber-500">
                          <span>Pós-Transferência:</span>
                          <span className="font-bold">
                            {((simulatedSug.sourceMetrics.projected - simulatedSug.suggestedQty) / (simulatedSug.sourceMetrics.dailyDemand || 1)).toFixed(1)} dias
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Badge variant="outline" className={`text-[9px] ${stockEngine.getABCColor(simulatedSug.sourceMetrics.abcClass)}`}>
                        Curva {simulatedSug.sourceMetrics.abcClass || 'N/A'}
                      </Badge>
                      <span>Item de {simulatedSug.sourceMetrics.abcClass === 'A' ? 'Alto' : simulatedSug.sourceMetrics.abcClass === 'B' ? 'Médio' : 'Baixo'} giro.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs font-bold text-primary uppercase mb-2">Conclusão da IA</p>
                <div className="text-xs space-y-2 text-muted-foreground leading-relaxed">
                  <p>• <strong>Gatilho:</strong> O estoque projetado ({simulatedSug.targetMetrics.projected}) está abaixo do mínimo ({simulatedSug.minStock}).</p>
                  <p>• <strong>Recomendação:</strong> Transferir <strong>{simulatedSug.suggestedQty} unidades</strong> para restaurar a cobertura de segurança.</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSimulatedSug(null)}>Cancelar</Button>
            <Button onClick={() => {
              handleExecute(simulatedSug);
              setSimulatedSug(null);
            }}>Confirmar e Transferir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkPreview} onOpenChange={(open) => {
        setShowBulkPreview(open);
        if (!open) setBulkConfirmStep(false);
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {bulkConfirmStep ? (
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              ) : (
                <CheckSquare className="h-6 w-6 text-primary" />
              )}
              {bulkConfirmStep ? 'Confirmar Execução Logística' : 'Revisar Transferências Consolidadas'}
            </DialogTitle>
            <DialogDescription>
              {bulkConfirmStep 
                ? 'Você está prestes a gerar as transferências definitivas no sistema. Esta ação não pode ser desfeita em lote.'
                : `A IA consolidou ${selectedIds.size} itens em ${bulkPreviewData?.length || 0} transferências otimizadas para reduzir custos logísticos.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {bulkConfirmStep ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                    <p className="text-2xl font-bold text-primary">{bulkPreviewData?.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Transferências</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                    <p className="text-2xl font-bold text-primary">{selectedIds.size}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Itens Totais</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                    <p className="text-2xl font-bold text-primary">
                      {String(bulkPreviewData?.reduce((acc: number, group: any) => acc + (group.itens as any[]).reduce((iAcc: number, i: any) => iAcc + Number(i.quantidade), 0), 0))}
                    </p>


                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Volume Total</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-muted/50">
                  <h4 className="text-sm font-semibold mb-2">Resumo da Operação</h4>
                  <ul className="text-xs space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      As transferências serão geradas com status "Solicitada" (Etapa 1 do workflow).
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      O estoque será reservado na origem imediatamente após a confirmação.
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      As guias de separação estarão disponíveis no painel de Transferências.
                    </li>
                  </ul>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">Atenção</p>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Verifique se as unidades de origem possuem capacidade operacional para realizar a separação e expedição deste volume no prazo sugerido.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              bulkPreviewData?.map((group: any, idx: number) => (
                <div key={idx} className="border rounded-lg overflow-hidden bg-muted/30">
                  <div className="bg-muted p-3 flex items-center justify-between border-b">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Origem</span>
                      <span className="text-sm font-semibold">{String(group.sourceName)}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground mt-2" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Destino</span>
                      <span className="text-sm font-semibold">{String(group.targetName)}</span>


                      </div>
                    </div>
                    <Badge variant="secondary">{group.itens.length} {group.itens.length === 1 ? 'item' : 'itens'}</Badge>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-transparent hover:bg-transparent">
                        <TableHead className="h-8 py-0">Produto</TableHead>
                        <TableHead className="h-8 py-0 text-right">Quantidade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.itens.map((item: any, itemIdx: number) => (
                        <TableRow key={itemIdx} className="hover:bg-transparent">
                        <TableCell className="py-2">
                          <div className="text-xs font-medium">{String(item.productName)}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{String(item.productCode)}</div>
                        </TableCell>
                        <TableCell className="py-2 text-right font-bold text-primary">
                          {Number(item.quantidade)}

                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button 
              variant="outline" 
              onClick={() => bulkConfirmStep ? setBulkConfirmStep(false) : setShowBulkPreview(false)}
            >
              {bulkConfirmStep ? 'Voltar para Revisão' : 'Cancelar'}
            </Button>
            
            {bulkConfirmStep ? (
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={handleBulkApprove}
                disabled={isBulkApproving}
              >
                {isBulkApproving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Confirmar e Gerar Agora
                  </>
                )}
              </Button>
            ) : (
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => setBulkConfirmStep(true)}
              >
                Próximo: Confirmar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </DialogFooter>

        </DialogContent>
      </Dialog>
    </div>
  );
}

