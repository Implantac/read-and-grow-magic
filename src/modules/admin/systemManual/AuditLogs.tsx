import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/core/layout/PageContainer';
import { PageHeader } from '@/core/layout/PageHeader';
import { Card } from '@/ui/base/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Badge } from '@/ui/base/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShieldCheck, History, User } from 'lucide-react';
import { PageLoading } from '@/components/ui/PageLoading';

export function AuditLogs() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['system_audit_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <PageLoading message="Carregando trilha de auditoria..." />;

  return (
    <PageContainer>
      <PageHeader 
        title="Trilha de Auditoria" 
        description="Monitoramento de alterações críticas no sistema"
        icon={<ShieldCheck className="h-6 w-6 text-primary" />}
      />
      
      <div className="grid gap-6">
        <Card className="p-0 overflow-hidden border-primary/20 bg-background/50 backdrop-blur-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Dados</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Nenhum registro de auditoria encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log: any) => (
                  <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {format(new Date(log.created_at), 'dd/MM/yy HH:mm:ss', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{log.module}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-xs">
                      {log.action.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.entity_name} 
                      <span className="block text-[10px] text-muted-foreground">{log.entity_id?.split('-')[0]}...</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{log.user_id?.split('-')[0]}...</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {log.old_data && (
                          <Badge variant="secondary" className="text-[9px]">DE</Badge>
                        )}
                        {log.new_data && (
                          <Badge variant="default" className="text-[9px] bg-green-500/20 text-green-700 hover:bg-green-500/30">PARA</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </PageContainer>
  );
}
