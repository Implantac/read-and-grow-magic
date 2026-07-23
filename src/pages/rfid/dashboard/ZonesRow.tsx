import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Skeleton } from '@/ui/base/skeleton';
import { AlertTriangle, MapPin, Wifi, WifiOff } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { EmptyState } from '@/shared/components/EmptyState';
import { ZONE_COLORS } from './constants';

const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' };

interface Props {
  loading: boolean;
  eventsByZone: { name: string; value: number; fill: string }[];
  readers: any[];
  tags: any[];
  offlineReaders: any[];
  tagAlerts: any[];
}

export function ZonesRow({ loading, eventsByZone, readers, tags, offlineReaders, tagAlerts }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Eventos por Zona</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-[260px] w-full" /> : eventsByZone.length === 0 ? (
            <EmptyState icon={MapPin} title="Sem dados de zona" description="Eventos aparecerão conforme leituras acontecerem no armazém." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={eventsByZone} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" fontSize={11} className="fill-muted-foreground" />
                <YAxis dataKey="name" type="category" width={90} fontSize={11} className="fill-muted-foreground" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Eventos">
                  {eventsByZone.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Mapa de Zonas</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-[260px] w-full" /> : (
            <div className="grid grid-cols-2 gap-3 h-[260px]">
              {['Recebimento', 'Armazenagem', 'Picking', 'Expedição'].map(zone => {
                const zoneReaders = readers.filter(r => r.zone === zone);
                const zoneTags = tags.filter(t => t.location === zone);
                const activeCount = zoneReaders.filter(r => r.status === 'active').length;
                const color = ZONE_COLORS[zone] || 'hsl(var(--muted))';
                return (
                  <div key={zone} className="rounded-lg border-2 p-3 flex flex-col justify-between transition-all hover:shadow-md" style={{ borderColor: color, backgroundColor: `${color}10` }}>
                    <div>
                      <p className="text-xs font-semibold" style={{ color }}>{zone}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Wifi className="h-3 w-3" style={{ color }} />
                        <span className="text-xs text-muted-foreground">{activeCount}/{zoneReaders.length} leitores</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-bold tabular-nums">{zoneTags.length}</p>
                      <p className="text-[10px] text-muted-foreground">tags na zona</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-[260px] w-full" /> : (
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {offlineReaders.map(r => (
                <div key={r.id} className="flex items-start gap-2 p-2 rounded-md bg-destructive/5 border border-destructive/20">
                  <WifiOff className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">Leitor offline: {r.name}</p>
                    <p className="text-[10px] text-muted-foreground">{r.code} • {r.location || 'Sem local'}</p>
                  </div>
                </div>
              ))}
              {tagAlerts.map(t => (
                <div key={t.id} className="flex items-start gap-2 p-2 rounded-md bg-amber-500/5 border border-amber-500/20">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">
                      Tag {t.status === 'lost' ? 'perdida' : t.status === 'damaged' ? 'danificada' : 'sem leitura'}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">{t.epc}</p>
                    <p className="text-[10px] text-muted-foreground">{t.productName || 'Sem produto'}</p>
                  </div>
                  <Badge variant={t.status === 'lost' ? 'destructive' : 'outline'} className="text-[10px] shrink-0 ml-auto">
                    {t.status === 'lost' ? 'Perdida' : t.status === 'damaged' ? 'Danificada' : 'Inativa'}
                  </Badge>
                </div>
              ))}
              {offlineReaders.length === 0 && tagAlerts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Wifi className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">Nenhum alerta ativo</p>
                  <p className="text-xs">Todos os dispositivos operando normalmente</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
