import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/ui/base/card";
import { Input } from "@/ui/base/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/base/select";
import { Badge } from "@/ui/base/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/base/table";
import { Skeleton } from "@/ui/base/skeleton";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";

interface CriticalEvent {
  id: string;
  company_id: string | null;
  user_id: string | null;
  module: string;
  action: string;
  entity_name: string | null;
  entity_id: string | null;
  ip_address: string | null;
  created_at: string;
  old_data: unknown;
  new_data: unknown;
}

const ACTIONS = ["DELETE", "PERMISSION_CHANGE", "ROLE_CHANGE", "LOGIN_FAILED", "EXPORT"];
const MODULES = ["financial", "permissions", "user_roles", "billing"];

const levelColor = (action: string) => {
  if (["DELETE", "ROLE_CHANGE", "PERMISSION_CHANGE"].includes(action)) return "destructive";
  if (action === "LOGIN_FAILED") return "secondary";
  return "outline";
};

function SecurityAuditInner() {
  const [rows, setRows] = useState<CriticalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [days, setDays] = useState<string>("30");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - Number(days));
      let q = supabase
        .from("v_critical_audit_events" as any)
        .select("*")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(500);
      if (moduleFilter !== "all") q = q.eq("module", moduleFilter);
      if (actionFilter !== "all") q = q.eq("action", actionFilter);
      const { data, error } = await q;
      if (!cancelled) {
        if (error) console.warn("[SecurityAudit]", error.message);
        setRows((data as any) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [moduleFilter, actionFilter, days]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      [r.module, r.action, r.entity_name, r.entity_id, r.ip_address]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [rows, search]);

  return (
    <PageContainer>
      <PageHeader
        title="Auditoria de Segurança"
        description="Eventos sensíveis: exclusões, alterações de permissões/papéis, tentativas de login e exportações."
        icon={ShieldAlert}
      />

      <Card className="p-4 mb-4 grid gap-3 md:grid-cols-4">
        <Input
          placeholder="Buscar por entidade, IP, ação..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger><SelectValue placeholder="Módulo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os módulos</SelectItem>
            {MODULES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger><SelectValue placeholder="Ação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Últimas 24h</SelectItem>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum evento crítico no período selecionado.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Usuário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(r.created_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell><Badge variant="outline">{r.module}</Badge></TableCell>
                  <TableCell><Badge variant={levelColor(r.action) as any}>{r.action}</Badge></TableCell>
                  <TableCell className="text-xs">
                    {r.entity_name ?? "—"}
                    {r.entity_id && <div className="text-muted-foreground">{r.entity_id.slice(0, 8)}…</div>}
                  </TableCell>
                  <TableCell className="text-xs">{r.ip_address ?? "—"}</TableCell>
                  <TableCell className="text-xs">{r.user_id?.slice(0, 8) ?? "—"}…</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </PageContainer>
  );
}

export default function SecurityAudit() {
  return (
    <RoleGuard roles={["admin", "manager"]}>
      <SecurityAuditInner />
    </RoleGuard>
  );
}
