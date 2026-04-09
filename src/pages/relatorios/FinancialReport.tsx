import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Download, DollarSign, TrendingUp, TrendingDown, AlertCircle, BarChart3 } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(value);

export default function FinancialReport() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, expenses: 0, profit: 0, overdue: 0, overdueCount: 0 });

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const [receivableRes, payableRes] = await Promise.all([
          supabase.from('accounts_receivable').select('amount, status, due_date'),
          supabase.from('accounts_payable').select('amount, status, due_date'),
        ]);

        const receivables = receivableRes.data || [];
        const payables = payableRes.data || [];

        const revenue = receivables.reduce((s, r) => s + Number(r.amount), 0);
        const expenses = payables.reduce((s, r) => s + Number(r.amount), 0);
        const now = new Date().toISOString();
        const overdueItems = receivables.filter(r => r.status === 'pending' && r.due_date < now);
        const overdue = overdueItems.reduce((s, r) => s + Number(r.amount), 0);

        setStats({ revenue, expenses, profit: revenue - expenses, overdue, overdueCount: overdueItems.length });
      } catch (e) {
        console.error('Error fetching financial stats:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const margin = stats.revenue > 0 ? ((stats.profit / stats.revenue) * 100).toFixed(1) : '0';

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

  const hasData = stats.revenue > 0 || stats.expenses > 0;

  return (
    <PageContainer>
      <PageHeader title="Relatório Financeiro" description="DRE simplificado, fluxo de caixa e inadimplência">
        <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Exportar</Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Receita Total" value={formatCurrency(stats.revenue)} subtitle={hasData ? 'Contas a receber' : 'Nenhum dado disponível'} icon={<DollarSign className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Despesas" value={formatCurrency(stats.expenses)} subtitle={hasData ? 'Contas a pagar' : 'Nenhum dado disponível'} icon={<TrendingDown className="h-5 w-5" />} accentColor="warning" index={1} />
        <KPICard title="Lucro Líquido" value={formatCurrency(stats.profit)} subtitle={`Margem: ${margin}%`} icon={<TrendingUp className="h-5 w-5" />} accentColor="success" index={2} />
        <KPICard title="Inadimplência" value={formatCurrency(stats.overdue)} subtitle={`${stats.overdueCount} títulos vencidos`} icon={<AlertCircle className="h-5 w-5" />} accentColor="danger" index={3} />
      </div>

      {!hasData && (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum dado financeiro disponível</h3>
            <p className="text-muted-foreground">Cadastre receitas e despesas para visualizar o relatório financeiro.</p>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}