import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Badge } from '@/ui/base/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/base/dialog';
import { Switch } from '@/ui/base/switch';
import { Globe, Plus } from 'lucide-react';
import { EmptyState } from '@/shared/components/EmptyState';
import { useDIFALRules, useUpsertDIFAL } from '@/hooks/fiscal/useTaxAdvancedRules';
import { toSafeNumber } from '@/lib/numericValidation';

export default function DIFALPage() {
  const { data: rules = [], isLoading } = useDIFALRules();
  const upsert = useUpsertDIFAL();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>({ name: '', uf_origin: '', uf_destination: '', internal_rate_destination: 18, interstate_rate: 12, fcp_rate: 0, active: true });

  const onSave = async () => {
    await upsert.mutateAsync(editing);
    setOpen(false);
    setEditing({ name: '', uf_origin: '', uf_destination: '', internal_rate_destination: 18, interstate_rate: 12, fcp_rate: 0, active: true });
  };

  return (
    <PageContainer>
      <PageHeader
        title="DIFAL — Diferencial de Alíquota"
        description="Cálculo automático em vendas interestaduais a consumidor final"
        actions={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing({ name: '', uf_origin: '', uf_destination: '', internal_rate_destination: 18, interstate_rate: 12, fcp_rate: 0, active: true }); }}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nova Regra DIFAL</Button></DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>Regra DIFAL</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Nome</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
                <div><Label>UF Origem</Label><Input value={editing.uf_origin} onChange={(e) => setEditing({ ...editing, uf_origin: e.target.value.toUpperCase() })} maxLength={2} /></div>
                <div><Label>UF Destino</Label><Input value={editing.uf_destination} onChange={(e) => setEditing({ ...editing, uf_destination: e.target.value.toUpperCase() })} maxLength={2} /></div>
                <div><Label>Alíq. Interna Destino (%)</Label><Input type="number" step="0.01" value={editing.internal_rate_destination} onChange={(e) => setEditing({ ...editing, internal_rate_destination: toSafeNumber(e.target.value) })} /></div>
                <div><Label>Alíq. Interestadual (%)</Label><Input type="number" step="0.01" value={editing.interstate_rate} onChange={(e) => setEditing({ ...editing, interstate_rate: toSafeNumber(e.target.value) })} /></div>
                <div><Label>FCP (%)</Label><Input type="number" step="0.01" value={editing.fcp_rate || 0} onChange={(e) => setEditing({ ...editing, fcp_rate: toSafeNumber(e.target.value) })} /></div>
                <div className="flex items-center gap-2"><Switch checked={editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} /><Label>Ativa</Label></div>
              </div>
              <Button onClick={onSave} disabled={upsert.isPending} className="w-full">Salvar</Button>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardHeader><CardTitle>Regras DIFAL ({rules.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="py-8 text-center text-muted-foreground">Carregando…</div> : rules.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Nenhuma regra cadastrada.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Nome</TableHead><TableHead>Origem</TableHead><TableHead>Destino</TableHead><TableHead className="text-right">Alíq. Dest.</TableHead><TableHead className="text-right">Interest.</TableHead><TableHead className="text-right">DIFAL</TableHead><TableHead className="text-right">FCP</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => { setEditing(r); setOpen(true); }}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-sm">{r.uf_origin}</TableCell>
                    <TableCell className="text-sm">{r.uf_destination}</TableCell>
                    <TableCell className="text-right">{Number(r.internal_rate_destination).toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{Number(r.interstate_rate).toFixed(2)}%</TableCell>
                    <TableCell className="text-right font-semibold">{(Number(r.internal_rate_destination) - Number(r.interstate_rate)).toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{Number(r.fcp_rate || 0).toFixed(2)}%</TableCell>
                    <TableCell><Badge variant={r.active ? 'default' : 'secondary'}>{r.active ? 'Ativa' : 'Inativa'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
