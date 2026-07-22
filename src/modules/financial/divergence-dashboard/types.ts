import { Package, Banknote } from 'lucide-react';

export interface Notif {
  id: string;
  type: string;
  title: string;
  description: string;
  module: string | null;
  read: boolean;
  created_at: string;
  assigned_to: string | null;
  due_at: string | null;
  resolved_at: string | null;
  escalated_at?: string | null;
  escalated_from?: string | null;
}

export interface CompanyUser {
  id: string;
  name: string | null;
}

export const ROUTE_BY_TITLE: Record<string, string> = {
  'Divergência faturamento × estoque': '/comercial/reconciliacao-faturamento-estoque',
  'Divergência bancária por canal': '/financeiro/conciliacao-canal',
};

export const ICON_BY_TITLE: Record<string, typeof Package> = {
  'Divergência faturamento × estoque': Package,
  'Divergência bancária por canal': Banknote,
};

export type FilterStatus = 'open' | 'resolved' | 'all' | 'mine' | 'overdue';
