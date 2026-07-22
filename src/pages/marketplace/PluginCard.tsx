import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Button } from "@/ui/base/button";
import { Switch } from "@/ui/base/switch";
import {
  GitBranch, MessageSquare, PlayCircle, RefreshCw, Star, Trash2,
} from "lucide-react";

interface InstallInfo {
  id: string;
  status: string;
  pinned_version: string | null;
  auto_update: boolean;
}

interface Props {
  plugin: any;
  install: InstallInfo | undefined;
  rating: { avg: number; count: number } | undefined;
  onOpenReviews: () => void;
  onOpenVersions: () => void;
  onRun: () => void;
  onInstall: () => void;
  onUninstall: () => void;
  onToggle: (v: boolean) => void;
  onToggleAutoUpdate: (v: boolean) => void;
  installPending: boolean;
  uninstallPending: boolean;
}

export function PluginCard({
  plugin: p, install: inst, rating,
  onOpenReviews, onOpenVersions, onRun, onInstall, onUninstall,
  onToggle, onToggleAutoUpdate, installPending, uninstallPending,
}: Props) {
  const installed = !!inst;
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <Link to={`/marketplace/${p.id}`} className="text-base font-semibold hover:underline underline-offset-2">
            {p.name}
          </Link>
          <Badge variant="outline">{p.category}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{p.vendor} · v{p.version}</p>
        <button
          type="button"
          onClick={onOpenReviews}
          className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-fit"
          aria-label="Ver avaliações"
        >
          <Star className={`h-3.5 w-3.5 ${rating?.count ? "fill-amber-400 text-amber-400" : ""}`} />
          <span className="tabular-nums">
            {rating?.count ? rating.avg.toFixed(1) : "Sem avaliações"}
          </span>
          {rating?.count ? <span className="text-muted-foreground/70">({rating.count})</span> : null}
        </button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        <p className="text-sm text-muted-foreground line-clamp-3">{p.description}</p>

        <div className="flex flex-wrap gap-1">
          {p.required_modules.map((m: string) => (
            <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
          ))}
        </div>

        <div className="text-sm font-medium">
          {p.price_monthly > 0 ? `R$ ${p.price_monthly.toFixed(2)}/mês` : "Gratuito"}
        </div>

        {installed && (
          <div className="flex items-center justify-between gap-2 text-xs rounded border px-2 py-1.5">
            <div className="flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Atualização automática</span>
            </div>
            <Switch
              checked={inst!.auto_update}
              onCheckedChange={onToggleAutoUpdate}
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
                  onCheckedChange={onToggle}
                />
                <span className="text-xs text-muted-foreground">
                  {inst!.status === "active" ? "Ativo" : "Pausado"}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={onOpenReviews} aria-label="Avaliações" title="Avaliações">
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenVersions}
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
              <Button variant="ghost" size="icon" onClick={onRun} disabled={inst!.status !== "active"} aria-label="Executar">
                <PlayCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onUninstall} disabled={uninstallPending} aria-label="Desinstalar">
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="icon" onClick={onOpenReviews} aria-label="Avaliações" title="Ver avaliações">
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button className="flex-1" onClick={onInstall} disabled={installPending}>Instalar</Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
