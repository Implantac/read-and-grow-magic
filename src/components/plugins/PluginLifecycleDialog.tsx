import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/ui/base/dialog";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Progress } from "@/ui/base/progress";
import { Loader2, Radio } from "lucide-react";
import { useLifecycleRunner } from "./lifecycle/useLifecycleRunner";
import { LifecycleSteps } from "./lifecycle/LifecycleSteps";
import { LifecycleLogs } from "./lifecycle/LifecycleLogs";
import type { LifecycleAction } from "./lifecycle/constants";

export type { LifecycleAction } from "./lifecycle/constants";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: LifecycleAction;
  pluginId: string;
  pluginName: string;
  installationId?: string | null;
}

export function PluginLifecycleDialog({ open, onOpenChange, action, pluginId, pluginName, installationId }: Props) {
  const { meta, steps, logs, progress, status, realtime, runLifecycle } = useLifecycleRunner({
    open, action, pluginId, pluginName, installationId,
  });
  const Icon = meta.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" /> {meta.title}
          </DialogTitle>
          <DialogDescription>{meta.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{pluginName}</span>
              <StatusBadge status={status} />
            </div>
            <Badge variant={realtime === "live" ? "default" : "outline"} className="gap-1">
              <Radio className={`h-3 w-3 ${realtime === "live" ? "animate-pulse" : ""}`} />
              {realtime === "live" ? "Ao vivo" : realtime === "connecting" ? "Conectando" : "Offline"}
            </Badge>
          </div>

          {status !== "idle" && (
            <div className="space-y-1">
              <Progress value={progress} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progress}% concluído</span>
                <span>
                  {steps.filter((s) => s.status === "done").length}/{steps.length} etapas
                </span>
              </div>
            </div>
          )}

          <LifecycleSteps steps={steps} />
          <LifecycleLogs logs={logs} />

          <div className="flex justify-end gap-2">
            {status === "idle" && (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button onClick={runLifecycle}>
                  <Icon className="h-4 w-4 mr-1" /> Iniciar
                </Button>
              </>
            )}
            {status === "running" && (
              <Button disabled>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Executando...
              </Button>
            )}
            {(status === "done" || status === "error") && (
              <Button onClick={() => onOpenChange(false)}>Fechar</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    idle: { label: "Pronto", variant: "outline" },
    running: { label: "Em execução", variant: "secondary" },
    done: { label: "Concluído", variant: "default" },
    error: { label: "Erro", variant: "destructive" },
  };
  const s = map[status] ?? map.idle;
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
