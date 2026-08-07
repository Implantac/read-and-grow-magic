import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';

import { Card } from '@/ui/base/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Badge } from '@/ui/base/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShieldCheck, History, User, Search, Filter } from 'lucide-react';
import { Input } from '@/ui/base/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';

import { PageLoading } from '@/shared/components/PageLoading';

export default function AuditLogs() {
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['system_audit_logs', moduleFilter],
    queryFn: async () => {
      let q = supabase
        .from('system_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      
      if (moduleFilter !== 'all') {
        q = q.eq('module', moduleFilter);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const filteredLogs = logs.filter((log: any) => 
    !search || 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.entity_name?.toLowerCase().includes(search.toLowerCase()) ||
    log.user_id?.toLowerCase().includes(search.toLowerCase())
  );


  if (isLoading) return <PageLoading message="Carregando trilha de auditoria..." />;

  return (
    <PageContainer>
      <PageHeader 
        title="Trilha de Auditoria" 
        description="Monitoramento de alterações críticas no sistema (Quem, O quê, Quando)"
        icon={<History className="h-6 w-6 text-primary" />}
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por ação, entidade ou ID..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Módulo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Módulos</SelectItem>
            <SelectItem value="fiscal">Fiscal</SelectItem>
            <SelectItem value="financial">Financeiro</SelectItem>
            <SelectItem value="inventory">Estoque</SelectItem>
            <SelectItem value="production">Produção</SelectItem>
            <SelectItem value="system">Sistema</SelectItem>
          </SelectContent>
        </Select>
      </div>

      
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
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Nenhum registro de auditoria encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log: any) => (
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
