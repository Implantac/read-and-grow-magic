import { useState } from 'react';
import { TabsContent } from '@/ui/base/tabs';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Skeleton } from '@/ui/base/skeleton';
import { Badge } from '@/ui/base/badge';
import { Plus, StickyNote } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TIMELINE_EVENT_TYPES, useCreateTimelineEvent } from '@/hooks/commercial/useClientTimeline';
import { EVENT_ICONS } from './constants';

interface Props {
  clientId: string;
  timeline: any[];
  loading: boolean;
}

export function TimelineTab({ clientId, timeline, loading }: Props) {
  const createEvent = useCreateTimelineEvent();
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ event_type: 'note', title: '', description: '' });

  const handleAddEvent = async () => {
    if (!eventForm.title) return;
    await createEvent.mutateAsync({
      client_id: clientId,
      event_type: eventForm.event_type,
      title: eventForm.title,
      description: eventForm.description || null,
    });
    setEventForm({ event_type: 'note', title: '', description: '' });
    setShowEventForm(false);
  };

  return (
    <TabsContent value="timeline" className="mt-4">
      <div className="flex justify-end mb-3">
        <Button variant="outline" size="sm" onClick={() => setShowEventForm(!showEventForm)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Registrar Evento
        </Button>
      </div>

      {showEventForm && (
        <div className="border rounded-lg p-3 mb-4 space-y-2 bg-muted/30">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={eventForm.event_type} onValueChange={v => setEventForm(p => ({ ...p, event_type: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMELINE_EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Título *</Label>
              <Input className="h-8 text-xs" value={eventForm.title} onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea className="text-xs" rows={2} value={eventForm.description} onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowEventForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleAddEvent} disabled={createEvent.isPending}>Salvar</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : timeline.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">Nenhum evento registrado</p>
      ) : (
        <div className="relative space-y-0 max-h-[350px] overflow-y-auto">
          <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
          {timeline.map(ev => (
            <div key={ev.id} className="relative pl-10 py-2.5">
              <div className="absolute left-2.5 top-3.5 w-3 h-3 rounded-full bg-background border-2 border-primary flex items-center justify-center" />
              <div className="flex items-start gap-2">
                <div className="mt-0.5 text-muted-foreground">{EVENT_ICONS[ev.event_type] || <StickyNote className="h-3.5 w-3.5" />}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{ev.title}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5">
                      {TIMELINE_EVENT_TYPES.find(t => t.value === ev.event_type)?.label || ev.event_type}
                    </Badge>
                  </div>
                  {ev.description && <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>}
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(ev.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    {ev.user_name && ` • ${ev.user_name}`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </TabsContent>
  );
}
