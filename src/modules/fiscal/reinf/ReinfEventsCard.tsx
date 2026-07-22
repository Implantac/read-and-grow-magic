import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui/base/tabs';
import { Download, FileX } from 'lucide-react';
import { EmptyState } from '@/shared/components/EmptyState';
import { formatBRL } from '@/lib/formatters';
import { toCsv, downloadCsv } from '@/lib/csv';
import type { ReinfEvent } from '@/hooks/fiscal/useReinf';
import {
  R2099_HEADERS, R4099_HEADERS,
  buildR2099Rows, buildR4099Rows,
  validateR2099Rows, validateR4099Rows,
} from '../reinfCsv';
import { R2010_HEADERS, R4020_HEADERS, buildR2010Rows, buildR4020Rows, guardExport } from './csvBuilders';

interface Props {
  events: ReinfEvent[];
  loading: boolean;
  competencia: string;
  currentPeriod: any;
}

export function ReinfEventsCard({ events, loading, competencia, currentPeriod }: Props) {
  const byType = (t: string) => events.filter((e) => e.event_type === t);

  return (
    <Card className="mt-6 shadow-lg border-primary/10">
      <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg">Eventos da competência</CardTitle>
          <CardDescription>{loading ? 'Carregando…' : `${events.length} evento(s)`}</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={byType('R-2010').length === 0} onClick={() => {
            const rows = buildR2010Rows(byType('R-2010'));
            downloadCsv(`reinf_R-2010_${competencia.slice(0, 7)}.csv`, toCsv(rows, R2010_HEADERS));
          }}>
            <Download className="h-4 w-4 mr-2" /> CSV R-2010
          </Button>
          <Button size="sm" variant="outline" disabled={byType('R-2020').length === 0} onClick={() => {
            const rows = buildR2010Rows(byType('R-2020'));
            downloadCsv(`reinf_R-2020_${competencia.slice(0, 7)}.csv`, toCsv(rows, R2010_HEADERS));
          }}>
            <Download className="h-4 w-4 mr-2" /> CSV R-2020
          </Button>
          <Button size="sm" variant="outline" disabled={byType('R-4020').length === 0} onClick={() => {
            const rows = buildR4020Rows(byType('R-4020'));
            downloadCsv(`reinf_R-4020_${competencia.slice(0, 7)}.csv`, toCsv(rows, R4020_HEADERS));
          }}>
            <Download className="h-4 w-4 mr-2" /> CSV R-4020
          </Button>
          <Button size="sm" variant="outline" disabled={byType('R-2099').length === 0} onClick={() => {
            const rows = buildR2099Rows(byType('R-2099'), currentPeriod);
            guardExport('CSV R-2099',
              () => validateR2099Rows(rows, currentPeriod),
              () => downloadCsv(`reinf_R-2099_${competencia.slice(0, 7)}.csv`, toCsv(rows, R2099_HEADERS)),
            );
          }}>
            <Download className="h-4 w-4 mr-2" /> CSV R-2099
          </Button>
          <Button size="sm" variant="outline" disabled={byType('R-4099').length === 0} onClick={() => {
            const rows = buildR4099Rows(byType('R-4099'), currentPeriod);
            guardExport('CSV R-4099',
              () => validateR4099Rows(rows, currentPeriod),
              () => downloadCsv(`reinf_R-4099_${competencia.slice(0, 7)}.csv`, toCsv(rows, R4099_HEADERS)),
            );
          }}>
            <Download className="h-4 w-4 mr-2" /> CSV R-4099
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="R-2010">
          <TabsList>
            <TabsTrigger value="R-2010">R-2010 ({byType('R-2010').length})</TabsTrigger>
            <TabsTrigger value="R-2020">R-2020 ({byType('R-2020').length})</TabsTrigger>
            <TabsTrigger value="R-4020">R-4020 ({byType('R-4020').length})</TabsTrigger>
            <TabsTrigger value="R-2099">R-2099 ({byType('R-2099').length})</TabsTrigger>
            <TabsTrigger value="R-4099">R-4099 ({byType('R-4099').length})</TabsTrigger>
          </TabsList>

          {(['R-2010', 'R-2020', 'R-4020', 'R-2099', 'R-4099'] as const).map((t) => (
            <TabsContent key={t} value={t}>
              <EventTable events={byType(t)} type={t} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function EventTable({ events, type }: { events: any[]; type: string }) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={FileX}
        title={`Nenhum evento ${type}`}
        description="Não há eventos gerados nesta competência para este tipo de registro."
      />
    );
  }
  const isFechamento = type === 'R-2099' || type === 'R-4099';
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {!isFechamento && <TableHead>CNPJ</TableHead>}
          {!isFechamento && <TableHead>NF / Emissão</TableHead>}
          <TableHead className="text-right">Valor</TableHead>
          {(type === 'R-2010' || type === 'R-2020') && <TableHead className="text-right">INSS</TableHead>}
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
            {(type === 'R-2010' || type === 'R-2020') && <TableCell className="text-right">{formatBRL(Number(e.vr_ret_inss || 0))}</TableCell>}
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
