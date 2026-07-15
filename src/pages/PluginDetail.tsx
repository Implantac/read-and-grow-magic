import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageContainer } from "@/shared/components/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Switch } from "@/ui/base/switch";
import { Progress } from "@/ui/base/progress";
import { Skeleton } from "@/ui/base/skeleton";
import {
  ArrowLeft,
  ExternalLink,
  GitBranch,
  MessageSquare,
  Package,
  PlayCircle,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  usePluginDetail,
  usePluginInstallations,
  usePluginVersions,
} from "@/hooks/usePlugins";
import { usePluginReviews, useToggleAutoUpdate } from "@/hooks/usePluginReviews";
import { PluginRunnerDialog } from "@/components/plugins/PluginRunnerDialog";
import { PluginVersionDialog } from "@/components/plugins/PluginVersionDialog";
import { PluginReviewsDialog } from "@/components/plugins/PluginReviewsDialog";
import {
  PluginLifecycleDialog,
  type LifecycleAction,
} from "@/components/plugins/PluginLifecycleDialog";
import { MODULE_LABELS } from "@/lib/moduleLabels";

function Stars({ value, size = 4 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-${size} w-${size} ${
            n <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

export default function PluginDetail() {
  const { pluginId = "" } = useParams<{ pluginId: string }>();
  const navigate = useNavigate();

  const { data: plugin, isLoading } = usePluginDetail(pluginId);
  const { data: installs } = usePluginInstallations();
  const { data: versions } = usePluginVersions(pluginId);
  const { data: reviews } = usePluginReviews(pluginId);
  const autoUpdate = useToggleAutoUpdate();

  const [runnerOpen, setRunnerOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [lifecycle, setLifecycle] = useState<LifecycleAction | null>(null);

  const installation = useMemo(
    () => (installs ?? []).find((i) => i.plugin_id === pluginId) ?? null,
    [installs, pluginId],
  );

  const summary = useMemo(() => {
    const hist: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    (reviews ?? []).forEach((r) => {
      hist[r.rating as 1 | 2 | 3 | 4 | 5] += 1;
    });
    const count = reviews?.length ?? 0;
    const avg = count
      ? (reviews ?? []).reduce((a, r) => a + r.rating, 0) / count
      : 0;
    return { hist, count, avg };
  }, [reviews]);

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </PageContainer>
    );
  }

  if (!plugin) {
    return (
      <PageContainer>
        <EmptyState
          icon={Package}
          title="Plugin não encontrado"
          description="Este plugin pode ter sido despublicado ou removido."
        />
        <Button variant="outline" onClick={() => navigate("/marketplace")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao marketplace
        </Button>
      </PageContainer>
    );
  }

  const installed = !!installation;

  return (
    <RoleGuard roles={["admin"]}>
      <PageContainer>
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/marketplace">
              <ArrowLeft className="h-4 w-4 mr-1" /> Marketplace
            </Link>
          </Button>
          {plugin.homepage_url && (
            <Button asChild variant="outline" size="sm">
              <a href={plugin.homepage_url} target="_blank" rel="noreferrer noopener">
                <ExternalLink className="h-4 w-4 mr-1" /> Site do fornecedor
              </a>
            </Button>
          )}
        </div>

        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-2xl">{plugin.name}</CardTitle>
                  <Badge variant="outline">{plugin.category}</Badge>
                  <Badge variant="secondary">v{plugin.version}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{plugin.vendor}</p>
                <button
                  onClick={() => setReviewsOpen(true)}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Stars value={summary.avg} />
                  <span className="tabular-nums">
                    {summary.count ? summary.avg.toFixed(1) : "Sem avaliações"}
                  </span>
                  {summary.count > 0 && (
                    <span className="text-muted-foreground/70">
                      ({summary.count} avaliação{summary.count === 1 ? "" : "es"})
                    </span>
                  )}
                </button>
              </div>
              <div className="text-right space-y-2 shrink-0">
                <div className="text-lg font-semibold">
                  {plugin.price_monthly > 0
                    ? `R$ ${plugin.price_monthly.toFixed(2)}/mês`
                    : "Gratuito"}
                </div>
                {installed ? (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant={installation!.status === "active" ? "outline" : "default"}
                      onClick={() =>
                        setLifecycle(
                          installation!.status === "active" ? "pause" : "resume",
                        )
                      }
                    >
                      {installation!.status === "active" ? "Pausar" : "Retomar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRunnerOpen(true)}
                      disabled={installation!.status !== "active"}
                    >
                      <PlayCircle className="h-4 w-4 mr-1" /> Executar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setVersionOpen(true)}
                    >
                      <GitBranch className="h-4 w-4 mr-1" /> Versões
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setLifecycle("uninstall")}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remover
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setLifecycle("install")}>
                    Instalar plugin
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {plugin.description && (
              <p className="text-sm text-muted-foreground">{plugin.description}</p>
            )}

            {installed && (
              <div className="flex items-center justify-between gap-2 text-sm rounded border px-3 py-2">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <span>Atualização automática</span>
                  <span className="text-xs text-muted-foreground">
                    (recebe novas versões ao serem publicadas)
                  </span>
                </div>
                <Switch
                  checked={installation!.auto_update}
                  onCheckedChange={(v) =>
                    autoUpdate.mutate({ id: installation!.id, enabled: v })
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {/* Screenshots */}
            {plugin.screenshots && plugin.screenshots.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Screenshots</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {plugin.screenshots.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setLightbox(url)}
                        className="rounded overflow-hidden border hover:ring-2 hover:ring-primary transition"
                      >
                        <img
                          src={url}
                          alt={`${plugin.name} — screenshot ${i + 1}`}
                          className="w-full aspect-video object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Long description */}
            {plugin.long_description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sobre este plugin</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {plugin.long_description}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Changelog */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Changelog</CardTitle>
              </CardHeader>
              <CardContent>
                {!versions || versions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma versão publicada ainda.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {versions.map((v) => (
                      <div key={v.id} className="border-l-2 pl-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">v{v.version}</span>
                          {v.version === plugin.version && (
                            <Badge variant="default" className="text-xs">Atual</Badge>
                          )}
                          {installation?.pinned_version === v.version && (
                            <Badge variant="secondary" className="text-xs">Fixada</Badge>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(v.published_at).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        {v.changelog ? (
                          <p className="text-sm mt-1 whitespace-pre-wrap text-muted-foreground">
                            {v.changelog}
                          </p>
                        ) : (
                          <p className="text-xs italic text-muted-foreground mt-1">
                            Sem notas de versão.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Compatibilidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-xs uppercase text-muted-foreground mb-1">
                    Módulos necessários
                  </p>
                  {plugin.required_modules.length === 0 ? (
                    <p className="text-muted-foreground">Nenhum requisito</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {plugin.required_modules.map((m) => (
                        <Badge key={m} variant="secondary" className="text-xs">
                          {MODULE_LABELS[m] ?? m}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground mb-1">
                    Versão mínima do ERP
                  </p>
                  <p>{plugin.min_app_version ?? "Sem restrição"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground mb-1">
                    Identificador (key)
                  </p>
                  <code className="text-xs">{plugin.key}</code>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Avaliações
                  <Button size="sm" variant="ghost" onClick={() => setReviewsOpen(true)}>
                    <MessageSquare className="h-4 w-4 mr-1" /> Ver
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold">
                    {summary.avg.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    de {summary.count} avaliação{summary.count === 1 ? "" : "es"}
                  </span>
                </div>
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map((n) => {
                    const c = summary.hist[n as 1 | 2 | 3 | 4 | 5];
                    const pct = summary.count ? (c / summary.count) * 100 : 0;
                    return (
                      <div key={n} className="flex items-center gap-2 text-xs">
                        <span className="w-4 tabular-nums">{n}★</span>
                        <Progress value={pct} className="h-1.5 flex-1" />
                        <span className="w-6 text-right tabular-nums text-muted-foreground">
                          {c}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialogs */}
        {runnerOpen && (
          <PluginRunnerDialog
            open={runnerOpen}
            onOpenChange={setRunnerOpen}
            pluginId={plugin.id}
            pluginKey={plugin.key}
            pluginName={plugin.name}
          />
        )}
        {versionOpen && installation && (
          <PluginVersionDialog
            open={versionOpen}
            onOpenChange={setVersionOpen}
            pluginId={plugin.id}
            pluginName={plugin.name}
            installationId={installation.id}
            pinnedVersion={installation.pinned_version}
            currentVersion={plugin.version}
          />
        )}
        {reviewsOpen && (
          <PluginReviewsDialog
            open={reviewsOpen}
            onOpenChange={setReviewsOpen}
            pluginId={plugin.id}
            pluginName={plugin.name}
          />
        )}
        {lifecycle && (
          <PluginLifecycleDialog
            open={!!lifecycle}
            onOpenChange={(o) => !o && setLifecycle(null)}
            action={lifecycle}
            pluginId={plugin.id}
            pluginName={plugin.name}
            installationId={installation?.id ?? null}
          />
        )}

        {/* Lightbox for screenshots */}
        {lightbox && (
          <div
            className="fixed inset-0 bg-background/90 backdrop-blur z-50 flex items-center justify-center p-6"
            onClick={() => setLightbox(null)}
          >
            <img
              src={lightbox}
              alt="Screenshot ampliado"
              className="max-w-full max-h-full rounded border shadow-2xl"
            />
          </div>
        )}
      </PageContainer>
    </RoleGuard>
  );
}
