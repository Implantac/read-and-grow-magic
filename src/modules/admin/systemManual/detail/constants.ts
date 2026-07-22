export const SEVERITY_STYLE: Record<'blocking' | 'warning' | 'info', string> = {
  blocking: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
  warning: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  info: 'bg-sky-500/10 text-sky-500 border-sky-500/30',
};

export const SEVERITY_LABEL: Record<'blocking' | 'warning' | 'info', string> = {
  blocking: 'Bloqueante',
  warning: 'Atenção',
  info: 'Informativo',
};
