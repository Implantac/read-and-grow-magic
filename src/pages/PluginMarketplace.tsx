import { useMemo, useState } from "react";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Input } from "@/ui/base/input";
import { Switch } from "@/ui/base/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/base/select";
import {
  Code2,
  GitBranch,
  Loader2,
  MessageSquare,
  Package,
  PlayCircle,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  usePlugins,
  usePluginInstallations,
  useInstallPlugin,
  useUninstallPlugin,
  useTogglePlugin,
} from "@/hooks/usePlugins";
import { usePluginRatings, useToggleAutoUpdate } from "@/hooks/usePluginReviews";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { PluginRunnerDialog } from "@/components/plugins/PluginRunnerDialog";
import { PluginVersionDialog } from "@/components/plugins/PluginVersionDialog";
import { PluginReviewsDialog } from "@/components/plugins/PluginReviewsDialog";

type PriceFilter = "all" | "free" | "paid";
type SortMode = "popular" | "top_rated" | "newest" | "price_asc" | "price_desc";

export default function PluginMarketplace() {
  const { data: plugins, isLoading } = usePlugins();
  const { data: installs } = usePluginInstallations();
  const { data: ratings } = usePluginRatings();
  const install = useInstallPlugin();
  const uninstall = useUninstallPlugin();
  const toggle = useTogglePlugin();
  const autoUpdate = useToggleAutoUpdate();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [price, setPrice] = useState<PriceFilter>("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [sort, setSort] = useState<SortMode>("popular");

  const [runner, setRunner] = useState<{ id: string; key: string; name: string } | null>(null);
  const [versionDialog, setVersionDialog] = useState<{
    pluginId: string;
    pluginName: string;
    installationId: string;
    pinnedVersion: string | null;
    currentVersion: string;
  } | null>(null);
  const [reviewsDialog, setReviewsDialog] = useState<{ id: string; name: string } | null>(null);

  const { data: isSystemAdmin } = useQuery({
    queryKey: ["is_system_admin"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data, error } = await supabase.rpc("is_system_admin", { _user_id: user.id });
      if (error) return false;
      return !!data;
    },
  });

  const installMap = useMemo(() => {
    const m = new Map<
      string,
      { id: string; status: string; pinned_version: string | null; auto_update: boolean }
    >();
    (installs ?? []).forEach((i) =>
      m.set(i.plugin_id, {
        id: i.id,
        status: i.status,
        pinned_version: i.pinned_version,
        auto_update: i.auto_update ?? false,
      }),
    );
    return m;
  }, [installs]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (plugins ?? []).forEach((p) => set.add(p.category));
    return ["all", ...Array.from(set).sort()];
  }, [plugins]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    const list = (plugins ?? []).filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (price === "free" && p.price_monthly > 0) return false;
      if (price === "paid" && p.price_monthly <= 0) return false;
      const r = ratings?.[p.id];
      if (minRating > 0 && (!r || r.avg < minRating)) return false;
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.vendor?.toLowerCase().includes(term)
      );
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      const ra = ratings?.[a.id];
      const rb = ratings?.[b.id];
      switch (sort) {
        case "top_rated":
          return (rb?.avg ?? 0) - (ra?.avg ?? 0) || (rb?.count ?? 0) - (ra?.count ?? 0);
        case "popular":
          return (rb?.count ?? 0) - (ra?.count ?? 0) || (rb?.avg ?? 0) - (ra?.avg ?? 0);
        case "newest":
          return a.name.localeCompare(b.name); // fallback stable
        case "price_asc":
          return a.price_monthly - b.price_monthly;
        case "price_desc":
          return b.price_monthly - a.price_monthly;
      }
    });
    return sorted;
  }, [plugins, search, category, price, minRating, sort, ratings]);

  const categoryLabel: Record<string, string> = {
    all: "Todos",
    fiscal: "Fiscal",
    financial: "Financeiro",
    communication: "Comunicação",
    logistics: "Logística",
    bi: "BI & Analytics",
    ai: "Inteligência Artificial",
    payments: "Pagamentos",
    general: "Geral",
  };

  const hasActiveFilters =
    !!search || category !== "all" || price !== "all" || minRating > 0 || sort !== "popular";

  return (
    <RoleGuard roles={["admin"]}>
      <PageContainer>
        <div className="flex items-start justify-between gap-3">
          <PageHeader
            title="Marketplace de Plugins"
            description="Estenda o ERP com integrações e automações por tenant"
            icon={Package}
          />
          {isSystemAdmin && (
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link to="/admin/marketplace/editor">
                <Code2 className="h-4 w-4 mr-1" />
                Editor
              </Link>
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, descrição, fornecedor..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={price} onValueChange={(v) => setPrice(v as PriceFilter)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Preço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os preços</SelectItem>
                  <SelectItem value="free">Gratuitos</SelectItem>
                  <SelectItem value="paid">Pagos</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={String(minRating)}
                onValueChange={(v) => setMinRating(Number(v))}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Avaliação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Qualquer nota</SelectItem>
                  <SelectItem value="3">3★ ou mais</SelectItem>
                  <SelectItem value="4">4★ ou mais</SelectItem>
                  <SelectItem value="5">5★</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Mais populares</SelectItem>
                  <SelectItem value="top_rated">Melhor avaliados</SelectItem>
                  <SelectItem value="newest">Nome A–Z</SelectItem>
                  <SelectItem value="price_asc">Preço: menor</SelectItem>
                  <SelectItem value="price_desc">Preço: maior</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                    setPrice("all");
                    setMinRating(0);
                    setSort("popular");
                  }}
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Button
                key={c}
                variant={category === c ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(c)}
              >
                {categoryLabel[c] ?? c}
              </Button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            {filtered.length} de {plugins?.length ?? 0} plugin{plugins?.length === 1 ? "" : "s"}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum plugin encontrado"
            description="Ajuste os filtros de busca ou publique um novo plugin no editor para estendê-lo ao ERP."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const inst = installMap.get(p.id);
              const installed = !!inst;
              const rating = ratings?.[p.id];
              return (
                <Card key={p.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <Badge variant="outline">{p.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {p.vendor} · v{p.version}
                    </p>
                    <button
                      type="button"
                      onClick={() => setReviewsDialog({ id: p.id, name: p.name })}
                      className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-fit"
                      aria-label="Ver avaliações"
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${
                          rating?.count ? "fill-amber-400 text-amber-400" : ""
                        }`}
                      />
                      <span className="tabular-nums">
                        {rating?.count ? rating.avg.toFixed(1) : "Sem avaliações"}
                      </span>
                      {rating?.count ? (
                        <span className="text-muted-foreground/70">({rating.count})</span>
                      ) : null}
                    </button>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {p.description}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {p.required_modules.map((m) => (
                        <Badge key={m} variant="secondary" className="text-xs">
                          {m}
                        </Badge>
                      ))}
                    </div>

                    <div className="text-sm font-medium">
                      {p.price_monthly > 0
                        ? `R$ ${p.price_monthly.toFixed(2)}/mês`
                        : "Gratuito"}
                    </div>

                    {installed && (
                      <div className="flex items-center justify-between gap-2 text-xs rounded border px-2 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Atualização automática</span>
                        </div>
                        <Switch
                          checked={inst!.auto_update}
                          onCheckedChange={(v) =>
                            autoUpdate.mutate({ id: inst!.id, enabled: v })
                          }
                          aria-label="Atualização automática"
                        />
                      </div>
                    )}

                    <div className="mt-auto flex items-center gap-2 pt-2 border-t">
                      {installed ? (
                        <>
                          <div className="flex items-center gap-2 flex-1">
                            <Switch
                              checked={inst!.status === "active"}
                              onCheckedChange={(v) =>
                                toggle.mutate({ id: inst!.id, enabled: v })
                              }
                            />
                            <span className="text-xs text-muted-foreground">
                              {inst!.status === "active" ? "Ativo" : "Pausado"}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setReviewsDialog({ id: p.id, name: p.name })}
                            aria-label="Avaliações"
                            title="Avaliações"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setVersionDialog({
                                pluginId: p.id,
                                pluginName: p.name,
                                installationId: inst!.id,
                                pinnedVersion: inst!.pinned_version,
                                currentVersion: p.version,
                              })
                            }
                            aria-label="Versões"
                            title={
                              inst!.auto_update
                                ? "Seguindo atualização automática"
                                : inst!.pinned_version
                                ? `Fixada em v${inst!.pinned_version}`
                                : "Acompanhando versão atual"
                            }
                          >
                            <GitBranch className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRunner({ id: p.id, key: p.key, name: p.name })}
                            disabled={inst!.status !== "active"}
                            aria-label="Executar"
                          >
                            <PlayCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => uninstall.mutate(inst!.id)}
                            disabled={uninstall.isPending}
                            aria-label="Desinstalar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setReviewsDialog({ id: p.id, name: p.name })}
                            aria-label="Avaliações"
                            title="Ver avaliações"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            className="flex-1"
                            onClick={() => install.mutate(p.id)}
                            disabled={install.isPending}
                          >
                            Instalar
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {runner && (
          <PluginRunnerDialog
            open={!!runner}
            onOpenChange={(v) => !v && setRunner(null)}
            pluginId={runner.id}
            pluginKey={runner.key}
            pluginName={runner.name}
          />
        )}

        {versionDialog && (
          <PluginVersionDialog
            open={!!versionDialog}
            onOpenChange={(v) => !v && setVersionDialog(null)}
            pluginId={versionDialog.pluginId}
            pluginName={versionDialog.pluginName}
            installationId={versionDialog.installationId}
            pinnedVersion={versionDialog.pinnedVersion}
            currentVersion={versionDialog.currentVersion}
          />
        )}

        {reviewsDialog && (
          <PluginReviewsDialog
            open={!!reviewsDialog}
            onOpenChange={(v) => !v && setReviewsDialog(null)}
            pluginId={reviewsDialog.id}
            pluginName={reviewsDialog.name}
          />
        )}
      </PageContainer>
    </RoleGuard>
  );
}
