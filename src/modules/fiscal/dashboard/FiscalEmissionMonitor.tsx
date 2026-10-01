import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import type { FiscalEmissionJob } from '@/services/fiscal/fiscalEmissionService';

type Job = FiscalEmissionJob & { queued_at: string };
type Filter = 'all' | 'attention';

const names: Record<FiscalEmissionJob['document_type'], string> = {
  nfe: 'NF-e', nfce: 'NFC-e', nfse: 'NFS-e', cte: 'CT-e', mdfe: 'MDF-e',
};
const labels: Record<FiscalEmissionJob['status'], string> = {
  queued: 'Na fila', processing: 'Processando', authorized: 'Autorizado',
  rejected: 'Rejeitado', cancelled: 'Cancelado',
};

export function FiscalEmissionMonitor() {
  const { currentCompany } = useEnterprise();
  const companyId = currentCompany?.id;
  const [filter, setFilter] = useState<Filter>('all');
  const { data = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['fiscal_emission_jobs', companyId],
    enabled: Boolean(companyId),
    refetchInterval: 30_000,
    queryFn: async (): Promise<Job[]> => {
      if (!companyId) return [];
      // A fila ainda não consta nos tipos gerados; o acesso é limitado por RLS e empresa.
      const { data, error } = await (supabase.from as (table: string) => ReturnType<typeof supabase.from>)('fiscal_emission_jobs')
        .select('id, document_type, document_id, status, idempotency_key, attempt_count, provider, protocol, access_key, last_error, queued_at')
        .eq('company_id', companyId)
        .order('queued_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as Job[];
    },
  });
  const shown = filter === 'attention' ? data.filter((job) => job.status === 'rejected') : data;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Transmissões fiscais</CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border p-0.5" aria-label="Filtrar transmissões">
            <Button size="sm" variant={filter === 'all' ? 'secondary' : 'ghost'} onClick={() => setFilter('all')}>Todas</Button>
            <Button size="sm" variant={filter === 'attention' ? 'secondary' : 'ghost'} onClick={() => setFilter('attention')}>Rejeitadas</Button>
          </div>
          <Button size="icon" variant="ghost" aria-label="Atualizar transmissões" title="Atualizar transmissões" disabled={isFetching || !companyId} onClick={() => void refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!companyId ? <p className="text-sm text-muted-foreground">Selecione uma empresa.</p>
          : isLoading ? <p role="status" className="text-sm text-muted-foreground">Carregando transmissões...</p>
          : isError ? <p role="alert" className="text-sm text-destructive">Não foi possível consultar as transmissões. Tente atualizar.</p>
          : shown.length === 0 ? <p className="text-sm text-muted-foreground">{filter === 'attention' ? 'Nenhuma transmissão rejeitada.' : 'Nenhuma transmissão registrada.'}</p>
          : <div className="divide-y">{shown.map((job) => (
            <div key={job.id} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/fiscal/${job.document_type}`} className="font-medium text-sm hover:underline inline-flex items-center gap-1">
                    {names[job.document_type] ?? job.document_type} <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <Badge variant={job.status === 'rejected' ? 'destructive' : 'outline'}>{labels[job.status] ?? job.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(job.queued_at).toLocaleString('pt-BR')}{job.attempt_count > 0 ? ` · ${job.attempt_count} tentativa(s)` : ''}</p>
                {job.last_error && <p className="text-sm text-destructive break-words" role="alert">{job.last_error}</p>}
              </div>
              {job.protocol && <span className="text-xs text-muted-foreground break-all">Protocolo: {job.protocol}</span>}
            </div>
          ))}</div>}
      </CardContent>
    </Card>
  );
}