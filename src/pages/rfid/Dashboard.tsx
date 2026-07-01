import { useMemo } from 'react';
import { useRFID } from '@/hooks/system/useRFIDQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Skeleton } from '@/ui/base/skeleton';
import { RefreshCw, Radio, Tag, Activity, AlertTriangle, Wifi, WifiOff, MapPin, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { format, subHours, startOfHour } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EmptyState } from '@/shared/components/EmptyState';

const ZONE_COLORS: Record<string, string> = {
  'Recebimento': 'hsl(var(--primary))',
  'Armazenagem': 'hsl(142 76% 36%)',
  'Picking': 'hsl(45 93% 47%)',
  'Expedição': 'hsl(262 83% 58%)',
  'Doca': 'hsl(199 89% 48%)',
};

const STATUS_COLORS = {
  active: 'hsl(142 76% 36%)',
  inactive: 'hsl(var(--muted-foreground))',
  maintenance: 'hsl(45 93% 47%)',
  error: 'hsl(var(--destructive))',
  lost: 'hsl(var(--destructive))',
  damaged: 'hsl(var(--muted-foreground))',
};

export default function RFIDDashboardPage() {
  const { readers, readersLoading, tags, tagsLoading, getEvents } = useRFID();
  const { data: events = [], isLoading: loadingEvents } = getEvents(500);
  
  const loading = readersLoading || tagsLoading || loadingEvents;
  
  // Create a summary derived from the data
  const summary = useMemo(() => ({
    totalReaders: readers.length,
    activeReaders: readers.filter(r => r.status === 'active').length,
    totalTags: tags.length,
    activeTags: tags.filter(t => t.status === 'active').length,
    eventsToday: events.length, // This should ideally come from a filtered query, but for now we use events
    unprocessedEvents: events.filter(e => !e.processed).length,
  }), [readers, tags, events]);

  const refetchReaders = () => {}; // Handled by React Query
  const refetchSummary = () => {};

  

  // Events per hour (last 12 hours)
  const eventsPerHour = useMemo(() => {
    const now = new Date();
    const hours: { hour: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const h = startOfHour(subHours(now, i));
      const nextH = startOfHour(subHours(now, i - 1));
      const count = events.filter(e => {
        const d = new Date(e.createdAt);
        return d >= h && d < nextH;
      }).length;
      hours.push({ hour: format(h, 'HH:mm'), count });
    }
    return hours;
  }, [events]);

  // Events by zone
  const eventsByZone = useMemo(() => {
    const zoneMap: Record<string, number> = {};
    events.forEach(e => {
      const z = e.zone || e.location || 'Sem zona';
      zoneMap[z] = (zoneMap[z] || 0) + 1;
    });
    return Object.entries(zoneMap)
      .map(([name, value]) => ({ name, value, fill: ZONE_COLORS[name] || 'hsl(var(--muted-foreground))' }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [events]);

  // Reader status distribution
  const readerStatusData = useMemo(() => {
    const statusMap: Record<string, number> = {};
    readers.forEach(r => { statusMap[r.status] = (statusMap[r.status] || 0) + 1; });
    const labels: Record<string, string> = { active: 'Ativos', inactive: 'Inativos', maintenance: 'Manutenção', error: 'Erro' };
    return Object.entries(statusMap).map(([key, value]) => ({
      name: labels[key] || key,
      value,
      fill: STATUS_COLORS[key as keyof typeof STATUS_COLORS] || 'hsl(var(--muted-foreground))',
    }));
  }, [readers]);

  // Tags with alerts (lost, damaged, or not read in 24h)
  const tagAlerts = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    return tags.filter(t =>
      t.status === 'lost' || t.status === 'damaged' ||
      (t.status === 'active' && t.lastReadAt && (now - new Date(t.lastReadAt).getTime() > dayMs))
    ).slice(0, 8);
  }, [tags]);

  // Readers offline (no heartbeat in 30min)
  const offlineReaders = useMemo(() => {
    const now = Date.now();
    const threshold = 30 * 60 * 1000;
    return readers.filter(r =>
      r.status === 'active' && (!r.lastHeartbeat || (now - new Date(r.lastHeartbeat).getTime() > threshold))
    );
  }, [readers]);

  const handleRefresh = () => {
    refetchReaders();
    refetchSummary();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard RFID</h1>
          <p className="text-muted-foreground">Visão geral do sistema de rastreamento RFID em tempo real</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-10 w-16 mb-1" /><Skeleton className="h-3 w-20" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-1"><Radio className="h-4 w-4 text-primary" /><span className="text-xs font-medium text-muted-foreground">Leitores</span></div>
                <p className="text-2xl font-bold tabular-nums">{summary.totalReaders}</p>
                <p className="text-xs text-muted-foreground">{summary.activeReaders} ativos</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-[hsl(142_76%_36%)]">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-1"><Tag className="h-4 w-4 text-[hsl(142,76%,36%)]" /><span className="text-xs font-medium text-muted-foreground">Tags</span></div>
                <p className="text-2xl font-bold tabular-nums">{summary.totalTags}</p>
                <p className="text-xs text-muted-foreground">{summary.activeTags} ativas</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-[hsl(199_89%_48%)]">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-1"><Activity className="h-4 w-4 text-[hsl(199,89%,48%)]" /><span className="text-xs font-medium text-muted-foreground">Eventos Hoje</span></div>
                <p className="text-2xl font-bold tabular-nums">{summary.eventsToday}</p>
                <p className="text-xs text-muted-foreground">{summary.unprocessedEvents} pendentes</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-[hsl(45_93%_47%)]">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-1"><AlertTriangle className="h-4 w-4 text-[hsl(45,93%,47%)]" /><span className="text-xs font-medium text-muted-foreground">Alertas Tags</span></div>
                <p className="text-2xl font-bold tabular-nums">{tagAlerts.length}</p>
                <p className="text-xs text-muted-foreground">perdidas/inativas</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-destructive">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-1"><WifiOff className="h-4 w-4 text-destructive" /><span className="text-xs font-medium text-muted-foreground">Offline</span></div>
                <p className="text-2xl font-bold tabular-nums">{offlineReaders.length}</p>
                <p className="text-xs text-muted-foreground">leitores sem sinal</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-[hsl(262_83%_58%)]">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-1"><Zap className="h-4 w-4 text-[hsl(262,83%,58%)]" /><span className="text-xs font-medium text-muted-foreground">Taxa Proc.</span></div>
                <p className="text-2xl font-bold tabular-nums">
                  {summary.eventsToday > 0
                    ? Math.round(((summary.eventsToday - summary.unprocessedEvents) / summary.eventsToday) * 100)
                    : 100}%
                </p>
                <p className="text-xs text-muted-foreground">processamento</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events per Hour */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Leituras por Hora (últimas 12h)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[240px] w-full" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={eventsPerHour}>
                  <defs>
                    <linearGradient id="rfidGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="hour" fontSize={11} className="fill-muted-foreground" />
                  <YAxis fontSize={11} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#rfidGradient)" strokeWidth={2} name="Leituras" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Reader Status Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Status dos Leitores</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[240px] w-full" /> : readerStatusData.length === 0 ? (
              <EmptyState icon={Radio} title="Nenhum leitor cadastrado" description="Cadastre leitores RFID para monitorar status em tempo real." />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={readerStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`} fontSize={11}>
                    {readerStatusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second Row: Zone Bar + Zone Map + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events by Zone */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Eventos por Zona</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[260px] w-full" /> : eventsByZone.length === 0 ? (
              <EmptyState icon={MapPin} title="Sem dados de zona" description="Eventos aparecerão conforme leituras acontecerem no armazém." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={eventsByZone} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" fontSize={11} className="fill-muted-foreground" />
                  <YAxis dataKey="name" type="category" width={90} fontSize={11} className="fill-muted-foreground" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Eventos">
                    {eventsByZone.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Zone Map (visual representation) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Mapa de Zonas</CardTitle>
          </CardHeader>
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

        {/* Alerts Panel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Alertas
            </CardTitle>
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

      {/* Recent Events Feed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            Últimas Leituras
            <Badge variant="outline" className="animate-pulse text-[10px]">TEMPO REAL</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-[120px] w-full" /> : events.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">Nenhum evento registrado ainda.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {events.slice(0, 8).map(event => {
                const typeLabels: Record<string, string> = { read: 'Leitura', entry: 'Entrada', exit: 'Saída', transfer: 'Transfer.', inventory: 'Inventário' };
                const typeColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = { read: 'secondary', entry: 'default', exit: 'destructive', transfer: 'outline', inventory: 'default' };
                return (
                  <div key={event.id} className="p-3 rounded-lg border bg-card/50 hover:bg-accent/30 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={typeColors[event.eventType] || 'secondary'} className="text-[10px]">
                        {typeLabels[event.eventType] || event.eventType}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(event.createdAt), 'HH:mm:ss')}</span>
                    </div>
                    <p className="text-xs font-mono truncate text-foreground">{event.tagEpc}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{event.readerCode} • {event.zone || '-'}</p>
                    {event.rssi != null && <p className="text-[10px] text-muted-foreground">RSSI: {event.rssi} dBm</p>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
