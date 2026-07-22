import { AlertTriangle, ShieldAlert, Lightbulb, CheckCircle, Phone, TrendingUp, RefreshCw, Sparkles, TrendingDown } from 'lucide-react';

export const SEVERITY_MAP: Record<string, { color: string; icon: typeof AlertTriangle }> = {
  critical: { color: 'text-red-500', icon: ShieldAlert },
  warning: { color: 'text-amber-500', icon: AlertTriangle },
  info: { color: 'text-blue-500', icon: Lightbulb },
  success: { color: 'text-emerald-500', icon: CheckCircle },
};

export const PRIORITY_MAP: Record<string, string> = {
  maximum: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  low: 'bg-muted text-muted-foreground',
};

export const ACTION_ICONS: Record<string, typeof Phone> = {
  urgent_call: ShieldAlert, follow_up: Phone, upsell: TrendingUp,
  reorder: RefreshCw, call: Phone, recovery: TrendingDown, expand: Sparkles,
};

export const ROLE_LABELS: Record<string, string> = {
  seller: '🧑‍💼 Vendedor', supervisor: '👥 Supervisor',
  manager: '📊 Gerente', director: '🏢 Diretoria',
};
