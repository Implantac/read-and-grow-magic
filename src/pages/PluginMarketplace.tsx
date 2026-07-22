import { useMemo, useState } from "react";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Button } from "@/ui/base/button";
import { Code2, Loader2, Package } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  usePlugins, usePluginInstallations, useInstallPlugin, useUninstallPlugin, useTogglePlugin,
} from "@/hooks/usePlugins";
import { usePluginRatings, useToggleAutoUpdate } from "@/hooks/usePluginReviews";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { PluginRunnerDialog } from "@/components/plugins/PluginRunnerDialog";
import { PluginVersionDialog } from "@/components/plugins/PluginVersionDialog";
import { PluginReviewsDialog } from "@/components/plugins/PluginReviewsDialog";
import { MarketplaceFilters } from "./marketplace/MarketplaceFilters";
import { PluginCard } from "./marketplace/PluginCard";
import { useFilteredPlugins } from "./marketplace/useFilteredPlugins";
import type { PriceFilter, SortMode } from "./marketplace/constants";

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
    pluginId: string; pluginName: string; installationId: string;
    pinnedVersion: string | null; currentVersion: string;
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
    const m = new Map<string, { id: string; status: string; pinned_version: string | null; auto_update: boolean }>();
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

  const filtered = useFilteredPlugins({ plugins, ratings, search, category, price, minRating, sort });

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

        <MarketplaceFilters
          search={search}
          onSearch={setSearch}
          price={price}
          onPrice={setPrice}
          minRating={minRating}
          onMinRating={setMinRating}
          sort={sort}
          onSort={setSort}
          category={category}
          onCategory={setCategory}
          categories={categories}
          hasActiveFilters={hasActiveFilters}
          onClear={() => {
            setSearch(""); setCategory("all"); setPrice("all");
            setMinRating(0); setSort("popular");
          }}
          filteredCount={filtered.length}
          totalCount={plugins?.length ?? 0}
        />

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
              const rating = ratings?.[p.id];
              return (
                <PluginCard
                  key={p.id}
                  plugin={p}
                  install={inst}
                  rating={rating}
                  onOpenReviews={() => setReviewsDialog({ id: p.id, name: p.name })}
                  onOpenVersions={() =>
                    setVersionDialog({
                      pluginId: p.id,
                      pluginName: p.name,
                      installationId: inst!.id,
                      pinnedVersion: inst!.pinned_version,
                      currentVersion: p.version,
                    })
                  }
                  onRun={() => setRunner({ id: p.id, key: p.key, name: p.name })}
                  onInstall={() => install.mutate(p.id)}
                  onUninstall={() => uninstall.mutate(inst!.id)}
                  onToggle={(v) => toggle.mutate({ id: inst!.id, enabled: v })}
                  onToggleAutoUpdate={(v) => autoUpdate.mutate({ id: inst!.id, enabled: v })}
                  installPending={install.isPending}
                  uninstallPending={uninstall.isPending}
                />
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
