import { Clock, Target, Zap, Users, MessageSquare, Shield, TrendingUp, CheckCircle2, type LucideIcon } from 'lucide-react';

export const objectionCategories = [
  { value: 'price', label: 'Preço', icon: '💰' },
  { value: 'stall', label: 'Enrolação', icon: '⏳' },
  { value: 'competitor', label: 'Concorrência', icon: '🏢' },
  { value: 'timing', label: 'Timing', icon: '📅' },
  { value: 'authority', label: 'Autoridade', icon: '👔' },
  { value: 'budget', label: 'Orçamento', icon: '💳' },
];

export type RoutineItem = { time: string; task: string; icon: LucideIcon };

export const dailyRoutine: RoutineItem[] = [
  { time: '08:00', task: 'Revisar pipeline e prioridades do dia', icon: Target },
  { time: '08:30', task: 'Verificar fila "O Que Fazer Hoje"', icon: Zap },
  { time: '09:00', task: 'Bloco de prospecção (leads novos)', icon: Users },
  { time: '10:30', task: 'Follow-ups de propostas enviadas', icon: MessageSquare },
  { time: '11:30', task: 'Reuniões de negociação agendadas', icon: Shield },
  { time: '14:00', task: 'Bloco de qualificação de oportunidades', icon: TrendingUp },
  { time: '15:30', task: 'Contatos de recuperação de clientes', icon: Users },
  { time: '16:30', task: 'Atualizar CRM e registrar atividades', icon: CheckCircle2 },
  { time: '17:00', task: 'Planejar próximo dia', icon: Clock },
];
