import { Button } from '@/ui/base/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Input } from '@/ui/base/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Textarea } from '@/ui/base/textarea';
import type { ClientInsight } from '@/hooks/commercial/useSalesIntelligence';

export interface FollowUpData {
  type: string;
  subject: string;
  description: string;
  scheduled_date: string;
}

interface FollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClient: ClientInsight | null;
  data: FollowUpData;
  setData: (updater: (prev: FollowUpData) => FollowUpData) => void;
  isPending: boolean;
  onSave: () => void;
}

export function FollowUpDialog({ open, onOpenChange, selectedClient, data, setData, isPending, onSave }: FollowUpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar Follow-up</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {selectedClient && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium">{selectedClient.clientName}</p>
              <p className="text-xs text-muted-foreground">{selectedClient.suggestedAction}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select value={data.type} onValueChange={v => setData(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">📞 Ligação</SelectItem>
                  <SelectItem value="email">📧 E-mail</SelectItem>
                  <SelectItem value="visit">🏢 Visita</SelectItem>
                  <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Data/Hora</label>
              <Input type="datetime-local" value={data.scheduled_date}
                onChange={e => setData(p => ({ ...p, scheduled_date: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Assunto</label>
            <Input value={data.subject} onChange={e => setData(p => ({ ...p, subject: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium">Observações</label>
            <Textarea value={data.description} onChange={e => setData(p => ({ ...p, description: e.target.value }))} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={isPending}>Agendar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
