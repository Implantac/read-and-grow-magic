import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleMutationError, toastSuccess } from "@/lib/toastHelpers";

export interface PluginReview {
  id: string;
  plugin_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface PluginRatingSummary {
  plugin_id: string;
  avg: number;
  count: number;
  histogram: Record<1 | 2 | 3 | 4 | 5, number>;
}

/** Aggregated ratings for every published plugin (used by cards & filters). */
export function usePluginRatings() {
  return useQuery({
    queryKey: ["plugin_ratings_summary"],
    staleTime: 60_000,
    queryFn: async (): Promise<Record<string, PluginRatingSummary>> => {
      const { data, error } = await supabase
        .from("plugin_reviews")
        .select("plugin_id, rating");
      if (error) throw error;
      const map: Record<string, PluginRatingSummary> = {};
      (data ?? []).forEach((r) => {
        const s = (map[r.plugin_id] ??= {
          plugin_id: r.plugin_id,
          avg: 0,
          count: 0,
          histogram: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        });
        s.count += 1;
        s.histogram[r.rating as 1 | 2 | 3 | 4 | 5] += 1;
      });
      Object.values(map).forEach((s) => {
        const total = (Object.entries(s.histogram) as [string, number][]).reduce(
          (acc, [k, v]) => acc + Number(k) * v,
          0,
        );
        s.avg = s.count ? total / s.count : 0;
      });
      return map;
    },
  });
}

/** All reviews for one plugin, newest first. */
export function usePluginReviews(pluginId: string | null) {
  return useQuery({
    queryKey: ["plugin_reviews", pluginId],
    enabled: !!pluginId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plugin_reviews")
        .select("*")
        .eq("plugin_id", pluginId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PluginReview[];
    },
  });
}

export function useUpsertPluginReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { pluginId: string; rating: number; comment: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Faça login para avaliar");
      const { error } = await supabase
        .from("plugin_reviews")
        .upsert(
          {
            plugin_id: input.pluginId,
            user_id: uid,
            rating: input.rating,
            comment: input.comment.trim() || null,
          },
          { onConflict: "plugin_id,user_id" },
        );
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["plugin_reviews", v.pluginId] });
      qc.invalidateQueries({ queryKey: ["plugin_ratings_summary"] });
      toastSuccess("Avaliação enviada");
    },
    onError: handleMutationError,
  });
}

export function useDeletePluginReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plugin_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plugin_reviews"] });
      qc.invalidateQueries({ queryKey: ["plugin_ratings_summary"] });
      toastSuccess("Avaliação removida");
    },
    onError: handleMutationError,
  });
}

/** Toggle auto-update on a plugin installation. */
export function useToggleAutoUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const patch: { auto_update: boolean; pinned_version?: string | null } = {
        auto_update: enabled,
      };
      // When enabling auto-update, unpin so the user follows the current version.
      if (enabled) patch.pinned_version = null;
      const { error } = await supabase
        .from("plugin_installations")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plugin_installations"] });
      toastSuccess("Atualização automática atualizada");
    },
    onError: handleMutationError,
  });
}
