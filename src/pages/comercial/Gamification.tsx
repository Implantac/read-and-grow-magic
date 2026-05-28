import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDate } from '@/lib/formatters';
import {
  useLeaderboard, useBadges, useBadgeAwards, useMissions,
  useMissionProgress, useChallenges, useChallengeParticipants,
  useGamificationPoints,
} from '@/hooks/useGamification';
import { useSalesReps } from '@/hooks/useSalesReps';
import { Trophy, Medal, Target, Flame, Star, Swords, Crown, Award, TrendingUp, Zap } from 'lucide-react';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR').format(v);

const rankIcons = ['🥇', '🥈', '🥉'];
const rankColors = ['text-amber-500', 'text-slate-400', 'text-amber-700'];

export default function GamificationPage() {
  const { data: leaderboard = [], isLoading: loadingLB } = useLeaderboard();
  const { data: badges = [] } = useBadges();
  const { data: allAwards = [] } = useBadgeAwards();
  const { data: missions = [] } = useMissions();
  const { data: challenges = [] } = useChallenges();
  const { data: points = [] } = useGamificationPoints();
  const { data: reps = [] } = useSalesReps();
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const { data: challParts = [] } = useChallengeParticipants(selectedChallenge ?? undefined);

  const repMap = useMemo(() => {
    const m = new Map<string, string>();
    reps.forEach((r: any) => m.set(r.id, r.name));
    return m;
  }, [reps]);

  const getRepName = (id: string) => repMap.get(id) || id.slice(0, 8);

  // Stats
  const totalPoints = points.reduce((s: number, p: any) => s + (p.points || 0), 0);
  const todayPoints = points.filter((p: any) => {
    const d = new Date(p.created_at).toDateString();
    return d === new Date().toDateString();
  }).reduce((s: number, p: any) => s + (p.points || 0), 0);

  const dailyMissions = missions.filter(m => m.mission_type === 'daily');
  const weeklyMissions = missions.filter(m => m.mission_type === 'weekly');

  return (
    <PageContainer loading={loadingLB}>
      <PageHeader
        title="🎮 Gamificação Comercial"
        description="Ranking, missões, badges e desafios — venda mais e conquiste recompensas!"
      />

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard index={0} title="Pontos Totais" value={fmt(totalPoints)} icon={<Trophy className="h-5 w-5" />} accentColor="warning" />
        <KPICard index={1} title="Pontos Hoje" value={fmt(todayPoints)} icon={<Zap className="h-5 w-5" />} accentColor="success" />
        <KPICard index={2} title="No Ranking" value={leaderboard.length.toString()} icon={<Crown className="h-5 w-5" />} accentColor="info" />
        <KPICard index={3} title="Desafios Ativos" value={challenges.length.toString()} icon={<Swords className="h-5 w-5" />} accentColor="accent" />
      </div>
      <Tabs defaultValue="ranking" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="ranking" className="gap-1"><Trophy className="h-4 w-4" /> Ranking</TabsTrigger>
          <TabsTrigger value="missions" className="gap-1"><Target className="h-4 w-4" /> Missões</TabsTrigger>
          <TabsTrigger value="badges" className="gap-1"><Award className="h-4 w-4" /> Badges</TabsTrigger>
          <TabsTrigger value="challenges" className="gap-1"><Swords className="h-4 w-4" /> Desafios</TabsTrigger>
        </TabsList>

        {/* === RANKING === */}
        <TabsContent value="ranking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Crown className="h-5 w-5 text-amber-500" /> Ranking Geral de Pontos</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLB ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-muted-foreground">Nenhum ponto registrado ainda.</p>
                  <p className="text-xs text-muted-foreground">Os vendedores aparecerão aqui conforme acumulam pontos.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, i) => {
                    const maxPts = leaderboard[0]?.total_points || 1;
                    const pct = (entry.total_points / maxPts) * 100;
                    const awardCount = allAwards.filter(a => a.sales_rep_id === entry.sales_rep_id).length;
                    return (
                      <div key={entry.sales_rep_id} className={`flex items-center gap-3 p-3 rounded-lg ${i < 3 ? 'bg-primary/5' : 'hover:bg-muted/50'}`}>
                        <span className="text-xl min-w-[32px] text-center">
                          {i < 3 ? rankIcons[i] : <span className="text-sm text-muted-foreground font-mono">{i + 1}º</span>}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-semibold text-sm ${i < 3 ? rankColors[i] : ''}`}>
                              {getRepName(entry.sales_rep_id)}
                            </p>
                            {awardCount > 0 && (
                              <Badge variant="outline" className="text-[10px]">{awardCount} 🏅</Badge>
                            )}
                          </div>
                          <Progress value={pct} className="h-2 mt-1" />
                        </div>
                        <span className="font-bold text-primary tabular-nums">{fmt(entry.total_points)} pts</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === MISSÕES === */}
        <TabsContent value="missions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Flame className="h-5 w-5 text-orange-500" /> Missões Diárias</CardTitle>
              <CardDescription>Complete missões para ganhar pontos extras</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dailyMissions.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <span className="text-2xl">{m.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={0} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-muted-foreground">0/{m.target_count}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">+{m.reward_points} pts</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {weeklyMissions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Star className="h-5 w-5 text-purple-500" /> Missões Semanais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weeklyMissions.map(m => (
                    <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <span className="text-2xl">{m.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{m.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={0} className="h-1.5 flex-1" />
                          <span className="text-[10px] text-muted-foreground">0/{m.target_count}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0">+{m.reward_points} pts</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* === BADGES === */}
        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Medal className="h-5 w-5 text-amber-500" /> Conquistas Disponíveis</CardTitle>
              <CardDescription>{allAwards.length} conquistadas de {badges.length} possíveis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {badges.map(badge => {
                  const awarded = allAwards.some(a => a.badge_id === badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`flex flex-col items-center text-center p-4 rounded-lg border transition-all ${
                        awarded ? 'bg-primary/10 border-primary shadow-sm' : 'opacity-50 grayscale'
                      }`}
                    >
                      <span className="text-4xl mb-2">{badge.icon}</span>
                      <p className="text-xs font-semibold">{badge.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{badge.description}</p>
                      <Badge variant="outline" className="mt-2 text-[10px]">{badge.points_required} pts</Badge>
                      {awarded && <Badge className="mt-1 text-[10px]">Conquistado ✓</Badge>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === DESAFIOS === */}
        <TabsContent value="challenges" className="space-y-4">
          {challenges.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Swords className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground">Nenhum desafio ativo no momento.</p>
              </CardContent>
            </Card>
          ) : (
            challenges.map(ch => (
              <Card key={ch.id} className="border-l-4 border-l-red-500">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Swords className="h-5 w-5 text-red-500" /> {ch.title}
                    </CardTitle>
                    <Badge>{ch.status}</Badge>
                  </div>
                  <CardDescription>{ch.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>📅 {formatDate(ch.start_date)} — {formatDate(ch.end_date)}</span>
                    <span>🏆 {ch.prize_description}</span>
                    <span>⭐ +{ch.bonus_points} pts bônus</span>
                  </div>

                  {selectedChallenge === ch.id ? (
                    <div className="space-y-2">
                      {challParts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum participante ainda.</p>
                      ) : challParts.map((cp, i) => (
                        <div key={cp.id} className="flex items-center gap-3 p-2 rounded bg-muted/50">
                          <span className="text-sm min-w-[24px]">{i < 3 ? rankIcons[i] : `${i + 1}º`}</span>
                          <span className="text-sm flex-1">{getRepName(cp.sales_rep_id)}</span>
                          <span className="text-sm font-bold">{fmt(cp.score)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button
                      className="text-sm text-primary hover:underline"
                      onClick={() => setSelectedChallenge(ch.id)}
                    >
                      Ver participantes →
                    </button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
