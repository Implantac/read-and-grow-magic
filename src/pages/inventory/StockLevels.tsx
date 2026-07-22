import { useState } from 'react';
import { ExportButton } from '@/shared/components/ExportButton';
import { Button } from '@/ui/base/button';
import { formatBRL } from '@/lib/formatters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { Package, AlertCircle, AlertTriangle, TrendingUp, ShoppingCart, BarChart3, RefreshCcw } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { ABCCurveChart } from '@/components/inventory/ABCCurveChart';
import { InventoryTurnoverChart } from '@/components/inventory/InventoryTurnoverChart';
import type { StockLevel, StockLevelFilters } from '@/types/inventory';
import { StockFiltersCard } from './stock-levels/StockFiltersCard';
import { StockLevelsTable } from './stock-levels/StockLevelsTable';
import { StockLevelDetailDialog } from './stock-levels/StockLevelDetailDialog';

export default function StockLevelsPage() {
  const [stockLevels] = useState<StockLevel[]>([]);
  const [filters, setFilters] = useState<StockLevelFilters>({ search: '', category: 'all', status: 'all' });
  const [selectedItem, setSelectedItem] = useState<StockLevel | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const filteredLevels = stockLevels.filter((level) => {
    const matchesSearch = filters.search === '' ||
      level.productName.toLowerCase().includes(filters.search.toLowerCase()) ||
      level.productCode.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory = filters.category === 'all' || level.category === filters.category;
    const matchesStatus = filters.status === 'all' || level.status === filters.status;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const criticalItems = stockLevels.filter((l) => l.status === 'critical');
  const lowItems = stockLevels.filter((l) => l.status === 'low');
  const excessItems = stockLevels.filter((l) => l.status === 'excess');

  const openView = (item: StockLevel) => { setSelectedItem(item); setIsViewOpen(true); };

  return (
    <PageContainer>
      <PageHeader title="Níveis de Estoque" description="Monitoramento de saldos e alertas">
        <ExportButton
          data={filteredLevels as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'productCode', label: 'Código' },
            { key: 'productName', label: 'Produto' },
            { key: 'category', label: 'Categoria' },
            { key: 'currentStock', label: 'Estoque Atual' },
            { key: 'minStock', label: 'Mínimo' },
            { key: 'maxStock', label: 'Máximo' },
            { key: 'totalValue', label: 'Valor Total', format: (v) => formatBRL(Number(v)) },
            { key: 'status', label: 'Status' },
          ]}
          filename="niveis_estoque"
        />
        <Button variant="outline"><ShoppingCart className="mr-2 h-4 w-4" />Gerar Pedido de Compra</Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Valor Total em Estoque" value={formatBRL(stockLevels.reduce((s, l) => s + l.totalValue, 0))} icon={<Package className="h-5 w-5" />} subtitle={`${stockLevels.length} produtos ativos`} index={0} />
        <KPICard title="Estoque Crítico" value={criticalItems.length} icon={<AlertCircle className="h-5 w-5" />} accentColor="danger" subtitle="Requer ação imediata" index={1} />
        <KPICard title="Estoque Baixo" value={lowItems.length} icon={<AlertTriangle className="h-5 w-5" />} accentColor="warning" subtitle="Abaixo do mínimo" index={2} />
        <KPICard title="Estoque em Excesso" value={excessItems.length} icon={<TrendingUp className="h-5 w-5" />} accentColor="info" subtitle="Acima do máximo" index={3} />
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">Todos ({stockLevels.length})</TabsTrigger>
          <TabsTrigger value="critical" className="text-destructive">Críticos ({criticalItems.length})</TabsTrigger>
          <TabsTrigger value="low" className="text-amber-600">Baixos ({lowItems.length})</TabsTrigger>
          <TabsTrigger value="excess" className="text-blue-600">Excesso ({excessItems.length})</TabsTrigger>
          <TabsTrigger value="abc" className="gap-1"><BarChart3 className="h-4 w-4" />Curva ABC</TabsTrigger>
          <TabsTrigger value="turnover" className="gap-1"><RefreshCcw className="h-4 w-4" />Giro de Estoque</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <StockFiltersCard filters={filters} onChange={setFilters} categories={[...new Set(stockLevels.map(s => s.category))]} />
          <StockLevelsTable levels={filteredLevels} onView={openView} />
        </TabsContent>
        <TabsContent value="critical"><StockLevelsTable levels={criticalItems} onView={openView} /></TabsContent>
        <TabsContent value="low"><StockLevelsTable levels={lowItems} onView={openView} /></TabsContent>
        <TabsContent value="excess"><StockLevelsTable levels={excessItems} onView={openView} /></TabsContent>
        <TabsContent value="abc"><ABCCurveChart stockLevels={stockLevels} /></TabsContent>
        <TabsContent value="turnover"><InventoryTurnoverChart stockLevels={stockLevels} /></TabsContent>
      </Tabs>

      <StockLevelDetailDialog open={isViewOpen} onOpenChange={setIsViewOpen} item={selectedItem} />
    </PageContainer>
  );
}
