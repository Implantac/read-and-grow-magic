import type { Database } from '@/integrations/supabase/types';

export type NPSCampaign = Database['public']['Tables']['nps_campaigns']['Row'];
export type NPSAnswer = Database['public']['Tables']['nps_answers']['Row'];
export type NPSInvite = Database['public']['Tables']['nps_invites']['Row'];
export type NPSTemplate = Database['public']['Tables']['nps_templates']['Row'];
export type NPSAutomation = Database['public']['Tables']['nps_automations']['Row'];
export type NPSWebhook = Database['public']['Tables']['nps_webhooks']['Row'];
export type NPSQuestion = Database['public']['Tables']['nps_questions']['Row'];
export type NPSCategory = 'promoter' | 'passive' | 'detractor';

export interface NPSStats {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
  responseRate: number;
  activeCampaigns: number;
}
