import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Download, DollarSign, TrendingUp, TrendingDown, AlertCircle, BarChart3 } from 'lucide-react';

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

        setStats({
          revenue,
          expenses,
          profit: revenue - expenses,
          overdue,
          overdueCount: overdueItems.length,
        });
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
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const hasData = stats.revenue > 0 || stats.expenses > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatório Financeiro</h1>
          <p className="text-muted-foreground">DRE simplificado, fluxo de caixa e inadimplência</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Exportar</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.revenue)}</div>
            <p className="text-xs text-muted-foreground">{hasData ? 'Contas a receber' : 'Nenhum dado disponível'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.expenses)}</div>
            <p className="text-xs text-muted-foreground">{hasData ? 'Contas a pagar' : 'Nenhum dado disponível'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(stats.profit)}</div>
            <p className="text-xs text-muted-foreground">Margem: {margin}%</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inadimplência</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(stats.overdue)}</div>
            <p className="text-xs text-destructive">{stats.overdueCount} títulos vencidos</p>
          </CardContent>
        </Card>
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
    </div>
  );
}
