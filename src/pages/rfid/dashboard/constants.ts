export const ZONE_COLORS: Record<string, string> = {
  Recebimento: 'hsl(var(--primary))',
  Armazenagem: 'hsl(142 76% 36%)',
  Picking: 'hsl(45 93% 47%)',
  Expedição: 'hsl(262 83% 58%)',
  Doca: 'hsl(199 89% 48%)',
};

export const STATUS_COLORS = {
  active: 'hsl(142 76% 36%)',
  inactive: 'hsl(var(--muted-foreground))',
  maintenance: 'hsl(45 93% 47%)',
  error: 'hsl(var(--destructive))',
  lost: 'hsl(var(--destructive))',
  damaged: 'hsl(var(--muted-foreground))',
};

export const STATUS_LABELS: Record<string, string> = {
  active: 'Ativos',
  inactive: 'Inativos',
  maintenance: 'Manutenção',
  error: 'Erro',
};
