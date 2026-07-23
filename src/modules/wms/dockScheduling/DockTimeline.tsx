import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Input } from '@/ui/base/input';
import { DAY_END_HOUR, DAY_START_HOUR, STATUS_LABEL, type Appt, type Dock } from './types';

function blockStyle(a: Appt) {
  const s = new Date(a.scheduled_start);
  const e = new Date(a.scheduled_end);
  const startMin = s.getHours() * 60 + s.getMinutes() - DAY_START_HOUR * 60;
  const dur = Math.max(15, (e.getTime() - s.getTime()) / 60000);
  const total = (DAY_END_HOUR - DAY_START_HOUR) * 60;
  return { left: `${(startMin / total) * 100}%`, width: `${(dur / total) * 100}%` };
}

export function DockTimeline({
  day, setDay, docks, byDock,
}: { day: string; setDay: (v: string) => void; docks: Dock[]; byDock: Map<string, Appt[]> }) {
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Timeline do dia</CardTitle>
        <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="w-auto" />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid" style={{ gridTemplateColumns: '160px 1fr' }}>
              <div />
              <div className="relative h-6 border-b">
                {hours.map((h, i) => (
                  <div key={h} className="absolute top-0 text-xs text-muted-foreground"
                    style={{ left: `${(i / (hours.length - 1)) * 100}%`, transform: 'translateX(-50%)' }}>
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>
              {docks.length === 0 && (
                <div className="col-span-2 py-8 text-center text-sm text-muted-foreground">
                  Nenhuma doca cadastrada.
                </div>
              )}
              {docks.map((d) => (
                <div key={d.id} className="contents">
                  <div className="py-3 pr-2 text-sm font-medium border-b">
                    {d.name}
                    <div className="text-xs text-muted-foreground">{d.type || '—'}</div>
                  </div>
                  <div className="relative h-14 border-b bg-muted/20">
                    {(byDock.get(d.id) || []).map((a) => (
                      <div key={a.id}
                        className="absolute top-2 bottom-2 rounded-md border bg-primary/15 hover:bg-primary/25 transition-colors px-2 py-1 overflow-hidden cursor-pointer"
                        style={blockStyle(a)}
                        title={`${a.carrier_name || '—'} • ${a.plate || ''} • ${STATUS_LABEL[a.status] || a.status}`}>
                        <div className="text-xs font-medium truncate">{a.carrier_name || 'Sem transportadora'}</div>
                        <div className="text-[10px] truncate">{a.plate} • {STATUS_LABEL[a.status] || a.status}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
