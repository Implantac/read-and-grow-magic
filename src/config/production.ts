export const productionStatusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  planned: { label: 'Planejada', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800' },
  paused: { label: 'Pausada', color: 'bg-orange-100 text-orange-800' },
  completed: { label: 'Concluída', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
};

export const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Média', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
};
