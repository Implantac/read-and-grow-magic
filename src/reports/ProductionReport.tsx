import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Skeleton } from '@/ui/base/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Download, Factory, Target, AlertTriangle, Gauge } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';

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

        setStats({ total: orders.length, produced, planned, efficiency, defects: 0 });
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
      <PageHeader title="Relatório de Produção" description="Eficiência, qualidade e consumo de materiais">
        <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Exportar</Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Produção Total" value={stats.produced} subtitle={`de ${stats.planned} planejados`} icon={<Factory className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Eficiência Média" value={`${stats.efficiency}%`} subtitle={stats.total === 0 ? 'Nenhum dado disponível' : `${stats.total} ordens`} icon={<Gauge className="h-5 w-5" />} accentColor="success" index={1} />
        <KPICard title="Atingimento Meta" value={`${stats.efficiency}%`} subtitle="Planejado vs Realizado" icon={<Target className="h-5 w-5" />} accentColor="info" index={2} />
        <KPICard title="Defeitos" value={stats.defects} subtitle="0% taxa de defeito" icon={<AlertTriangle className="h-5 w-5" />} accentColor="warning" index={3} />
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
    </PageContainer>
  );
}