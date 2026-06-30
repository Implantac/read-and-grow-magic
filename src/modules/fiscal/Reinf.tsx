import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Badge } from '@/ui/base/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui/base/tabs';
import { useReinf } from '@/hooks/fiscal/useReinf';
import { formatBRL } from '@/lib/formatters';
import { Calendar, FileText, Lock, RefreshCcw, Sparkles, Unlock } from 'lucide-react';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  aberto: 'secondary',
  fechado: 'default',
  reaberto: 'outline',
};

export default function Reinf() {
  const {
    competencia, setCompetencia,
    events, currentPeriod, loading, busy,
    openPeriod, generateR2010, generateR4020, closePeriod, reopen,
  } = useReinf();

  const totals = currentPeriod?.totals || {};
  const isClosed = currentPeriod?.status === 'fechado';

  const byType = (t: string) => events.filter((e) => e.event_type === t);

  return (
    <PageContainer>
      <PageHeader
        title="EFD-Reinf"
        description="Eventos de retenções de INSS (R-2010) e IR/CSLL/PIS/COFINS (R-4020) com fechamento mensal R-2099/R-4099"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-lg border-primary/10">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" /> Competência
            </CardTitle>
            <CardDescription>Selecione o mês de apuração</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mês</Label>
              <Input
                type="month"
                value={competencia.slice(0, 7)}
                onChange={(e) => setCompetencia(`${e.target.value}-01`)}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="text-sm">
                <div className="font-semibold">Status</div>
                <div className="text-xs text-muted-foreground">{currentPeriod?.competencia || competencia}</div>
              </div>
              <Badge variant={statusVariant[currentPeriod?.status || 'aberto']}>
                {currentPeriod?.status || 'não aberto'}
              </Badge>
            </div>

            <div className="grid gap-2">
              <Button onClick={openPeriod} disabled={busy} variant="outline">
                <Sparkles className="h-4 w-4 mr-2" /> Abrir competência
              </Button>
              <Button onClick={generateR2010} disabled={busy || isClosed}>
                <FileText className="h-4 w-4 mr-2" /> Gerar R-2010 (INSS)
              </Button>
              <Button onClick={generateR4020} disabled={busy || isClosed}>
                <FileText className="h-4 w-4 mr-2" /> Gerar R-4020 (IR/CSLL/PIS/COFINS)
              </Button>
              {!isClosed ? (
                <Button onClick={closePeriod} disabled={busy || !currentPeriod} variant="default">
                  <Lock className="h-4 w-4 mr-2" /> Fechar competência
                </Button>
              ) : (
                <Button onClick={() => currentPeriod && reopen(currentPeriod.id)} disabled={busy} variant="secondary">
                  <Unlock className="h-4 w-4 mr-2" /> Reabrir competência
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg border-primary/10">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="text-lg">Totais consolidados</CardTitle>
            <CardDescription>Bases para o fechamento mensal</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <TotalBox label="R-2010 (qtd)" value={String(totals.r2010_qtd ?? 0)} />
              <TotalBox label="INSS retido" value={formatBRL(Number(totals.r2010_inss ?? 0))} />
              <TotalBox label="R-4020 (qtd)" value={String(totals.r4020_qtd ?? 0)} />
              <TotalBox label="IR retido" value={formatBRL(Number(totals.r4020_ir ?? 0))} />
              <TotalBox label="CSLL retido" value={formatBRL(Number(totals.r4020_csll ?? 0))} />
              <TotalBox label="PIS retido" value={formatBRL(Number(totals.r4020_pis ?? 0))} />
              <TotalBox label="COFINS retido" value={formatBRL(Number(totals.r4020_cofins ?? 0))} />
              <TotalBox
                label="Total DARF (R-4099)"
                value={formatBRL(
                  Number(totals.r4020_ir ?? 0) + Number(totals.r4020_csll ?? 0) +
                  Number(totals.r4020_pis ?? 0) + Number(totals.r4020_cofins ?? 0),
                )}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 shadow-lg border-primary/10">
        <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Eventos da competência</CardTitle>
            <CardDescription>{loading ? 'Carregando…' : `${events.length} evento(s)`}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="R-2010">
            <TabsList>
              <TabsTrigger value="R-2010">R-2010 ({byType('R-2010').length})</TabsTrigger>
              <TabsTrigger value="R-4020">R-4020 ({byType('R-4020').length})</TabsTrigger>
              <TabsTrigger value="R-2099">R-2099 ({byType('R-2099').length})</TabsTrigger>
              <TabsTrigger value="R-4099">R-4099 ({byType('R-4099').length})</TabsTrigger>
            </TabsList>

            {(['R-2010', 'R-4020', 'R-2099', 'R-4099'] as const).map((t) => (
              <TabsContent key={t} value={t}>
                <EventTable events={byType(t)} type={t} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

function TotalBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}

function EventTable({ events, type }: { events: any[]; type: string }) {
  if (events.length === 0) {
    return <div className="text-sm text-muted-foreground py-6 text-center">Nenhum evento {type} gerado nesta competência.</div>;
  }
  const isFechamento = type === 'R-2099' || type === 'R-4099';
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {!isFechamento && <TableHead>CNPJ</TableHead>}
          {!isFechamento && <TableHead>NF / Emissão</TableHead>}
          <TableHead className="text-right">Valor</TableHead>
          {type === 'R-2010' && <TableHead className="text-right">INSS</TableHead>}
          {type === 'R-4020' && <TableHead className="text-right">IR</TableHead>}
          {type === 'R-4020' && <TableHead className="text-right">CSLL</TableHead>}
          {type === 'R-4020' && <TableHead className="text-right">PIS</TableHead>}
          {type === 'R-4020' && <TableHead className="text-right">COFINS</TableHead>}
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((e) => (
          <TableRow key={e.id}>
            {!isFechamento && <TableCell className="font-mono text-xs">{e.cnpj_prestador || e.cnpj_beneficiario || '—'}</TableCell>}
            {!isFechamento && <TableCell className="text-xs">{e.nota_fiscal || '—'} / {e.data_emissao || '—'}</TableCell>}
            <TableCell className="text-right">{formatBRL(Number(e.vr_bruto || 0))}</TableCell>
            {type === 'R-2010' && <TableCell className="text-right">{formatBRL(Number(e.vr_ret_inss || 0))}</TableCell>}
            {type === 'R-4020' && <TableCell className="text-right">{formatBRL(Number(e.vr_ret_ir || 0))}</TableCell>}
            {type === 'R-4020' && <TableCell className="text-right">{formatBRL(Number(e.vr_ret_csll || 0))}</TableCell>}
            {type === 'R-4020' && <TableCell className="text-right">{formatBRL(Number(e.vr_ret_pis || 0))}</TableCell>}
            {type === 'R-4020' && <TableCell className="text-right">{formatBRL(Number(e.vr_ret_cofins || 0))}</TableCell>}
            <TableCell><Badge variant="secondary">{e.status}</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
