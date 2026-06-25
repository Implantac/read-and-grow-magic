import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnterpriseStore } from "@/store/useEnterpriseStore";

/**
 * Granular permission check (RBAC 1.6).
 * Falls back to false while loading to avoid leaking UI.
 */
export function usePermission(resource: string, action: string) {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);

  const { data, isLoading } = useQuery({
    queryKey: ["has_permission", companyId, resource, action],
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !companyId) return false;
      const { data, error } = await supabase.rpc("has_permission", {
        _user_id: user.id,
        _company_id: companyId,
        _resource: resource,
        _action: action,
      });
      if (error) return false;
      return !!data;
    },
  });

  return { allowed: !!data, loading: isLoading };
}
