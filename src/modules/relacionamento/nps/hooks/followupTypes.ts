import type { Tables, TablesUpdate } from '@/integrations/supabase/types';

export interface NPSFollowupClient {
  name: string | null;
  email: string | null;
  phone: string | null;
  address_city: string | null;
}

export type NPSFollowupRow = Tables<'nps_followups'> & {
  clients: NPSFollowupClient | null;
  nps_campaigns: { name: string | null } | null;
};

export type NPSFollowupPatch = TablesUpdate<'nps_followups'>;
