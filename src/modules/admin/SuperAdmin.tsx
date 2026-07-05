import { useState, useMemo } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageLoading } from '@/shared/components/PageLoading';
import { KPICard } from '@/shared/components/KPICard';
import { EmptyState } from '@/shared/components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Building2, Users, DollarSign, TrendingUp, Search, Eye, Ban, CheckCircle } from 'lucide-react';
import { useCompanies } from '@/hooks/system/useCompanies';
import { usePlans } from '@/hooks/system/useSubscription';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';

import { formatBRL } from '@/lib/formatters';
export default function SuperAdmin() {
  const { companies, loading: loadingC } = useCompanies();
  const { data: plans = [], isLoading: loadingP } = usePlans();
  const [search, setSearch] = useState('');

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['all_subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subscriptions').select('*');
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['all_saas_invoices'],
    queryFn: async () => {
      const { data, error } = await supabase.from('saas_invoices').select('*');
      if (error) throw error;
      return data as any[];
    },
  });

  // Metrics
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active' || s.status === 'trialing');
  const mrr = activeSubscriptions.reduce((sum, s) => {
    const plan = plans.find(p => p.id === s.plan_id);
    if (!plan) return sum;
    return sum + (s.billing_cycle === 'annual' ? plan.price_annual / 12 : plan.price_monthly);
  }, 0);
  const arr = mrr * 12;
  const trialCount = subscriptions.filter(s => s.status === 'trialing').length;
  const churnCount = subscriptions.filter(s => s.status === 'cancelled').length;
  const churnRate = subscriptions.length > 0 ? (churnCount / subscriptions.length * 100) : 0;

  // Plan distribution
  const planDist = plans.map(p => ({
    name: p.name,
    value: subscriptions.filter(s => s.plan_id === p.id && (s.status === 'active' || s.status === 'trialing')).length,
  })).filter(d => d.value > 0);
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.cnpj.includes(search)
  );

  if (loadingC || loadingP) return <PageLoading message="Carregando painel..." />;

  return (
    <PageContainer>
      <PageHeader title="Super Admin" description="Gestão global da plataforma SaaS" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <KPICard title="Empresas" value={companies.length.toString()} icon={<Building2 className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Assinaturas Ativas" value={activeSubscriptions.length.toString()} icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={1} />
        <KPICard title="MRR" value={formatBRL(mrr)} icon={<DollarSign className="h-5 w-5" />} accentColor="primary" index={2} />
        <KPICard title="ARR" value={formatBRL(arr)} icon={<TrendingUp className="h-5 w-5" />} accentColor="info" index={3} />
        <KPICard title="Em Trial" value={trialCount.toString()} icon={<Users className="h-5 w-5" />} accentColor="warning" index={4} />
        <KPICard title="Cancelamento" value={`${churnRate.toFixed(1)}%`} icon={<Ban className="h-5 w-5" />} accentColor="danger" index={5} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Distribuição por Plano</CardTitle></CardHeader>
          <CardContent>
            {planDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={planDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {planDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={DollarSign}
                title="Nenhuma assinatura ativa"
                description="Nenhum tenant possui plano ativo no momento."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Receita por Plano</CardTitle></CardHeader>
          <CardContent>
            {plans.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={plans.map(p => ({
                  name: p.name,
                  receita: subscriptions.filter(s => s.plan_id === p.id && s.status === 'active').length *
                    p.price_monthly,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                  <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">Sem dados</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Empresas Cadastradas</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar empresa..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cidade/UF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map(c => {
                const sub = subscriptions.find(s => s.company_id === c.id);
                const plan = sub ? plans.find(p => p.id === sub.plan_id) : null;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.cnpj}</TableCell>
                    <TableCell>{plan ? <Badge variant="outline">{plan.name}</Badge> : <span className="text-muted-foreground text-sm">Sem plano</span>}</TableCell>
                    <TableCell>
                      <Badge variant={sub?.status === 'active' ? 'default' : sub?.status === 'trialing' ? 'secondary' : 'destructive'}>
                        {sub?.status || 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{c.address.city}/{c.address.state}</TableCell>
                  </TableRow>
                );
              })}
              {filteredCompanies.length === 0 && (
                <TableRow><TableCell colSpan={5} className="h-20 text-center text-muted-foreground">Nenhuma empresa encontrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
