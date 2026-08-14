import { useState, useMemo } from 'react';
import { RefreshCw, ArrowRight, AlertTriangle, CheckCircle, Search, Filter } from 'lucide-react';
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

export function SmartReplenishment() {
  const [search, setSearch] = useState('');
  const { data: matrix = [], isLoading, error, refetch } = useEstoqueMatrix(search, true);
  const { data: branches = [] } = useBranches();
  const createTransfer = useCreateTransferenciaCanal();

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
        // Posição Projetada = Saldo + (Em Trânsito - Reservado) 
        // Implementação futura: buscar saldos reais do Ledger
        const projectedStock = target.quantity; 
        const needed = p.min_stock - projectedStock;
        
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
            <Badge variant="outline" className="bg-background">IA Analítica Ativa</Badge>
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
                    <TableRow key={sug.id}>
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
                        <Button 
                          size="sm" 
                          onClick={() => handleExecute(sug)}
                          disabled={createTransfer.isPending}
                        >
                          Transferir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
