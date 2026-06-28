import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnterpriseStore } from "@/core/stores/useEnterpriseStore";
import { useAuth } from "@/hooks/system/useAuth";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Badge } from "@/ui/base/badge";
import { Switch } from "@/ui/base/switch";
import { Loader2, UserCheck2, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type Delegation = {
  id: string;
  from_user: string;
  to_user: string;
  reason: string | null;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
};

export default function WorkflowDelegations() {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  const { user } = useAuth();
  const qc = useQueryClient();

  const [toUser, setToUser] = useState("");
  const [reason, setReason] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["workflow_delegations", companyId, user?.id],
    enabled: !!companyId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_delegations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Delegation[];
    },
  });

  useEffect(() => {
    if (!companyId) return;
    const ch = supabase
      .channel(`wdel-${companyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workflow_delegations", filter: `company_id=eq.${companyId}` },
        () => qc.invalidateQueries({ queryKey: ["workflow_delegations"] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [companyId, qc]);

  const create = useMutation({
    mutationFn: async () => {
      if (!user || !companyId) return;
      const { error } = await supabase.from("workflow_delegations").insert({
        company_id: companyId,
        from_user: user.id,
        to_user: toUser,
        reason: reason || null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Delegação criada");
      setToUser(""); setReason(""); setEndsAt("");
      qc.invalidateQueries({ queryKey: ["workflow_delegations"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao criar"),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("workflow_delegations").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflow_delegations"] }),
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workflow_delegations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflow_delegations"] }),
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  return (
    <PageContainer>
      <PageHeader
        title="Delegações de Aprovação"
        description="Permita que outro usuário responda por você quando estiver ausente"
        icon={UserCheck2}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nova delegação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Delegar para (ID do usuário)</label>
            <Input value={toUser} onChange={(e) => setToUser(e.target.value)} placeholder="uuid" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Motivo</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Férias, viagem..." />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Termina em (opcional)</label>
            <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button disabled={!toUser || create.isPending} onClick={() => create.mutate()} className="w-full">
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" />Criar</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Delegações da empresa</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma delegação configurada.</p>
          ) : (
            <div className="space-y-2">
              {rows.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 border rounded-md px-3 py-2">
                  <div className="text-sm space-y-0.5">
                    <div className="font-mono text-xs">
                      {d.from_user.slice(0, 8)} → {d.to_user.slice(0, 8)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {d.reason ?? "—"} · {format(new Date(d.starts_at), "dd/MM/yyyy")}
                      {d.ends_at ? ` até ${format(new Date(d.ends_at), "dd/MM/yyyy")}` : " (sem fim)"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={d.is_active ? "default" : "outline"}>
                      {d.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                    <Switch
                      checked={d.is_active}
                      onCheckedChange={(v) => toggleActive.mutate({ id: d.id, active: v })}
                    />
                    <Button size="icon" variant="ghost" onClick={() => remove.mutate(d.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
