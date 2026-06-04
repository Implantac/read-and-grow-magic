import { useState, useEffect } from 'react';
import { formatBRLCompact } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Download, Package, AlertTriangle, TrendingDown, Boxes } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';

const formatCurrency = (value: number) => formatBRLCompact(value);
export default function InventoryReport() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ skus: 0, totalValue: 0, totalQty: 0, criticalItems: 0 });

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('cost_price, min_stock, reorder_point, status');

        if (error) throw error;
        const products = data || [];
        const active = products.filter(p => p.status === 'active');
        const totalValue = active.reduce((s, p) => s + Number(p.cost_price), 0);

        setStats({ skus: products.length, totalValue, totalQty: active.length, criticalItems: 0 });
      } catch (e) {
        console.error('Error fetching inventory stats:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Relatório de Estoque" description="Visão geral do inventário, movimentações e alertas">
        <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Exportar</Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Total de SKUs" value={stats.skus} subtitle={stats.skus === 0 ? 'Nenhum produto cadastrado' : 'Produtos cadastrados'} icon={<Package className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Valor em Estoque" value={formatCurrency(stats.totalValue)} subtitle={stats.skus === 0 ? 'Nenhum dado disponível' : 'Custo total estimado'} icon={<Boxes className="h-5 w-5" />} accentColor="info" index={1} />
        <KPICard title="Produtos Ativos" value={stats.totalQty} subtitle="Produtos ativos" icon={<TrendingDown className="h-5 w-5" />} accentColor="success" index={2} />
        <KPICard title="Itens Críticos" value={stats.criticalItems} subtitle="Abaixo do mínimo" icon={<AlertTriangle className="h-5 w-5" />} accentColor="danger" index={3} />
      </div>

      {stats.skus === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum dado de estoque disponível</h3>
            <p className="text-muted-foreground">Cadastre produtos e movimentações para visualizar o relatório de estoque.</p>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}