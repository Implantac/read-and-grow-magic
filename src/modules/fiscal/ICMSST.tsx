import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Percent, Plus } from 'lucide-react';
import { useICMSSTRules, useUpsertICMSST } from '@/hooks/fiscal/useTaxAdvancedRules';

export default function ICMSSTPage() {
  const { data: rules = [], isLoading } = useICMSSTRules();
  const upsert = useUpsertICMSST();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>({ name: '', mva_original: 0, internal_rate: 18, interstate_rate: 12, active: true, priority: 0 });

  const onSave = async () => {
    await upsert.mutateAsync(editing);
    setOpen(false);
    setEditing({ name: '', mva_original: 0, internal_rate: 18, interstate_rate: 12, active: true, priority: 0 });
  };

  return (
    <PageContainer>
      <PageHeader
        title="ICMS Substituição Tributária"
        description="Regras de cálculo automático de ICMS ST por NCM/UF"
        actions={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing({ name: '', mva_original: 0, internal_rate: 18, interstate_rate: 12, active: true, priority: 0 }); }}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nova Regra</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Regra ICMS ST</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Nome</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
                <div><Label>NCM</Label><Input value={editing.ncm || ''} onChange={(e) => setEditing({ ...editing, ncm: e.target.value })} /></div>
                <div><Label>CEST</Label><Input value={editing.cest || ''} onChange={(e) => setEditing({ ...editing, cest: e.target.value })} /></div>
                <div><Label>UF Origem</Label><Input value={editing.uf_origin || ''} onChange={(e) => setEditing({ ...editing, uf_origin: e.target.value.toUpperCase() })} maxLength={2} /></div>
                <div><Label>UF Destino</Label><Input value={editing.uf_destination || ''} onChange={(e) => setEditing({ ...editing, uf_destination: e.target.value.toUpperCase() })} maxLength={2} /></div>
                <div><Label>MVA Original (%)</Label><Input type="number" step="0.01" value={editing.mva_original} onChange={(e) => setEditing({ ...editing, mva_original: Number(e.target.value) })} /></div>
                <div><Label>MVA Ajustada (%)</Label><Input type="number" step="0.01" value={editing.mva_adjusted || 0} onChange={(e) => setEditing({ ...editing, mva_adjusted: Number(e.target.value) })} /></div>
                <div><Label>Alíq. Interna (%)</Label><Input type="number" step="0.01" value={editing.internal_rate} onChange={(e) => setEditing({ ...editing, internal_rate: Number(e.target.value) })} /></div>
                <div><Label>Alíq. Interestadual (%)</Label><Input type="number" step="0.01" value={editing.interstate_rate} onChange={(e) => setEditing({ ...editing, interstate_rate: Number(e.target.value) })} /></div>
                <div><Label>Redução de Base (%)</Label><Input type="number" step="0.01" value={editing.reduction_base || 0} onChange={(e) => setEditing({ ...editing, reduction_base: Number(e.target.value) })} /></div>
                <div><Label>Prioridade</Label><Input type="number" value={editing.priority} onChange={(e) => setEditing({ ...editing, priority: Number(e.target.value) })} /></div>
                <div className="flex items-center gap-2 col-span-2"><Switch checked={editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} /><Label>Ativa</Label></div>
              </div>
              <Button onClick={onSave} disabled={upsert.isPending} className="w-full">Salvar</Button>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardHeader><CardTitle>Regras ICMS ST ({rules.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="py-8 text-center text-muted-foreground">Carregando…</div> : rules.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Nenhuma regra cadastrada.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Nome</TableHead><TableHead>NCM</TableHead><TableHead>UF Dest.</TableHead><TableHead className="text-right">MVA</TableHead><TableHead className="text-right">Interna</TableHead><TableHead className="text-right">Interest.</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => { setEditing(r); setOpen(true); }}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-sm">{r.ncm || '*'}</TableCell>
                    <TableCell className="text-sm">{r.uf_destination || '*'}</TableCell>
                    <TableCell className="text-right">{Number(r.mva_adjusted || r.mva_original).toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{Number(r.internal_rate).toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{Number(r.interstate_rate).toFixed(2)}%</TableCell>
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
