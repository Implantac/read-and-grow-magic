import { useEffect, useMemo, useState } from "react";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent } from "@/ui/base/card";
import { Code2 } from "lucide-react";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { PluginList } from "./plugin-editor/PluginList";
import { PluginForm } from "./plugin-editor/PluginForm";
import {
  usePluginsAll,
  usePluginVersions,
  useSavePlugin,
  useRemovePlugin,
  usePublishVersion,
} from "./plugin-editor/hooks";
import { BLANK, type PluginDraft, type PluginRow } from "./plugin-editor/types";

export default function PluginEditor() {
  const { data: plugins, isLoading } = usePluginsAll();
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<PluginDraft | null>(null);
  const [manifestText, setManifestText] = useState("");
  const [manifestError, setManifestError] = useState<string | null>(null);

  const currentPluginId = draft && "id" in draft && draft.id ? (draft.id as string) : null;
  const { data: versions } = usePluginVersions(currentPluginId);

  const selected = useMemo(() => {
    if (selectedId === "new") return { ...BLANK } as PluginDraft;
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

  const save = useSavePlugin({
    draft,
    manifestText,
    selectedId,
    onSaved: (row) => setSelectedId(row.id),
  });
  const remove = useRemovePlugin(() => setSelectedId(null));
  const publishVersion = usePublishVersion({ pluginId: currentPluginId, draft, manifestText });

  const update = <K extends keyof PluginRow>(k: K, v: PluginRow[K]) => {
    setDraft((d) => (d ? ({ ...d, [k]: v } as PluginDraft) : d));
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
          <PluginList
            plugins={plugins}
            isLoading={isLoading}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {!draft ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                Selecione um plugin à esquerda ou clique em + para criar.
              </CardContent>
            </Card>
          ) : (
            <PluginForm
              draft={draft}
              selectedId={selectedId}
              manifestText={manifestText}
              manifestError={manifestError}
              onManifestChange={setManifestText}
              onManifestError={setManifestError}
              update={update}
              versions={versions}
              currentPluginId={currentPluginId}
              onPublishVersion={() => publishVersion.mutate()}
              publishPending={publishVersion.isPending}
              onSave={() => save.mutate()}
              savePending={save.isPending}
              onRemove={(id) => remove.mutate(id)}
              removePending={remove.isPending}
            />
          )}
        </div>
      </PageContainer>
    </RoleGuard>
  );
}
