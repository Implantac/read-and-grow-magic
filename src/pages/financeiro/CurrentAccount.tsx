import { useState, useMemo } from 'react';
import { Wallet, Search, Users, Building2, ArrowUpDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

import { formatBRL } from '@/lib/formatters';
const formatBRL = (n: number) =>
  formatBRL(n || 0);

interface Row {
  party: string;
  party_id?: string;
  document_id: string;
  description: string;
  invoice_number?: string;
  date: string;
  debit: number;
  credit: number;
  balance: number;
  status: string;
}

function CurrentAccountTable({ rows, search }: { rows: Row[]; search: string }) {
  const filtered = useMemo(
    () => rows.filter((r) => r.party?.toLowerCase().includes(search.toLowerCase())),
    [rows, search],
  );

  // Agrupa por party com saldo acumulado
  const groups = useMemo(() => {
    const map = new Map<string, { party: string; rows: Row[]; total: number }>();
    filtered.forEach((r) => {
      if (!map.has(r.party)) map.set(r.party, { party: r.party, rows: [], total: 0 });
      const g = map.get(r.party)!;
      g.rows.push(r);
      g.total += r.balance;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
          Nenhum lançamento encontrado
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <Card key={g.party}>
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/40">
              <div className="font-semibold">{g.party}</div>
              <div className={`font-mono font-semibold ${g.total > 0 ? 'text-warning' : 'text-success'}`}>
                Saldo: {formatBRL(g.total)}
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Pago</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {g.rows
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((r) => (
                    <TableRow key={r.document_id}>
                      <TableCell className="text-sm">{new Date(r.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-sm font-mono">{r.invoice_number || '—'}</TableCell>
                      <TableCell className="text-sm">{r.description}</TableCell>
                      <TableCell className="text-right font-mono">{formatBRL(r.debit)}</TableCell>
                      <TableCell className="text-right font-mono text-success">{formatBRL(r.credit)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">{formatBRL(r.balance)}</TableCell>
                      <TableCell>
                        {r.status === 'paid' && <Badge className="bg-success/15 text-success">Pago</Badge>}
                        {r.status === 'pending' && <Badge variant="outline">Pendente</Badge>}
                        {r.status === 'overdue' && <Badge variant="destructive">Vencido</Badge>}
                        {r.status === 'partial' && <Badge className="bg-warning/15 text-warning">Parcial</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function CurrentAccount() {
  const [search, setSearch] = useState('');

  const { data: clientRows = [], isLoading: loadingClients } = useQuery({
    queryKey: ['client_current_account'],
    queryFn: async () => {
      const { data, error } = await supabase.from('client_current_account' as any).select('*').limit(2000);
      if (error) throw error;
      return (data || []).map((r: any) => ({
        party: r.client_name,
        party_id: r.client_id,
        document_id: r.document_id,
        description: r.description,
        invoice_number: r.invoice_number,
        date: r.date,
        debit: Number(r.debit) || 0,
        credit: Number(r.credit) || 0,
        balance: Number(r.balance) || 0,
        status: r.status,
      })) as Row[];
    },
  });

  const { data: supplierRows = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ['supplier_current_account'],
    queryFn: async () => {
      const { data, error } = await supabase.from('supplier_current_account' as any).select('*').limit(2000);
      if (error) throw error;
      return (data || []).map((r: any) => ({
        party: r.supplier_name,
        document_id: r.document_id,
        description: r.description,
        invoice_number: r.invoice_number,
        date: r.date,
        debit: Number(r.debit) || 0,
        credit: Number(r.credit) || 0,
        balance: Number(r.balance) || 0,
        status: r.status,
      })) as Row[];
    },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Conta Corrente"
        description="Extrato e saldo acumulado por cliente e fornecedor"
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente ou fornecedor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="clients">
        <TabsList>
          <TabsTrigger value="clients"><Users className="h-4 w-4 mr-2" /> Clientes</TabsTrigger>
          <TabsTrigger value="suppliers"><Building2 className="h-4 w-4 mr-2" /> Fornecedores</TabsTrigger>
        </TabsList>
        <TabsContent value="clients" className="mt-4">
          {loadingClients ? <div className="text-center py-8 text-muted-foreground">Carregando…</div> : <CurrentAccountTable rows={clientRows} search={search} />}
        </TabsContent>
        <TabsContent value="suppliers" className="mt-4">
          {loadingSuppliers ? <div className="text-center py-8 text-muted-foreground">Carregando…</div> : <CurrentAccountTable rows={supplierRows} search={search} />}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
