import type { Tables } from '@/integrations/supabase/types';

/** Contato do cliente embutido no convite (join `clients(...)`). */
export interface InviteClient {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

/** Convite NPS com os relacionamentos usados nas telas. */
export type NPSInvite = Tables<'nps_invites'> & {
  clients?: InviteClient | null;
  nps_campaigns?: { name?: string | null } | null;
};

/** Cliente exibido no seletor de destinatários. */
export interface ClientPickerRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address_city: string | null;
  segment: string | null;
}
