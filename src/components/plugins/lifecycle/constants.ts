import { Download, Pause, Play, Trash2 } from "lucide-react";

export type LifecycleAction = "install" | "pause" | "resume" | "uninstall";

export interface LogLine {
  ts: string;
  level: "info" | "success" | "warn" | "error";
  message: string;
}

export interface Step {
  key: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
}

export const ACTION_META: Record<
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

export function levelColor(level: LogLine["level"]) {
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

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
