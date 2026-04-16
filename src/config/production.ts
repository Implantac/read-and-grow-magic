export const productionStatusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  planned: { label: 'Planejada', color: 'bg-blue-100 text-blue-800' },
  waiting_material: { label: 'Aguardando Material', color: 'bg-purple-100 text-purple-800' },
  in_progress: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800' },
  outsourced: { label: 'Terceirizado', color: 'bg-indigo-100 text-indigo-800' },
  paused: { label: 'Pausada', color: 'bg-orange-100 text-orange-800' },
  finishing: { label: 'Finalização', color: 'bg-teal-100 text-teal-800' },
  completed: { label: 'Concluída', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
};

export const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Média', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
};

export const outsourcingStatusConfig: Record<string, { label: string; color: string }> = {
  sent: { label: 'Enviado', color: 'bg-blue-100 text-blue-800' },
  in_production: { label: 'Em Produção Externa', color: 'bg-amber-100 text-amber-800' },
  returned: { label: 'Retornado', color: 'bg-green-100 text-green-800' },
  late: { label: 'Atrasado', color: 'bg-red-100 text-red-800' },
};
