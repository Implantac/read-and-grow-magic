import { useParams } from "react-router-dom";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { LayoutDashboard } from "lucide-react";
import { useDashboards, useDashboardWidgets } from "@/hooks/useDashboardEngine";
import { WidgetRenderer } from "@/components/dashboard/WidgetRenderer";

export default function DashboardView() {
  const { id } = useParams<{ id: string }>();
  const { data: dashboards = [] } = useDashboards();
  const { data: widgets = [], isLoading } = useDashboardWidgets(id);
  const dash = dashboards.find((d) => d.id === id);

  return (
    <PageContainer>
      <PageHeader
        title={dash?.name ?? "Dashboard"}
        description={dash?.description ?? "Dashboard personalizado"}
        icon={LayoutDashboard}
      />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando widgets…</p>
      ) : widgets.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum widget configurado. Acesse <code>/admin/dashboards</code> para adicionar.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((w) => <WidgetRenderer key={w.id} widget={w} />)}
        </div>
      )}
    </PageContainer>
  );
}
