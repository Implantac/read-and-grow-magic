import { useMemo, useState } from "react";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Input } from "@/ui/base/input";
import { Switch } from "@/ui/base/switch";
import { Code2, GitBranch, Loader2, Package, PlayCircle, Search, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  usePlugins,
  usePluginInstallations,
  useInstallPlugin,
  useUninstallPlugin,
  useTogglePlugin,
} from "@/hooks/usePlugins";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { PluginRunnerDialog } from "@/components/plugins/PluginRunnerDialog";
import { PluginVersionDialog } from "@/components/plugins/PluginVersionDialog";

export default function PluginMarketplace() {
  const { data: plugins, isLoading } = usePlugins();
  const { data: installs } = usePluginInstallations();
  const install = useInstallPlugin();
  const uninstall = useUninstallPlugin();
  const toggle = useTogglePlugin();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [runner, setRunner] = useState<{ id: string; key: string; name: string } | null>(null);
  const [versionDialog, setVersionDialog] = useState<{
    pluginId: string;
    pluginName: string;
    installationId: string;
    pinnedVersion: string | null;
    currentVersion: string;
  } | null>(null);

  const { data: isSystemAdmin } = useQuery({
    queryKey: ["is_system_admin"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data, error } = await supabase.rpc("is_system_admin", { _user_id: user.id });
      if (error) return false;
      return !!data;
    },
  });

  const installMap = useMemo(() => {
    const m = new Map<string, { id: string; status: string }>();
    (installs ?? []).forEach((i) => m.set(i.plugin_id, { id: i.id, status: i.status }));
    return m;
  }, [installs]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (plugins ?? []).forEach((p) => set.add(p.category));
    return ["all", ...Array.from(set).sort()];
  }, [plugins]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return (plugins ?? []).filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      );
    });
  }, [plugins, search, category]);

  const categoryLabel: Record<string, string> = {
    all: "Todos",
    fiscal: "Fiscal",
    financial: "Financeiro",
    communication: "Comunicação",
    logistics: "Logística",
    bi: "BI & Analytics",
    ai: "Inteligência Artificial",
    payments: "Pagamentos",
    general: "Geral",
  };

  return (
    <RoleGuard roles={["admin"]}>
      <PageContainer>
        <div className="flex items-start justify-between gap-3">
          <PageHeader
            title="Marketplace de Plugins"
            description="Estenda o ERP com integrações e automações por tenant"
            icon={Package}
          />
          {isSystemAdmin && (
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link to="/admin/marketplace/editor">
                <Code2 className="h-4 w-4 mr-1" />
                Editor
              </Link>
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar plugins..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Button
                key={c}
                variant={category === c ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(c)}
              >
                {categoryLabel[c] ?? c}
              </Button>
            ))}
          </div>
        </div>


        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum plugin encontrado.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const inst = installMap.get(p.id);
              const installed = !!inst;
              return (
                <Card key={p.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <Badge variant="outline">{p.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {p.vendor} · v{p.version}
                    </p>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {p.description}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {p.required_modules.map((m) => (
                        <Badge key={m} variant="secondary" className="text-xs">
                          {m}
                        </Badge>
                      ))}
                    </div>

                    <div className="text-sm font-medium">
                      {p.price_monthly > 0
                        ? `R$ ${p.price_monthly.toFixed(2)}/mês`
                        : "Gratuito"}
                    </div>

                    <div className="mt-auto flex items-center gap-2 pt-2 border-t">
                      {installed ? (
                        <>
                          <div className="flex items-center gap-2 flex-1">
                            <Switch
                              checked={inst!.status === "active"}
                              onCheckedChange={(v) =>
                                toggle.mutate({ id: inst!.id, enabled: v })
                              }
                            />
                            <span className="text-xs text-muted-foreground">
                              {inst!.status === "active" ? "Ativo" : "Pausado"}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRunner({ id: p.id, key: p.key, name: p.name })}
                            disabled={inst!.status !== "active"}
                            aria-label="Executar"
                          >
                            <PlayCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => uninstall.mutate(inst!.id)}
                            disabled={uninstall.isPending}
                            aria-label="Desinstalar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() => install.mutate(p.id)}
                          disabled={install.isPending}
                        >
                          Instalar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {runner && (
          <PluginRunnerDialog
            open={!!runner}
            onOpenChange={(v) => !v && setRunner(null)}
            pluginId={runner.id}
            pluginKey={runner.key}
            pluginName={runner.name}
          />
        )}
      </PageContainer>
    </RoleGuard>
  );
}
