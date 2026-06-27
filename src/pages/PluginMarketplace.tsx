import { useMemo, useState } from "react";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Input } from "@/ui/base/input";
import { Switch } from "@/ui/base/switch";
import { Loader2, Package, Search, Trash2 } from "lucide-react";
import {
  usePlugins,
  usePluginInstallations,
  useInstallPlugin,
  useUninstallPlugin,
  useTogglePlugin,
} from "@/hooks/usePlugins";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function PluginMarketplace() {
  const { data: plugins, isLoading } = usePlugins();
  const { data: installs } = usePluginInstallations();
  const install = useInstallPlugin();
  const uninstall = useUninstallPlugin();
  const toggle = useTogglePlugin();
  const [search, setSearch] = useState("");

  const installMap = useMemo(() => {
    const m = new Map<string, { id: string; status: string }>();
    (installs ?? []).forEach((i) => m.set(i.plugin_id, { id: i.id, status: i.status }));
    return m;
  }, [installs]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return (plugins ?? []).filter(
      (p) =>
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term),
    );
  }, [plugins, search]);

  return (
    <RoleGuard role="admin">
      <PageContainer>
        <PageHeader
          title="Marketplace de Plugins"
          description="Estenda o ERP com integrações e automações por tenant"
          icon={Package}
        />

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar plugins..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
      </PageContainer>
    </RoleGuard>
  );
}
