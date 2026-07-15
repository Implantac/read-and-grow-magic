import { useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Skeleton } from "@/ui/base/skeleton";
import { EmptyState } from "@/shared/components/EmptyState";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  Store,
  Plus,
  ExternalLink,
  Palette,
  Play,
  Pause,
  Trash2,
} from "lucide-react";
import {
  useStorefronts,
  useUpdateStorefrontStatus,
  useDeleteStorefront,
} from "@/hooks/useCommerce";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  draft: { label: "Rascunho", variant: "outline" },
  published: { label: "Publicada", variant: "default" },
  paused: { label: "Pausada", variant: "secondary" },
};

const TYPE_LABELS: Record<string, string> = {
  b2c: "B2C",
  b2b: "B2B",
  hybrid: "Híbrida",
};

export default function CommerceStorefronts() {
  const { data: storefronts, isLoading } = useStorefronts();
  const updateStatus = useUpdateStorefrontStatus();
  const del = useDeleteStorefront();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <RoleGuard roles={["admin", "manager"]}>
      <PageContainer>
        <PageHeader
          title="Minhas Lojas"
          description="Gerencie suas lojas virtuais e escolha layouts prontos ou premium."
          actions={
            <Button asChild>
              <Link to="/commerce/lojas/nova">
                <Plus className="h-4 w-4 mr-1" /> Nova loja
              </Link>
            </Button>
          }
        />

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full" />
            ))}
          </div>
        ) : !storefronts || storefronts.length === 0 ? (
          <EmptyState
            icon={Store}
            title="Nenhuma loja criada"
            description="Crie sua primeira loja B2C escolhendo um layout do marketplace."
            action={{
              label: "Criar primeira loja",
              onClick: () => (window.location.href = "/commerce/lojas/nova"),
            }}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {storefronts.map((s) => {
              const st = STATUS_LABELS[s.status];
              return (
                <Card key={s.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{s.name}</CardTitle>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {TYPE_LABELS[s.storefront_type]}
                      </Badge>
                      <span>/{s.slug}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div
                      className="h-20 rounded border"
                      style={{
                        background: `linear-gradient(135deg, ${s.primary_color}, ${s.secondary_color})`,
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/commerce/lojas/${s.id}`}>
                          <ExternalLink className="h-3 w-3 mr-1" /> Abrir
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/commerce/lojas/${s.id}/tema`}>
                          <Palette className="h-3 w-3 mr-1" /> Tema
                        </Link>
                      </Button>
                      {s.status === "published" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            updateStatus.mutate({ id: s.id, status: "paused" })
                          }
                        >
                          <Pause className="h-3 w-3 mr-1" /> Pausar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            updateStatus.mutate({ id: s.id, status: "published" })
                          }
                        >
                          <Play className="h-3 w-3 mr-1" /> Publicar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          confirmDelete === s.id
                            ? del.mutate(s.id)
                            : setConfirmDelete(s.id)
                        }
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        {confirmDelete === s.id ? "Confirmar" : "Remover"}
                      </Button>
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
