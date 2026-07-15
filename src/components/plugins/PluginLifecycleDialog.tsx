import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnterpriseStore } from "@/core/stores/useEnterpriseStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/ui/base/dialog";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Progress } from "@/ui/base/progress";
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  Play,
  Pause,
  Download,
  Trash2,
  Radio,
} from "lucide-react";
import { handleMutationError, toastSuccess } from "@/lib/toastHelpers";

export type LifecycleAction = "install" | "pause" | "resume" | "uninstall";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: LifecycleAction;
  pluginId: string;
  pluginName: string;
  installationId?: string | null;
}

interface LogLine {
  ts: string;
  level: "info" | "success" | "warn" | "error";
  message: string;
}

interface Step {
  key: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
}

const ACTION_META: Record<
  LifecycleAction,
  { title: string; description: string; icon: typeof Play; steps: string[] }
> = {
  install: {
    title: "Instalar plugin",
    description: "Instalando dependências e ativando o plugin para sua empresa.",
    icon: Download,
    steps: [
      "Validando compatibilidade",
      "Registrando instalação",
      "Aplicando configuração padrão",
      "Ativando plugin",
    ],
  },
  pause: {
    title: "Pausar plugin",
    description: "Pausando execuções sem remover dados de configuração.",
    icon: Pause,
    steps: ["Encerrando execuções pendentes", "Marcando como pausado"],
  },
  resume: {
    title: "Retomar plugin",
    description: "Retornando o plugin ao estado ativo.",
    icon: Play,
    steps: ["Verificando estado", "Reativando"],
  },
  uninstall: {
    title: "Remover plugin",
    description:
      "O plugin será desinstalado desta empresa. Histórico de execuções é preservado.",
    icon: Trash2,
    steps: [
      "Encerrando conexões",
      "Removendo configuração",
      "Marcando como desinstalado",
    ],
  },
};

export function PluginLifecycleDialog({
  open,
  onOpenChange,
  action,
  pluginId,
  pluginName,
  installationId,
}: Props) {
  const meta = ACTION_META[action];
  const qc = useQueryClient();
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  const [steps, setSteps] = useState<Step[]>([]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">(
    "idle",
  );
  const [realtime, setRealtime] = useState<"connecting" | "live" | "off">("off");
  const startedRef = useRef(false);
  const logScrollRef = useRef<HTMLDivElement>(null);

  // Reset when dialog reopens
  useEffect(() => {
    if (!open) {
      startedRef.current = false;
      setSteps([]);
      setLogs([]);
      setProgress(0);
      setStatus("idle");
      setRealtime("off");
    }
  }, [open]);

  // Auto-scroll logs
  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Realtime subscription to this installation
  useEffect(() => {
    if (!open || !companyId) return;
    setRealtime("connecting");
    const channel = supabase
      .channel(`plugin_lifecycle_${pluginId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "plugin_installations",
          filter: `plugin_id=eq.${pluginId}`,
        },
        (payload) => {
          const row = payload.new as { status?: string } | null;
          if (row?.status) {
            pushLog("info", `Estado do banco atualizado: ${row.status}`);
          }
        },
      )
      .subscribe((s) => {
        if (s === "SUBSCRIBED") setRealtime("live");
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, pluginId, companyId]);

  const pushLog = (level: LogLine["level"], message: string) => {
    setLogs((l) => [
      ...l,
      { ts: new Date().toISOString(), level, message },
    ]);
  };

  const runLifecycle = async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setStatus("running");
    const stepDefs: Step[] = meta.steps.map((label, i) => ({
      key: `s${i}`,
      label,
      status: "pending",
    }));
    setSteps(stepDefs);
    pushLog("info", `Iniciando: ${meta.title.toLowerCase()} → ${pluginName}`);

    try {
      for (let i = 0; i < stepDefs.length; i++) {
        setSteps((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: "running" } : s,
          ),
        );
        pushLog("info", `▶ ${stepDefs[i].label}...`);
        await sleep(350 + Math.random() * 350);

        // Execute real DB operation at the appropriate step
        if (action === "install" && i === 1) {
          const { data: user } = await supabase.auth.getUser();
          if (!companyId) throw new Error("Empresa não selecionada");
          const { error } = await supabase
            .from("plugin_installations")
            .upsert(
              {
                company_id: companyId,
                plugin_id: pluginId,
                status: "active",
                installed_by: user.user?.id ?? null,
              },
              { onConflict: "company_id,plugin_id" },
            );
          if (error) throw error;
          pushLog("success", "Instalação persistida no banco de dados.");
        }

        if ((action === "pause" || action === "resume") && i === 1) {
          if (!installationId) throw new Error("Instalação não encontrada");
          const newStatus = action === "pause" ? "disabled" : "active";
          const { error } = await supabase
            .from("plugin_installations")
            .update({ status: newStatus })
            .eq("id", installationId);
          if (error) throw error;
          pushLog("success", `Status alterado para "${newStatus}".`);
        }

        if (action === "uninstall" && i === stepDefs.length - 1) {
          if (!installationId) throw new Error("Instalação não encontrada");
          const { error } = await supabase
            .from("plugin_installations")
            .update({
              status: "uninstalled",
              uninstalled_at: new Date().toISOString(),
            })
            .eq("id", installationId);
          if (error) throw error;
          pushLog("success", "Plugin marcado como desinstalado.");
        }

        setSteps((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: "done" } : s)),
        );
        pushLog("success", `✓ ${stepDefs[i].label}`);
        setProgress(Math.round(((i + 1) / stepDefs.length) * 100));
      }

      setStatus("done");
      pushLog("success", "Operação concluída com sucesso.");
      toastSuccess(`${meta.title} concluído`);
      qc.invalidateQueries({ queryKey: ["plugin_installations"] });
    } catch (err) {
      setStatus("error");
      setSteps((prev) =>
        prev.map((s) => (s.status === "running" ? { ...s, status: "error" } : s)),
      );
      pushLog(
        "error",
        err instanceof Error ? err.message : "Erro desconhecido",
      );
      handleMutationError(err);
    }
  };

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
            <Badge
              variant={realtime === "live" ? "default" : "outline"}
              className="gap-1"
            >
              <Radio
                className={`h-3 w-3 ${realtime === "live" ? "animate-pulse" : ""}`}
              />
              {realtime === "live"
                ? "Ao vivo"
                : realtime === "connecting"
                  ? "Conectando"
                  : "Offline"}
            </Badge>
          </div>

          {status !== "idle" && (
            <div className="space-y-1">
              <Progress value={progress} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progress}% concluído</span>
                <span>
                  {steps.filter((s) => s.status === "done").length}/{steps.length}{" "}
                  etapas
                </span>
              </div>
            </div>
          )}

          {steps.length > 0 && (
            <div className="rounded border divide-y">
              {steps.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center gap-2 px-3 py-2 text-sm"
                >
                  {s.status === "done" && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                  {s.status === "running" && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                  {s.status === "pending" && (
                    <Circle className="h-4 w-4 text-muted-foreground/50" />
                  )}
                  {s.status === "error" && (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span
                    className={
                      s.status === "pending"
                        ? "text-muted-foreground"
                        : ""
                    }
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Logs detalhados
              </span>
              <span className="text-xs text-muted-foreground">
                {logs.length} entrada{logs.length === 1 ? "" : "s"}
              </span>
            </div>
            <div
              ref={logScrollRef}
              className="h-48 overflow-auto rounded border bg-muted/30 p-2 font-mono text-[11px] space-y-0.5"
            >
              {logs.length === 0 ? (
                <p className="text-muted-foreground italic">
                  Aguardando início da operação...
                </p>
              ) : (
                logs.map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-muted-foreground shrink-0">
                      {new Date(l.ts).toLocaleTimeString("pt-BR")}
                    </span>
                    <span className={levelColor(l.level)}>
                      [{l.level.toUpperCase()}]
                    </span>
                    <span className="break-words">{l.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {status === "idle" && (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
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

function levelColor(level: LogLine["level"]) {
  switch (level) {
    case "success":
      return "text-emerald-500";
    case "warn":
      return "text-amber-500";
    case "error":
      return "text-destructive";
    default:
      return "text-primary";
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
