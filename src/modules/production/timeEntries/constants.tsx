import { PlayCircle, Pause, CheckCircle } from 'lucide-react';
import { differenceInMinutes } from 'date-fns';
import type { TimeEntryRow } from '@/hooks/system/useTimeEntries';

export const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  started: { label: 'Em Andamento', variant: 'default', icon: <PlayCircle className="h-4 w-4" /> },
  paused: { label: 'Pausado', variant: 'secondary', icon: <Pause className="h-4 w-4" /> },
  completed: { label: 'Concluído', variant: 'outline', icon: <CheckCircle className="h-4 w-4" /> },
};

export function getElapsedTime(entry: TimeEntryRow) {
  const start = new Date(entry.start_time);
  const end = entry.end_time ? new Date(entry.end_time) : new Date();
  const minutes = Math.max(0, differenceInMinutes(end, start) - (entry.paused_time || 0));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export interface NewEntryForm {
  orderId: string;
  operationName: string;
  workCenter: string;
  operator: string;
}

export const EMPTY_ENTRY: NewEntryForm = { orderId: '', operationName: '', workCenter: '', operator: '' };
