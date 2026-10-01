import { useQuery } from '@tanstack/react-query';
import { AlertOctagon, CheckCircle2, FileText, Clock3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';

const kinds = ['nfe', 'nfce', 'cte', 'mdfe'] as const;
const startOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
};

export function FiscalKPIs() {
  const { currentCompany } = useEnterprise();
  const companyId = currentCompany?.id;
  const { data, isLoading, isError } = useQuery({
    queryKey: ['fiscal-kpis', companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      if (!companyId) throw new Error('Selecione uma empresa.');
      const month = startOfMonth();
      const totals = await Promise.all(kinds.map(async (kind) => {
        // Cada tipo tem o mesmo contrato de contexto e data de emissão.
        const table = supabase.from(kind);
        const [all, authorized, pending, rejected] = await Promise.all([
          table.select('id', { count: 'exact', head: true }).eq('company_id', companyId).gte('issue_date', month),
          table.select('id', { count: 'exact', head: true }).eq('company_id', companyId).gte('issue_date', month).eq('status', 'authorized'),
          table.select('id', { count: 'exact', head: true }).eq('company_id', companyId).gte('issue_date', month).in('status', ['draft', 'pending']),
          table.select('id', { count: 'exact', head: true }).eq('company_id', companyId).gte('issue_date', month).eq('status', 'rejected'),
        ]);
        for (const result of [all, authorized, pending, rejected]) {
          if (result.error) throw result.error;
        }
        return [all.count ?? 0, authorized.count ?? 0, pending.count ?? 0, rejected.count ?? 0];
      }));
      return totals.reduce((sum, row) => sum.map((value, index) => value + row[index]), [0, 0, 0, 0]);
    },
  });

  const metrics = [
    { title: 'Documentos no mês', icon: FileText, value: data?.[0] },
    { title: 'Autorizados no mês', icon: CheckCircle2, value: data?.[1] },
    { title: 'Rascunhos e pendentes', icon: Clock3, value: data?.[2] },
    { title: 'Rejeitados no mês', icon: AlertOctagon, value: data?.[3] },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map(({ title, icon: Icon, value }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{!companyId ? '—' : isError ? '—' : isLoading ? '…' : value?.toLocaleString('pt-BR')}</div>
            {isError && <p role="alert" className="text-xs text-destructive mt-1">Dados indisponíveis</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}