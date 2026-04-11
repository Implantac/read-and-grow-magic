import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GamificationBadge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  points_required: number;
}

export interface BadgeAward {
  id: string;
  sales_rep_id: string;
  badge_id: string;
  awarded_at: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string | null;
  mission_type: string;
  action_type: string;
  target_count: number;
  reward_points: number;
  icon: string;
}

export interface MissionProgress {
  id: string;
  sales_rep_id: string;
  mission_id: string;
  current_count: number;
  completed: boolean;
  completed_at: string | null;
  mission_date: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string;
  start_date: string;
  end_date: string;
  prize_description: string | null;
  bonus_points: number;
  status: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  sales_rep_id: string;
  score: number;
  rank: number | null;
}

export interface LeaderboardEntry {
  sales_rep_id: string;
  total_points: number;
  badges_count: number;
  missions_completed: number;
}

// Points
export function useGamificationPoints(salesRepId?: string) {
  return useQuery({
    queryKey: ['gamification_points', salesRepId],
    queryFn: async () => {
      let q = supabase.from('gamification_points').select('*').order('created_at', { ascending: false }).limit(200);
      if (salesRepId) q = q.eq('sales_rep_id', salesRepId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddPoints() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (entry: { sales_rep_id: string; action_type: string; points: number; description?: string; reference_id?: string }) => {
      const { error } = await supabase.from('gamification_points').insert(entry as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gamification_points'] });
      qc.invalidateQueries({ queryKey: ['gamification_leaderboard'] });
    },
  });
}

// Badges
export function useBadges() {
  return useQuery({
    queryKey: ['gamification_badges'],
    queryFn: async () => {
      const { data, error } = await supabase.from('gamification_badges').select('*').eq('active', true);
      if (error) throw error;
      return (data ?? []) as GamificationBadge[];
    },
  });
}

export function useBadgeAwards(salesRepId?: string) {
  return useQuery({
    queryKey: ['gamification_badge_awards', salesRepId],
    queryFn: async () => {
      let q = supabase.from('gamification_badge_awards').select('*');
      if (salesRepId) q = q.eq('sales_rep_id', salesRepId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as BadgeAward[];
    },
  });
}

// Missions
export function useMissions() {
  return useQuery({
    queryKey: ['gamification_missions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('gamification_missions').select('*').eq('active', true);
      if (error) throw error;
      return (data ?? []) as Mission[];
    },
  });
}

export function useMissionProgress(salesRepId: string) {
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['gamification_mission_progress', salesRepId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gamification_mission_progress')
        .select('*')
        .eq('sales_rep_id', salesRepId)
        .eq('mission_date', today);
      if (error) throw error;
      return (data ?? []) as MissionProgress[];
    },
    enabled: !!salesRepId,
  });
}

// Challenges
export function useChallenges() {
  return useQuery({
    queryKey: ['gamification_challenges'],
    queryFn: async () => {
      const { data, error } = await supabase.from('gamification_challenges').select('*').eq('status', 'active');
      if (error) throw error;
      return (data ?? []) as Challenge[];
    },
  });
}

export function useChallengeParticipants(challengeId?: string) {
  return useQuery({
    queryKey: ['gamification_challenge_participants', challengeId],
    queryFn: async () => {
      let q = supabase.from('gamification_challenge_participants').select('*').order('score', { ascending: false });
      if (challengeId) q = q.eq('challenge_id', challengeId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ChallengeParticipant[];
    },
    enabled: !!challengeId,
  });
}

// Leaderboard (aggregated from points)
export function useLeaderboard() {
  return useQuery({
    queryKey: ['gamification_leaderboard'],
    queryFn: async () => {
      const { data: points, error } = await supabase.from('gamification_points').select('sales_rep_id, points');
      if (error) throw error;

      const map = new Map<string, number>();
      (points ?? []).forEach((p: any) => {
        map.set(p.sales_rep_id, (map.get(p.sales_rep_id) || 0) + p.points);
      });

      const entries = Array.from(map.entries())
        .map(([sales_rep_id, total_points]) => ({ sales_rep_id, total_points }))
        .sort((a, b) => b.total_points - a.total_points);

      return entries;
    },
  });
}
