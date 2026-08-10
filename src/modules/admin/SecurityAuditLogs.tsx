import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card } from '@/ui/base/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Badge } from '@/ui/base/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShieldCheck, User, Search, Filter, Calendar } from 'lucide-react';
import { Input } from '@/ui/base/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { PageLoading } from '@/shared/components/PageLoading';
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/base/popover";
import { Button } from "@/ui/base/button";
import { Calendar as CalendarComponent } from "@/ui/base/calendar";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

export default function SecurityAuditLogs() {
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState<string>('all');
  const [tenantId, setTenantId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  // Fetch tenants for filter
  const { data: companies = [] } = useQuery({
    queryKey: ['admin_companies_simple'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['security_audit_logs', eventType, tenantId, dateRange],
    queryFn: async () => {
      let q = supabase
        .from('security_audit_logs')
        .select(`
          *,
          company:companies(name),
          profile:profiles(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (eventType !== 'all') {
        q = q.eq('event_type', eventType);
      }
      if (tenantId !== 'all') {
        q = q.eq('company_id', tenantId);
      }
      if (dateRange?.from) {
        q = q.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        q = q.lte('created_at', dateRange.to.toISOString());
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const filteredLogs = logs.filter((log: any) => 
    !search || 
    log.event_type?.toLowerCase().includes(search.toLowerCase()) ||
    log.resource?.toLowerCase().includes(search.toLowerCase()) ||
    log.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    log.profile?.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <PageLoading message="Carregando logs de segurança..." />;

  return (
    <PageContainer>
      <PageHeader 
        title="Logs de Auditoria de Segurança" 
        description="Rastreamento detalhado de eventos de segurança, acessos e alterações críticas."
        icon={ShieldCheck}
      />

      <Card className="p-4 mb-6 border-primary/20 bg-background/50 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por evento, recurso ou usuário..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tipo de Evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Eventos</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
              <SelectItem value="permission_change">Alteração de Permissão</SelectItem>
              <SelectItem value="data_export">Exportação de Dados</SelectItem>
              <SelectItem value="security_hardening">Hardening de Segurança</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tenantId} onValueChange={setTenantId}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tenant / Empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tenants</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yy")} -{" "}
                      {format(dateRange.to, "dd/MM/yy")}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yy")
                  )
                ) : (
                  <span>Filtrar por data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </Card>

      <div className="grid gap-6">
        <Card className="p-0 overflow-hidden border-primary/20 bg-background/50 backdrop-blur-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Recurso</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Nenhum registro de segurança encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log: any) => (
                  <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {format(new Date(log.created_at), 'dd/MM/yy HH:mm:ss', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {log.company?.name || 'Sistema'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {log.event_type?.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.resource}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{log.profile?.full_name || 'Desconhecido'}</span>
                        <span className="text-[10px] text-muted-foreground">{log.profile?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] font-mono">
                      {log.ip_address || '-'}
                    </TableCell>
                    <TableCell>
                      {log.details && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">Ver JSON</Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <pre className="text-[10px] bg-muted p-2 rounded max-h-40 overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </PopoverContent>
                        </Popover>
                      )}
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
