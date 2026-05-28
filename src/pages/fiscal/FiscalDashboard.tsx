import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileCheck, FileText, Receipt, Landmark, AlertCircle } from 'lucide-react';

import { formatBRL, formatDate } from '@/lib/formatters';
function useFiscalSummary() {
  return useQuery({
    queryKey: ['fiscal_dashboard_summary'],
    queryFn: async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const isoStart = monthStart.toISOString();

      const [{ data: nfes }, { data: nfces }] = await Promise.all([
        supabase
          .from('nfe')
          .select('status,total,icms,pis,cofins,ipi,issue_date')
          .gte('issue_date', isoStart),
        supabase
          .from('nfce')
          .select('status,total,issue_date')
          .gte('issue_date', isoStart),
      ]);

      const authorized = (nfes ?? []).filter((n: any) => n.status === 'authorized');
      const totalNFe = authorized.reduce((s: number, n: any) => s + Number(n.total ?? 0), 0);
      const icms = authorized.reduce((s: number, n: any) => s + Number(n.icms ?? 0), 0);
      const pis = authorized.reduce((s: number, n: any) => s + Number(n.pis ?? 0), 0);
      const cofins = authorized.reduce((s: number, n: any) => s + Number(n.cofins ?? 0), 0);
      const ipi = authorized.reduce((s: number, n: any) => s + Number(n.ipi ?? 0), 0);
      const totalNFCe = (nfces ?? [])
        .filter((n: any) => n.status === 'authorized')
        .reduce((s: number, n: any) => s + Number(n.total ?? 0), 0);

      return {
        nfeIssued: authorized.length,
        nfeDraft: (nfes ?? []).filter((n: any) => n.status === 'draft').length,
        nfeRejected: (nfes ?? []).filter((n: any) => n.status === 'rejected').length,
        nfceIssued: (nfces ?? []).filter((n: any) => n.status === 'authorized').length,
        totalNFe,
        totalNFCe,
        icms,
        pis,
        cofins,
        ipi,
        totalTaxes: icms + pis + cofins + ipi,
        recentNFes: (nfes ?? []).slice(0, 8),
      };
    },
  });
}

export default function FiscalDashboardPage() {
  const { data, isLoading } = useFiscalSummary();
  const s = data ?? {
    nfeIssued: 0,
    nfeDraft: 0,
    nfeRejected: 0,
    nfceIssued: 0,
    totalNFe: 0,
    totalNFCe: 0,
    icms: 0,
    pis: 0,
    cofins: 0,
    ipi: 0,
    totalTaxes: 0,
    recentNFes: [] as any[],
  };

  const cards = [
    { title: 'NF-e Autorizadas (mês)', value: s.nfeIssued, icon: FileCheck, color: 'text-success' },
    { title: 'NFC-e Autorizadas (mês)', value: s.nfceIssued, icon: Receipt, color: 'text-primary' },
    { title: 'Faturamento NF-e', value: fmt(s.totalNFe), icon: FileText, color: 'text-foreground' },
    { title: 'Total Impostos', value: fmt(s.totalTaxes), icon: Landmark, color: 'text-warning' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Painel Fiscal"
        description="Visão consolidada de NF-e, NFC-e e impostos apurados no mês"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{c.title}</p>
                  <p className="text-2xl font-bold mt-1">
                    {isLoading ? '...' : c.value}
                  </p>
                </div>
                <c.icon className={`h-8 w-8 ${c.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Impostos apurados (mês)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'ICMS', value: s.icms },
              { label: 'PIS', value: s.pis },
              { label: 'COFINS', value: s.cofins },
              { label: 'IPI', value: s.ipi },
            ].map((t) => (
              <div key={t.label} className="flex items-center justify-between border-b pb-2 last:border-0">
                <span className="font-medium">{t.label}</span>
                <span className="font-mono">{fmt(t.value)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 border-t-2 font-bold">
              <span>Total</span>
              <span className="font-mono text-warning">{fmt(s.totalTaxes)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status documentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Rascunhos pendentes</span>
              <Badge variant="secondary">{s.nfeDraft}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>NF-e rejeitadas</span>
              <Badge variant={s.nfeRejected > 0 ? 'destructive' : 'secondary'}>
                {s.nfeRejected}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Faturamento NFC-e</span>
              <span className="font-mono">{fmt(s.totalNFCe)}</span>
            </div>
            {s.nfeRejected > 0 && (
              <div className="flex items-start gap-2 mt-3 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <span>Existem NF-e rejeitadas que requerem atenção.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>NF-e recentes (mês)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">ICMS</TableHead>
                <TableHead className="text-right">PIS+COFINS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.recentNFes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    Nenhuma NF-e no período
                  </TableCell>
                </TableRow>
              ) : (
                s.recentNFes.map((n: any) => (
                  <TableRow key={n.issue_date + n.total}>
                    <TableCell>{formatDate(n.issue_date)}</TableCell>
                    <TableCell>
                      <Badge variant={n.status === 'authorized' ? 'default' : 'secondary'}>
                        {n.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{fmt(Number(n.total))}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(Number(n.icms))}</TableCell>
                    <TableCell className="text-right font-mono">
                      {fmt(Number(n.pis) + Number(n.cofins))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
