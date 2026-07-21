import { useMemo, useState } from "react";
import { Database, Settings2, FileText, GitBranch } from "lucide-react";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { EmptyState } from "@/shared/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/base/tabs";
import { useCustomEntities } from "@/hooks/useCustomEntities";
import { NewEntityDialog } from "./metadata/NewEntityDialog";
import { FieldsPanel } from "./metadata/FieldsPanel";
import { RecordsPanel } from "./metadata/RecordsPanel";
import { RelationshipsPanel } from "./metadata/RelationshipsPanel";

export default function MetadataConfigurator() {
  const { data: entities = [], isLoading } = useCustomEntities();
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const selectedEntity = useMemo(
    () => entities.find((e) => e.id === selectedId),
    [entities, selectedId]
  );

  return (
    <PageContainer>
      <PageHeader
        title="Metadata Engine"
        description="Crie entidades e campos personalizados sem código para adaptar o ERP ao seu segmento."
        icon={Database}
        actions={<NewEntityDialog />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {isLoading && (<p className="text-sm text-muted-foreground">Carregando...</p>)}
            {!isLoading && entities.length === 0 && (
              <EmptyState
                icon={Database}
                title="Nenhuma entidade"
                description="Crie a primeira entidade personalizada para começar."
              />
            )}
            {entities.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedId(e.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                  selectedId === e.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                }`}
              >
                <div className="font-medium">{e.label}</div>
                <div className="text-xs text-muted-foreground">{e.entity_key}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div>
          {selectedEntity ? (
            <Tabs defaultValue="fields">
              <TabsList>
                <TabsTrigger value="fields"><Settings2 className="mr-2 h-4 w-4" /> Campos</TabsTrigger>
                <TabsTrigger value="relationships"><GitBranch className="mr-2 h-4 w-4" /> Relacionamentos</TabsTrigger>
                <TabsTrigger value="records"><FileText className="mr-2 h-4 w-4" /> Registros</TabsTrigger>
              </TabsList>
              <TabsContent value="fields"><FieldsPanel entityId={selectedEntity.id} /></TabsContent>
              <TabsContent value="relationships"><RelationshipsPanel entityId={selectedEntity.id} /></TabsContent>
              <TabsContent value="records"><RecordsPanel entityId={selectedEntity.id} /></TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Selecione ou crie uma entidade.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
