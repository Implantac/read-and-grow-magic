import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEnterpriseStore } from "@/core/stores/useEnterpriseStore";
import { Loader2 } from "lucide-react";

type AppRole = "admin" | "manager" | "operator" | "viewer" | "system_admin";

interface RoleGuardProps {
  roles: AppRole[];
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Restricts a route to users that hold any of the given roles within
 * the active tenant. Shows a permission_denied toast and redirects when
 * the user is not allowed.
 */
export function RoleGuard({ roles, children, redirectTo = "/dashboard" }: RoleGuardProps) {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  const [state, setState] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !companyId) {
        if (!cancelled) setState("denied");
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("company_id", companyId)
        .in("role", roles as any)
        .limit(1);

      if (cancelled) return;
      if (error || !data || data.length === 0) {
        setState("denied");
      } else {
        setState("allowed");
      }
    })();
    return () => { cancelled = true; };
  }, [companyId, roles.join(",")]);

  useEffect(() => {
    if (state === "denied") {
      toast.error("Permissão negada", {
        description: "Você não possui acesso a esta área. Contate um administrador.",
      });
    }
  }, [state]);

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (state === "denied") {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
