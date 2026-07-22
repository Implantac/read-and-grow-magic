import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Button } from "@/ui/base/button";
import { Switch } from "@/ui/base/switch";
import { GitBranch, PlayCircle, RefreshCw, Trash2 } from "lucide-react";
import { Stars } from "./Stars";
import type { LifecycleAction } from "@/components/plugins/PluginLifecycleDialog";
import type { ReviewsSummary } from "./useReviewsSummary";

interface Props {
  plugin: any;
  installation: any | null;
  summary: ReviewsSummary;
  onOpenReviews: () => void;
  onOpenRunner: () => void;
  onOpenVersions: () => void;
  onLifecycle: (a: LifecycleAction) => void;
  onToggleAutoUpdate: (v: boolean) => void;
}

export function PluginHeaderCard({
  plugin, installation, summary,
  onOpenReviews, onOpenRunner, onOpenVersions, onLifecycle, onToggleAutoUpdate,
}: Props) {
  const installed = !!installation;

  return (
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
              onClick={onOpenReviews}
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
                    onLifecycle(installation!.status === "active" ? "pause" : "resume")
                  }
                >
                  {installation!.status === "active" ? "Pausar" : "Retomar"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onOpenRunner}
                  disabled={installation!.status !== "active"}
                >
                  <PlayCircle className="h-4 w-4 mr-1" /> Executar
                </Button>
                <Button size="sm" variant="outline" onClick={onOpenVersions}>
                  <GitBranch className="h-4 w-4 mr-1" /> Versões
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onLifecycle("uninstall")}>
                  <Trash2 className="h-4 w-4 mr-1" /> Remover
                </Button>
              </div>
            ) : (
              <Button onClick={() => onLifecycle("install")}>Instalar plugin</Button>
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
              onCheckedChange={onToggleAutoUpdate}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
