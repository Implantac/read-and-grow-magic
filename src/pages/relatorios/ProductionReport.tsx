import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Download, Factory, Target, AlertTriangle, Gauge } from 'lucide-react';

export default function ProductionReport() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, produced: 0, planned: 0, efficiency: 0, defects: 0 });

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('production_orders')
          .select('quantity, produced_quantity, status');

        if (error) throw error;
        const orders = data || [];
        const planned = orders.reduce((s, o) => s + Number(o.quantity), 0);
        const produced = orders.reduce((s, o) => s + Number(o.produced_quantity), 0);
        const efficiency = planned > 0 ? Math.round((produced / planned) * 100) : 0;

        setStats({
          total: orders.length,
          produced,
          planned,
          efficiency,
          defects: 0,
        });
      } catch (e) {
        console.error('Error fetching production stats:', e);
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
          <h1 className="text-2xl font-bold text-foreground">Relatório de Produção</h1>
          <p className="text-muted-foreground">Eficiência, qualidade e consumo de materiais</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Exportar</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produção Total</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.produced}</div>
            <p className="text-xs text-muted-foreground">de {stats.planned} planejados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência Média</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.efficiency}%</div>
            <p className="text-xs text-muted-foreground">{stats.total === 0 ? 'Nenhum dado disponível' : `${stats.total} ordens`}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atingimento Meta</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.efficiency}%</div>
            <p className="text-xs text-muted-foreground">Planejado vs Realizado</p>
          </CardContent>
        </Card>
        <Card className="border-warning/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Defeitos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.defects}</div>
            <p className="text-xs text-muted-foreground">0% taxa de defeito</p>
          </CardContent>
        </Card>
      </div>

      {stats.total === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Factory className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum dado de produção disponível</h3>
            <p className="text-muted-foreground">Cadastre ordens de produção para visualizar o relatório.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
