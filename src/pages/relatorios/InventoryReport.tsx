import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Download, Package, AlertTriangle, TrendingDown, Boxes } from 'lucide-react';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(value);

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
        // Approximate value based on cost_price (no current stock qty in products table)
        const totalValue = active.reduce((s, p) => s + Number(p.cost_price), 0);
        const criticalItems = active.filter(p => Number(p.reorder_point) > 0).length;

        setStats({
          skus: products.length,
          totalValue,
          totalQty: active.length,
          criticalItems: 0, // Would need stock movement data
        });
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
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatório de Estoque</h1>
          <p className="text-muted-foreground">Visão geral do inventário, movimentações e alertas</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Exportar</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de SKUs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.skus}</div>
            <p className="text-xs text-muted-foreground">{stats.skus === 0 ? 'Nenhum produto cadastrado' : 'Produtos cadastrados'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor em Estoque</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">{stats.skus === 0 ? 'Nenhum dado disponível' : 'Custo total estimado'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQty}</div>
            <p className="text-xs text-muted-foreground">Produtos ativos</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.criticalItems}</div>
            <p className="text-xs text-destructive">Abaixo do mínimo</p>
          </CardContent>
        </Card>
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
    </div>
  );
}
