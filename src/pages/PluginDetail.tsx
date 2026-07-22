import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageContainer } from "@/shared/components/PageContainer";
import { Card } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Skeleton } from "@/ui/base/skeleton";
import { ArrowLeft, ExternalLink, Package } from "lucide-react";
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
import { PluginHeaderCard } from "./plugin-detail/PluginHeaderCard";
import { ScreenshotsCard } from "./plugin-detail/ScreenshotsCard";
import { ChangelogCard } from "./plugin-detail/ChangelogCard";
import { CompatibilityCard } from "./plugin-detail/CompatibilityCard";
import { ReviewsSummaryCard } from "./plugin-detail/ReviewsSummaryCard";
import { useReviewsSummary } from "./plugin-detail/useReviewsSummary";

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
  const summary = useReviewsSummary(reviews);

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

        <PluginHeaderCard
          plugin={plugin}
          installation={installation}
          summary={summary}
          onOpenReviews={() => setReviewsOpen(true)}
          onOpenRunner={() => setRunnerOpen(true)}
          onOpenVersions={() => setVersionOpen(true)}
          onLifecycle={setLifecycle}
          onToggleAutoUpdate={(v) =>
            installation && autoUpdate.mutate({ id: installation.id, enabled: v })
          }
        />

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <ScreenshotsCard
              name={plugin.name}
              screenshots={plugin.screenshots ?? []}
              onOpen={setLightbox}
            />
            {plugin.long_description && (
              <Card>
                <div className="p-6 space-y-2">
                  <h3 className="text-base font-semibold">Sobre este plugin</h3>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {plugin.long_description}
                  </div>
                </div>
              </Card>
            )}
            <ChangelogCard
              versions={versions}
              currentVersion={plugin.version}
              pinnedVersion={installation?.pinned_version}
            />
          </div>

          <div className="space-y-4">
            <CompatibilityCard plugin={plugin} />
            <ReviewsSummaryCard summary={summary} onOpen={() => setReviewsOpen(true)} />
          </div>
        </div>

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
