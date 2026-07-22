import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Truck, CheckCircle, Tag, Hand, PackageCheck } from 'lucide-react';
import { format } from 'date-fns';
import { STAGE_LABEL, type OrderRow, type ShipmentStage, type StageForm } from './types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  order: OrderRow | null;
  form: StageForm;
  setForm: (f: StageForm) => void;
  shipmentInfo: { shipment: any; events: any[] } | undefined;
  onSubmit: () => void;
  submitting: boolean;
}

export function TrackingDialog({ open, onOpenChange, order, form, setForm, shipmentInfo, onSubmit, submitting }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Tracking — Pedido {order?.number}
          </DialogTitle>
          <DialogDescription>
            {order?.client_name} · Registra a etapa da expedição (conferido, etiquetado, coletado...) e adiciona evento ao rastreamento. Isolado por empresa via RLS.
          </DialogDescription>
        </DialogHeader>

        {shipmentInfo?.shipment && (
          <div className="rounded-md border bg-muted/30 p-3 text-sm grid grid-cols-2 gap-2">
            <div><span className="text-muted-foreground">Expedição:</span> <span className="font-mono">{shipmentInfo.shipment.shipment_number}</span></div>
            <div><span className="text-muted-foreground">Status atual:</span> <Badge variant="outline">{STAGE_LABEL[shipmentInfo.shipment.status as ShipmentStage] || shipmentInfo.shipment.status}</Badge></div>
            <div><span className="text-muted-foreground">Transportadora:</span> {shipmentInfo.shipment.carrier || '—'}</div>
            <div><span className="text-muted-foreground">Tracking:</span> <span className="font-mono">{shipmentInfo.shipment.tracking_number || '—'}</span></div>
          </div>
        )}

        <div className="grid gap-3">
          <div>
            <Label>Nova etapa</Label>
            <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as ShipmentStage })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="conferred"><CheckCircle className="h-3 w-3 inline mr-2" />Conferido</SelectItem>
                <SelectItem value="labeled"><Tag className="h-3 w-3 inline mr-2" />Etiquetado</SelectItem>
                <SelectItem value="collected"><Hand className="h-3 w-3 inline mr-2" />Coletado pela transportadora</SelectItem>
                <SelectItem value="shipped"><Truck className="h-3 w-3 inline mr-2" />Expedido</SelectItem>
                <SelectItem value="delivered"><PackageCheck className="h-3 w-3 inline mr-2" />Entregue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Transportadora</Label>
              <Input value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} placeholder="Ex.: Correios, Jadlog" />
            </div>
            <div>
              <Label>Código de rastreamento</Label>
              <Input value={form.tracking_number} onChange={(e) => setForm({ ...form, tracking_number: e.target.value })} placeholder="Ex.: BR123456789" />
            </div>
          </div>

          <div>
            <Label>Local / Doca</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ex.: Doca 02, CD São Paulo" />
          </div>

          <div>
            <Label>Observação</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Detalhes opcionais do evento" />
          </div>
        </div>

        {shipmentInfo && shipmentInfo.events.length > 0 && (
          <div className="border-t pt-3">
            <Label className="mb-2 block">Histórico de eventos</Label>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {shipmentInfo.events.map((ev: any) => (
                <div key={ev.id} className="text-xs border-l-2 border-primary/50 pl-2 py-1">
                  <div className="font-medium">{ev.description}</div>
                  <div className="text-muted-foreground">
                    {format(new Date(ev.occurred_at), 'dd/MM/yyyy HH:mm')}
                    {ev.location && ` · ${ev.location}`}
                    {ev.registered_by && ` · ${ev.registered_by}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={onSubmit} disabled={submitting}>
            Registrar {STAGE_LABEL[form.stage]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
