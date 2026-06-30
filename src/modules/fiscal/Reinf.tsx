import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Badge } from '@/ui/base/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui/base/tabs';
import { useReinf, type ReinfEvent, type ReinfPeriod } from '@/hooks/fiscal/useReinf';
import { formatBRL } from '@/lib/formatters';
import { toCsv, downloadCsv } from '@/lib/csv';

const R2099_HEADERS = [
  { key: 'event_type', label: 'Evento' },
  { key: 'competencia', label: 'Competência' },
  { key: 'status', label: 'Status' },
  { key: 'qtd_r2010', label: 'Qtd Eventos R-2010' },
  { key: 'vr_base_inss', label: 'Base INSS' },
  { key: 'vr_ret_inss', label: 'INSS Retido (DARF)' },
  { key: 'data_fechamento', label: 'Data Fechamento' },
];

const R4099_HEADERS = [
  { key: 'event_type', label: 'Evento' },
  { key: 'competencia', label: 'Competência' },
  { key: 'status', label: 'Status' },
  { key: 'qtd_r4020', label: 'Qtd Eventos R-4020' },
  { key: 'vr_ret_ir', label: 'IR Retido' },
  { key: 'vr_ret_csll', label: 'CSLL Retido' },
  { key: 'vr_ret_pis', label: 'PIS Retido' },
  { key: 'vr_ret_cofins', label: 'COFINS Retido' },
  { key: 'vr_total_darf', label: 'Total DARF' },
  { key: 'data_fechamento', label: 'Data Fechamento' },
];

function fmt(n: number): string {
  return n.toFixed(2).replace('.', ',');
}

function buildR2099Rows(events: ReinfEvent[], period: ReinfPeriod | null): Record<string, string>[] {
  const t = period?.totals || {};
  const base = Number(t.r2010_inss ?? 0) > 0 ? Number(t.r2010_inss ?? 0) / 0.11 : 0;
  const rows: Record<string, string>[] = events.map((e) => ({
    event_type: String(e.event_type),
    competencia: period?.competencia || '',
    status: e.status,
    qtd_r2010: String(t.r2010_qtd ?? 0),
    vr_base_inss: fmt(base),
    vr_ret_inss: fmt(Number(t.r2010_inss ?? 0)),
    data_fechamento: period?.closed_at?.slice(0, 10) || '',
  }));
  rows.push({
    event_type: 'TOTAL', competencia: period?.competencia || '', status: '',
    qtd_r2010: String(t.r2010_qtd ?? 0),
    vr_base_inss: fmt(base),
    vr_ret_inss: fmt(Number(t.r2010_inss ?? 0)),
    data_fechamento: '',
  });
  return rows;
}

function buildR4099Rows(events: ReinfEvent[], period: ReinfPeriod | null): Record<string, string>[] {
  const t = period?.totals || {};
  const ir = Number(t.r4020_ir ?? 0);
  const csll = Number(t.r4020_csll ?? 0);
  const pis = Number(t.r4020_pis ?? 0);
  const cofins = Number(t.r4020_cofins ?? 0);
  const total = ir + csll + pis + cofins;
  const rows: Record<string, string>[] = events.map((e) => ({
    event_type: String(e.event_type),
    competencia: period?.competencia || '',
    status: e.status,
    qtd_r4020: String(t.r4020_qtd ?? 0),
    vr_ret_ir: fmt(ir),
    vr_ret_csll: fmt(csll),
    vr_ret_pis: fmt(pis),
    vr_ret_cofins: fmt(cofins),
    vr_total_darf: fmt(total),
    data_fechamento: period?.closed_at?.slice(0, 10) || '',
  }));
  rows.push({
    event_type: 'TOTAL', competencia: period?.competencia || '', status: '',
    qtd_r4020: String(t.r4020_qtd ?? 0),
    vr_ret_ir: fmt(ir), vr_ret_csll: fmt(csll), vr_ret_pis: fmt(pis), vr_ret_cofins: fmt(cofins),
    vr_total_darf: fmt(total), data_fechamento: '',
  });
  return rows;
}
import { Calendar, Download, FileText, Lock, RefreshCcw, Sparkles, Unlock } from 'lucide-react';

const R2010_HEADERS = [
  { key: 'event_type', label: 'Evento' },
  { key: 'cnpj_prestador', label: 'CNPJ Prestador' },
  { key: 'nota_fiscal', label: 'Nota Fiscal' },
  { key: 'data_emissao', label: 'Data Emissão' },
  { key: 'cod_serv', label: 'Cód. Serviço' },
  { key: 'vr_bruto', label: 'Valor Bruto' },
  { key: 'vr_base_inss', label: 'Base INSS' },
  { key: 'vr_ret_inss', label: 'INSS Retido (11%)' },
  { key: 'status', label: 'Status' },
];

const R4020_HEADERS = [
  { key: 'event_type', label: 'Evento' },
  { key: 'cnpj_beneficiario', label: 'CNPJ Beneficiário' },
  { key: 'nota_fiscal', label: 'Nota Fiscal' },
  { key: 'data_emissao', label: 'Data Emissão' },
  { key: 'cod_receita', label: 'Cód. Receita' },
  { key: 'vr_bruto', label: 'Valor Bruto' },
  { key: 'vr_ret_ir', label: 'IR (1,5%)' },
  { key: 'vr_ret_csll', label: 'CSLL (1%)' },
  { key: 'vr_ret_pis', label: 'PIS (0,65%)' },
  { key: 'vr_ret_cofins', label: 'COFINS (3%)' },
  { key: 'vr_total_ret', label: 'Total Retido' },
  { key: 'status', label: 'Status' },
];

function num(v: unknown): number {
  return Number(v || 0);
}

function buildR2010Rows(events: ReinfEvent[]): Record<string, string>[] {
  const rows: Record<string, string>[] = events.map((e) => ({
    event_type: String(e.event_type),
    cnpj_prestador: e.cnpj_prestador || '',
    nota_fiscal: e.nota_fiscal || '',
    data_emissao: e.data_emissao || '',
    cod_serv: e.cod_serv || '',
    vr_bruto: num(e.vr_bruto).toFixed(2).replace('.', ','),
    vr_base_inss: num(e.vr_bruto).toFixed(2).replace('.', ','),
    vr_ret_inss: num(e.vr_ret_inss).toFixed(2).replace('.', ','),
    status: e.status,
  }));
  const totalBruto = events.reduce((s, e) => s + num(e.vr_bruto), 0);
  const totalInss = events.reduce((s, e) => s + num(e.vr_ret_inss), 0);
  rows.push({
    event_type: 'TOTAL',
    cnpj_prestador: '', nota_fiscal: '', data_emissao: '', cod_serv: '',
    vr_bruto: totalBruto.toFixed(2).replace('.', ','),
    vr_base_inss: totalBruto.toFixed(2).replace('.', ','),
    vr_ret_inss: totalInss.toFixed(2).replace('.', ','),
    status: '',
  });
  return rows;
}

function buildR4020Rows(events: ReinfEvent[]): Record<string, string>[] {
  const rows: Record<string, string>[] = events.map((e) => {
    const total = num(e.vr_ret_ir) + num(e.vr_ret_csll) + num(e.vr_ret_pis) + num(e.vr_ret_cofins);
    return {
      event_type: String(e.event_type),
      cnpj_beneficiario: e.cnpj_beneficiario || '',
      nota_fiscal: e.nota_fiscal || '',
      data_emissao: e.data_emissao || '',
      cod_receita: e.cod_receita || '',
      vr_bruto: num(e.vr_bruto).toFixed(2).replace('.', ','),
      vr_ret_ir: num(e.vr_ret_ir).toFixed(2).replace('.', ','),
      vr_ret_csll: num(e.vr_ret_csll).toFixed(2).replace('.', ','),
      vr_ret_pis: num(e.vr_ret_pis).toFixed(2).replace('.', ','),
      vr_ret_cofins: num(e.vr_ret_cofins).toFixed(2).replace('.', ','),
      vr_total_ret: total.toFixed(2).replace('.', ','),
      status: e.status,
    };
  });
  const sum = (k: keyof ReinfEvent) => events.reduce((s, e) => s + num(e[k] as any), 0);
  const totals = {
    bruto: sum('vr_bruto'), ir: sum('vr_ret_ir'), csll: sum('vr_ret_csll'),
    pis: sum('vr_ret_pis'), cofins: sum('vr_ret_cofins'),
  };
  const totalRet = totals.ir + totals.csll + totals.pis + totals.cofins;
  rows.push({
    event_type: 'TOTAL',
    cnpj_beneficiario: '', nota_fiscal: '', data_emissao: '', cod_receita: '',
    vr_bruto: totals.bruto.toFixed(2).replace('.', ','),
    vr_ret_ir: totals.ir.toFixed(2).replace('.', ','),
    vr_ret_csll: totals.csll.toFixed(2).replace('.', ','),
    vr_ret_pis: totals.pis.toFixed(2).replace('.', ','),
    vr_ret_cofins: totals.cofins.toFixed(2).replace('.', ','),
    vr_total_ret: totalRet.toFixed(2).replace('.', ','),
    status: '',
  });
  return rows;
}

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
        <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Eventos da competência</CardTitle>
            <CardDescription>{loading ? 'Carregando…' : `${events.length} evento(s)`}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={byType('R-2010').length === 0}
              onClick={() => {
                const rows = buildR2010Rows(byType('R-2010'));
                downloadCsv(`reinf_R-2010_${competencia.slice(0, 7)}.csv`, toCsv(rows, R2010_HEADERS));
              }}
            >
              <Download className="h-4 w-4 mr-2" /> CSV R-2010
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={byType('R-4020').length === 0}
              onClick={() => {
                const rows = buildR4020Rows(byType('R-4020'));
                downloadCsv(`reinf_R-4020_${competencia.slice(0, 7)}.csv`, toCsv(rows, R4020_HEADERS));
              }}
            >
              <Download className="h-4 w-4 mr-2" /> CSV R-4020
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={byType('R-2099').length === 0}
              onClick={() => {
                const rows = buildR2099Rows(byType('R-2099'), currentPeriod);
                downloadCsv(`reinf_R-2099_${competencia.slice(0, 7)}.csv`, toCsv(rows, R2099_HEADERS));
              }}
            >
              <Download className="h-4 w-4 mr-2" /> CSV R-2099
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={byType('R-4099').length === 0}
              onClick={() => {
                const rows = buildR4099Rows(byType('R-4099'), currentPeriod);
                downloadCsv(`reinf_R-4099_${competencia.slice(0, 7)}.csv`, toCsv(rows, R4099_HEADERS));
              }}
            >
              <Download className="h-4 w-4 mr-2" /> CSV R-4099
            </Button>
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
