import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/shared/useSupabaseQuery';

export interface Notification {
  id: string;
  user_id: string | null;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  description: string;
  module: string;
  read: boolean;
  created_at: string;
}

export const notificationsService = {
  async getAll() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data as Notification[];
  },

  async markAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    if (error) throw error;
  },

  async markAllAsRead() {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false);
    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async clearAll() {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Hack for deleting all
    if (error) throw error;
  }
};

export function useNotifications() {
  const queryClient = useQueryClient();

  const query = useSupabaseQuery(
    ['notifications'], 
    () => notificationsService.getAll(),
    { refetchInterval: 30000 }
  );

  const notifications = query.data || [];

  const markAsRead = useSupabaseMutation(
    (id: string) => notificationsService.markAsRead(id),
    { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }) }
  );

  const markAllAsRead = useSupabaseMutation(
    (_variables?: void) => notificationsService.markAllAsRead(),
    { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }) }
  );

  const deleteNotification = useSupabaseMutation(
    (id: string) => notificationsService.delete(id),
    { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }) }
  );

  const clearAll = useSupabaseMutation(
    (_variables?: void) => notificationsService.clearAll(),
    { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }) }
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    isLoading: query.isLoading,
    unreadCount,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: deleteNotification.mutate,
    clearAll: clearAll.mutate,
  };
}
