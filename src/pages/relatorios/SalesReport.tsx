import { useState, useEffect } from 'react';
import { formatBRLCompact } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Download, TrendingUp, ShoppingBag, Users, Target } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';

const formatCurrency = (value: number) => formatBRLCompact(value);
export default function SalesReport() {
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ count: 0, revenue: 0, avgTicket: 0 });

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('sales')
          .select('total');

        if (error) throw error;
        const count = data?.length || 0;
        const revenue = data?.reduce((s, r) => s + Number(r.total), 0) || 0;
        setStats({ count, revenue, avgTicket: count > 0 ? revenue / count : 0 });
      } catch (e) {
        console.error('Error fetching sales stats:', e);
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
      <PageHeader title="Relatório de Vendas" description="Análise consolidada de vendas e desempenho comercial">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Mensal</SelectItem>
            <SelectItem value="quarterly">Trimestral</SelectItem>
            <SelectItem value="yearly">Anual</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Exportar</Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Total Vendas" value={stats.count} subtitle={stats.count === 0 ? 'Nenhuma venda registrada' : 'Vendas no período'} icon={<ShoppingBag className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Faturamento" value={formatCurrency(stats.revenue)} subtitle={stats.count === 0 ? 'Nenhum dado disponível' : 'Total acumulado'} icon={<TrendingUp className="h-5 w-5" />} accentColor="success" index={1} />
        <KPICard title="Ticket Médio" value={formatCurrency(stats.avgTicket)} subtitle="Por venda" icon={<Users className="h-5 w-5" />} accentColor="info" index={2} />
        <KPICard title="Meta Atingida" value="0%" subtitle="Acumulado no período" icon={<Target className="h-5 w-5" />} accentColor="warning" index={3} />
      </div>

      {stats.count === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum dado de vendas disponível</h3>
            <p className="text-muted-foreground">Cadastre vendas para visualizar o relatório comercial.</p>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}