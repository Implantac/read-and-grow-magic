import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Textarea } from "@/ui/base/textarea";
import { Label } from "@/ui/base/label";
import { Badge } from "@/ui/base/badge";
import { Switch } from "@/ui/base/switch";
import { Code2, GitBranch, Loader2, Plus, Save, Trash2, Upload } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { handleMutationError, toastSuccess } from "@/lib/toastHelpers";

interface PluginRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  vendor: string | null;
  version: string;
  required_modules: string[] | null;
  price_monthly: number;
  is_published: boolean;
  sandbox_script: string | null;
  manifest: Record<string, unknown> | null;
}

const BLANK: Omit<PluginRow, "id"> = {
  key: "",
  name: "",
  description: "",
  category: "general",
  vendor: "",
  version: "0.1.0",
  required_modules: [],
  price_monthly: 0,
  is_published: false,
  sandbox_script: `// Plugin sandbox script
// Use register(action, async (input, ctx) => { ... }) to expose actions.
// ctx.fetch(url, init) — proxied HTTP. ctx.secrets — installation config.
register("hello", async (input) => {
  return { ok: true, echo: input };
});
`,
  manifest: { actions: ["hello"], permissions: [] },
};

function usePluginsAll() {
  return useQuery({
    queryKey: ["plugins_admin_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plugins")
        .select("*")
        .order("category")
        .order("name");
      if (error) throw error;
      return (data ?? []) as PluginRow[];
    },
  });
}

interface PluginVersionRow {
  id: string;
  version: string;
  changelog: string | null;
  published_at: string;
}

function usePluginVersions(pluginId: string | null) {
  return useQuery({
    queryKey: ["plugin_versions", pluginId],
    enabled: !!pluginId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plugin_versions")
        .select("id, version, changelog, published_at")
        .eq("plugin_id", pluginId!)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PluginVersionRow[];
    },
  });
}


export default function PluginEditor() {
  const qc = useQueryClient();
  const { data: plugins, isLoading } = usePluginsAll();
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<PluginRow | (Omit<PluginRow, "id"> & { id?: string }) | null>(null);
  const [manifestText, setManifestText] = useState("");
  const [manifestError, setManifestError] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (selectedId === "new") return { ...BLANK } as any;
    return plugins?.find((p) => p.id === selectedId) ?? null;
  }, [plugins, selectedId]);

  useEffect(() => {
    if (selected) {
      setDraft(selected);
      setManifestText(JSON.stringify(selected.manifest ?? {}, null, 2));
      setManifestError(null);
    } else {
      setDraft(null);
      setManifestText("");
    }
  }, [selected]);

  const save = useMutation({
    mutationFn: async () => {
      if (!draft) throw new Error("Nenhum plugin selecionado");
      let manifest: any = null;
      try {
        manifest = manifestText.trim() ? JSON.parse(manifestText) : {};
      } catch (e: any) {
        throw new Error(`Manifest JSON inválido: ${e.message}`);
      }
      const payload = {
        key: draft.key.trim(),
        name: draft.name.trim(),
        description: draft.description || null,
        category: draft.category || "general",
        vendor: draft.vendor || null,
        version: draft.version || "0.1.0",
        required_modules: draft.required_modules ?? [],
        price_monthly: Number(draft.price_monthly) || 0,
        is_published: !!draft.is_published,
        sandbox_script: draft.sandbox_script || null,
        manifest,
      };
      if (!payload.key) throw new Error("Key é obrigatória");
      if (!payload.name) throw new Error("Nome é obrigatório");

      if (selectedId === "new" || !("id" in draft) || !draft.id) {
        const { data, error } = await supabase
          .from("plugins")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data as PluginRow;
      }
      const { data, error } = await supabase
        .from("plugins")
        .update(payload)
        .eq("id", draft.id!)
        .select()
        .single();
      if (error) throw error;
      return data as PluginRow;
    },
    onSuccess: (row) => {
      toastSuccess("Plugin salvo");
      qc.invalidateQueries({ queryKey: ["plugins_admin_all"] });
      qc.invalidateQueries({ queryKey: ["plugins"] });
      setSelectedId(row.id);
    },
    onError: handleMutationError,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plugins").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toastSuccess("Plugin removido");
      qc.invalidateQueries({ queryKey: ["plugins_admin_all"] });
      qc.invalidateQueries({ queryKey: ["plugins"] });
      setSelectedId(null);
    },
    onError: handleMutationError,
  });

  const update = <K extends keyof PluginRow>(k: K, v: PluginRow[K]) => {
    setDraft((d) => (d ? ({ ...d, [k]: v } as any) : d));
  };

  return (
    <RoleGuard roles={["system_admin"]}>
      <PageContainer>
        <PageHeader
          title="Editor de Plugins"
          description="Crie e edite plugins do marketplace (script de sandbox + manifesto)"
          icon={Code2}
        />

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          {/* List */}
          <Card className="self-start">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">Plugins</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedId("new")}
                aria-label="Novo plugin"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-2 max-h-[70vh] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : (plugins ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum plugin cadastrado.
                </p>
              ) : (
                <ul className="space-y-1">
                  {plugins!.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(p.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedId === p.id
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{p.name}</span>
                          {!p.is_published && (
                            <Badge variant="outline" className="text-[10px]">
                              rascunho
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {p.key} · v{p.version}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Editor */}
          {!draft ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                Selecione um plugin à esquerda ou clique em + para criar.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedId === "new" ? "Novo plugin" : draft.name || "Plugin"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label htmlFor="pl-key">Key (identificador único)</Label>
                    <Input
                      id="pl-key"
                      value={draft.key}
                      onChange={(e) => update("key", e.target.value)}
                      placeholder="ex: nfe-cancelamento-massa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pl-name">Nome</Label>
                    <Input
                      id="pl-name"
                      value={draft.name}
                      onChange={(e) => update("name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pl-cat">Categoria</Label>
                    <Input
                      id="pl-cat"
                      value={draft.category}
                      onChange={(e) => update("category", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pl-ver">Versão</Label>
                    <Input
                      id="pl-ver"
                      value={draft.version}
                      onChange={(e) => update("version", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pl-vendor">Vendor</Label>
                    <Input
                      id="pl-vendor"
                      value={draft.vendor ?? ""}
                      onChange={(e) => update("vendor", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pl-price">Preço mensal (R$)</Label>
                    <Input
                      id="pl-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={draft.price_monthly}
                      onChange={(e) => update("price_monthly", Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="pl-desc">Descrição</Label>
                  <Textarea
                    id="pl-desc"
                    rows={2}
                    value={draft.description ?? ""}
                    onChange={(e) => update("description", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="pl-mods">
                    Módulos requeridos (separe por vírgula)
                  </Label>
                  <Input
                    id="pl-mods"
                    value={(draft.required_modules ?? []).join(", ")}
                    onChange={(e) =>
                      update(
                        "required_modules",
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                      )
                    }
                    placeholder="ex: fiscal, financial"
                  />
                </div>

                <div>
                  <Label htmlFor="pl-manifest">Manifest (JSON)</Label>
                  <Textarea
                    id="pl-manifest"
                    rows={6}
                    value={manifestText}
                    onChange={(e) => {
                      setManifestText(e.target.value);
                      try {
                        if (e.target.value.trim()) JSON.parse(e.target.value);
                        setManifestError(null);
                      } catch (err: any) {
                        setManifestError(err.message);
                      }
                    }}
                    className="font-mono text-xs"
                  />
                  {manifestError && (
                    <p className="text-xs text-destructive mt-1">{manifestError}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="pl-script">
                    Sandbox script (JS — roda em Web Worker isolado)
                  </Label>
                  <Textarea
                    id="pl-script"
                    rows={16}
                    value={draft.sandbox_script ?? ""}
                    onChange={(e) => update("sandbox_script", e.target.value)}
                    className="font-mono text-xs"
                    spellCheck={false}
                  />
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="pl-pub"
                      checked={draft.is_published}
                      onCheckedChange={(v) => update("is_published", v)}
                    />
                    <Label htmlFor="pl-pub" className="cursor-pointer">
                      Publicado no marketplace
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    {selectedId !== "new" && "id" in draft && draft.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Remover o plugin "${draft.name}"?`)) {
                            remove.mutate(draft.id!);
                          }
                        }}
                        disabled={remove.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => save.mutate()}
                      disabled={save.isPending || !!manifestError}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Salvar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </PageContainer>
    </RoleGuard>
  );
}
