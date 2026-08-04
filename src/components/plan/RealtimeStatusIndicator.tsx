import { useCurrentPlan } from "@/hooks/system/useCurrentPlan";
import { Badge } from "@/ui/base/badge";
import { CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export function RealtimeStatusIndicator() {
  const { realtimeStatus } = useCurrentPlan();

  const statusConfig = {
    SUBSCRIBED: {
      label: "Conectado",
      icon: CheckCircle2,
      className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
    SUBSCRIBING: {
      label: "Conectando...",
      icon: RefreshCcw,
      className: "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse",
    },
    CHANNEL_ERROR: {
      label: "Erro de Conexão",
      icon: AlertCircle,
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
    TIMED_OUT: {
      label: "Tempo Esgotado",
      icon: AlertCircle,
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
    CLOSED: {
      label: "Desconectado",
      icon: AlertCircle,
      className: "bg-muted text-muted-foreground border-border",
    },
  };

  const config = statusConfig[realtimeStatus as keyof typeof statusConfig] || statusConfig.CLOSED;
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn("flex items-center gap-1.5 font-medium transition-all duration-300", config.className)}
    >
      <Icon className={cn("h-3.5 w-3.5", realtimeStatus === 'SUBSCRIBING' && "animate-spin")} />
      {config.label}
    </Badge>
  );
}
