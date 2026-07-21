export const impactColor: Record<string, string> = {
  critical: 'bg-destructive/15 text-destructive border-destructive/30',
  high: 'bg-orange-500/15 text-orange-500 border-orange-500/30',
  medium: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  low: 'bg-muted text-muted-foreground border-border',
};

export const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  auto_executed: 'Auto-executada',
  executed: 'Executada',
};

export const SUGGESTED_PROMPTS = [
  '📊 Qual o maior risco financeiro agora?',
  '💰 Quais clientes estão com pagamentos atrasados?',
  '⚡ O que devo priorizar hoje?',
  '📈 Como está a saúde da operação?',
];

export const saudeMap = {
  critico: { label: 'Crítica', color: 'text-destructive', dot: 'bg-destructive', ring: 'ring-destructive/30' },
  alerta: { label: 'Alerta', color: 'text-amber-500', dot: 'bg-amber-500', ring: 'ring-amber-500/30' },
  ok: { label: 'Saudável', color: 'text-emerald-500', dot: 'bg-emerald-500', ring: 'ring-emerald-500/30' },
} as const;

export type SaudeKey = keyof typeof saudeMap;
