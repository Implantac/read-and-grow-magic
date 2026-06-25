import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEnterpriseStore } from "@/core/stores/useEnterpriseStore";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/ui/base/button";

type AppRole = "admin" | "manager" | "operator" | "viewer" | "system_admin";

interface RoleGuardProps {
  roles: AppRole[];
  children: ReactNode;
}

/**
 * Restricts a route to users that hold any of the given roles within
 * the active tenant. Renders a full "permission_denied" screen when
 * the user is not allowed.
 */
export function RoleGuard({ roles, children }: RoleGuardProps) {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  const navigate = useNavigate();
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

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div
        role="alert"
        aria-labelledby="permission-denied-title"
        className="min-h-[60vh] flex items-center justify-center p-6"
      >
        <div className="max-w-md w-full text-center space-y-4 rounded-2xl border border-destructive/30 bg-card/60 backdrop-blur p-8 shadow-xl">
          <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
          <h1
            id="permission-denied-title"
            className="text-2xl font-bold text-foreground tracking-tight"
          >
            permission_denied
          </h1>
          <p className="text-sm text-muted-foreground">
            Você não tem permissão para acessar esta área. É necessário o papel{" "}
            <span className="font-semibold text-foreground">
              {roles.join(" ou ")}
            </span>{" "}
            no tenant ativo.
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Voltar
            </Button>
            <Button onClick={() => navigate("/dashboard")}>
              Ir para Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
