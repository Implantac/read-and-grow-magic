import { useState, useMemo } from 'react';
import { Lock, Unlock, CheckCircle2, Calendar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const formatBRL = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

export default function PeriodClosing() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['accounting_periods', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounting_periods' as any)
        .select('*')
        .eq('year', year)
        .order('month');
      if (error) throw error;
      return data as any[];
    },
  });

  const closeMutation = useMutation({
    mutationFn: async ({ y, m }: { y: number; m: number }) => {
      const { data, error } = await supabase.rpc('close_accounting_period' as any, { _year: y, _month: m });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting_periods'] });
      toast({ title: 'Período fechado', description: 'Resultado apurado com sucesso' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const reopenMutation = useMutation({
    mutationFn: async ({ y, m }: { y: number; m: number }) => {
      const { data, error } = await supabase.rpc('reopen_accounting_period' as any, { _year: y, _month: m });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting_periods'] });
      toast({ title: 'Período reaberto' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const monthsView = useMemo(() => {
    const map = new Map(periods.map((p: any) => [p.month, p]));
    return monthNames.map((name, idx) => {
      const m = idx + 1;
      const p = map.get(m) as any;
      return {
        month: m,
        name,
        status: p?.status || 'open',
        result: p?.result_amount || 0,
        closed_at: p?.closed_at,
      };
    });
  }, [periods]);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <PageContainer>
      <PageHeader
        title="Fechamento Contábil"
        description="Bloqueia o período para evitar alterações em movimentações já contabilizadas"
      />

      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">Ano:</span>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Resultado</TableHead>
                <TableHead>Fechado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              )}
              {!isLoading && monthsView.map((row) => (
                <TableRow key={row.month}>
                  <TableCell className="font-medium">{row.name}/{year}</TableCell>
                  <TableCell>
                    {row.status === 'open' && <Badge variant="outline">Aberto</Badge>}
                    {row.status === 'closed' && <Badge className="bg-warning/15 text-warning">Fechado</Badge>}
                    {row.status === 'locked' && <Badge variant="destructive">Bloqueado</Badge>}
                  </TableCell>
                  <TableCell className={`text-right font-mono ${row.result >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatBRL(row.result)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.closed_at ? new Date(row.closed_at).toLocaleString('pt-BR') : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.status === 'open' ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="default">
                            <Lock className="h-3.5 w-3.5 mr-1" /> Fechar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Fechar {row.name}/{year}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Após o fechamento, nenhum lançamento financeiro nesse período poderá ser criado, alterado ou excluído.
                              Apenas administradores podem reabrir o período depois.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => closeMutation.mutate({ y: year, m: row.month })}>
                              Confirmar fechamento
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : row.status === 'closed' ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Unlock className="h-3.5 w-3.5 mr-1" /> Reabrir
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reabrir {row.name}/{year}?</AlertDialogTitle>
                            <AlertDialogDescription>Apenas administradores podem reabrir um período já fechado.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => reopenMutation.mutate({ y: year, m: row.month })}>
                              Reabrir período
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Badge variant="secondary"><CheckCircle2 className="h-3 w-3 mr-1" /> Imutável</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
