export const supplierCategories = [
  'Matéria Prima',
  'Componentes',
  'Embalagens',
  'Serviços',
  'Químicos',
  'Metais',
  'Equipamentos',
  'Manutenção',
];

export const purchaseOrderStatuses: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  pending_approval: { label: 'Aguardando Aprovação', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Aprovado', color: 'bg-blue-100 text-blue-800' },
  sent: { label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
  confirmed: { label: 'Confirmado', color: 'bg-indigo-100 text-indigo-800' },
  partial_received: { label: 'Recebido Parcial', color: 'bg-orange-100 text-orange-800' },
  received: { label: 'Recebido', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

export const quotationStatuses: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  sent: { label: 'Enviada', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Concluída', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
};
