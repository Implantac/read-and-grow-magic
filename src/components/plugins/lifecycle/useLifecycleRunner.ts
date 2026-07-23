import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnterpriseStore } from "@/core/stores/useEnterpriseStore";
import { handleMutationError, toastSuccess } from "@/lib/toastHelpers";
import { ACTION_META, sleep, type LifecycleAction, type LogLine, type Step } from "./constants";

export function useLifecycleRunner(params: {
  open: boolean;
  action: LifecycleAction;
  pluginId: string;
  pluginName: string;
  installationId?: string | null;
}) {
  const { open, action, pluginId, pluginName, installationId } = params;
  const meta = ACTION_META[action];
  const qc = useQueryClient();
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  const [steps, setSteps] = useState<Step[]>([]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [realtime, setRealtime] = useState<"connecting" | "live" | "off">("off");
  const startedRef = useRef(false);

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

  const pushLog = (level: LogLine["level"], message: string) => {
    setLogs((l) => [...l, { ts: new Date().toISOString(), level, message }]);
  };

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
          if (row?.status) pushLog("info", `Estado do banco atualizado: ${row.status}`);
        },
      )
      .subscribe((s) => {
        if (s === "SUBSCRIBED") setRealtime("live");
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, pluginId, companyId]);

  const runLifecycle = async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setStatus("running");
    const stepDefs: Step[] = meta.steps.map((label, i) => ({
      key: `s${i}`, label, status: "pending",
    }));
    setSteps(stepDefs);
    pushLog("info", `Iniciando: ${meta.title.toLowerCase()} → ${pluginName}`);

    try {
      for (let i = 0; i < stepDefs.length; i++) {
        setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, status: "running" } : s)));
        pushLog("info", `▶ ${stepDefs[i].label}...`);
        await sleep(350 + Math.random() * 350);

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
            .update({ status: "uninstalled", uninstalled_at: new Date().toISOString() })
            .eq("id", installationId);
          if (error) throw error;
          pushLog("success", "Plugin marcado como desinstalado.");
        }

        setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, status: "done" } : s)));
        pushLog("success", `✓ ${stepDefs[i].label}`);
        setProgress(Math.round(((i + 1) / stepDefs.length) * 100));
      }

      setStatus("done");
      pushLog("success", "Operação concluída com sucesso.");
      toastSuccess(`${meta.title} concluído`);
      qc.invalidateQueries({ queryKey: ["plugin_installations"] });
    } catch (err) {
      setStatus("error");
      setSteps((prev) => prev.map((s) => (s.status === "running" ? { ...s, status: "error" } : s)));
      pushLog("error", err instanceof Error ? err.message : "Erro desconhecido");
      handleMutationError(err);
    }
  };

  return { meta, steps, logs, progress, status, realtime, runLifecycle };
}
