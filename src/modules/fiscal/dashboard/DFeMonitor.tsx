import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { RefreshCw } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnterprise } from '@/core/auth/EnterpriseContext';

export function DFeMonitor() {
  const { currentCompany } = useEnterprise();
  const { data = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['fiscal-monitor', currentCompany?.id],
    enabled: !!currentCompany?.id,
    queryFn: async () => {
      const companyId = currentCompany?.id;
      if (!companyId) return [];
      const { data, error } = await supabase.from('nfe')
        .select('id,number,status,issue_date').eq('company_id', companyId)
        .order('issue_date', { ascending: false }).limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });
  return (
    <Card className="lg:col-span-4">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Notas fiscais recentes</CardTitle>
        <Button variant="ghost" size="icon" aria-label="Atualizar notas fiscais" title="Atualizar notas fiscais" onClick={() => void refetch()} disabled={isFetching}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isError ? <p role="alert" className="text-sm text-destructive">Não foi possível carregar as notas. Tente atualizar.</p>
          : isLoading ? <p role="status" className="text-sm text-muted-foreground">Carregando notas...</p>
          : data.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma nota fiscal registrada.</p>
          : <div className="space-y-2">{data.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-3 border-b py-2 text-sm">
              <span>NF-e nº {doc.number}</span><span className="text-muted-foreground">{doc.status}</span>
            </div>
          ))}</div>}
      </CardContent>
    </Card>
  );
}
