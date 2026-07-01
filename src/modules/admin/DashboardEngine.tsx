import { useState } from "react";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Badge } from "@/ui/base/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/ui/base/dialog";
import { Plus, Trash2, LayoutDashboard, ExternalLink } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { Link } from "react-router-dom";
import { useDashboards, useDashboardWidgets, useDashboardMutations } from "@/hooks/useDashboardEngine";
import { WidgetRenderer } from "@/components/dashboard/WidgetRenderer";

export default function DashboardEngine() {
  const { data: dashboards = [] } = useDashboards();
  const [activeId, setActiveId] = useState<string | undefined>();
  const { data: widgets = [] } = useDashboardWidgets(activeId);
  const { saveDashboard, removeDashboard, saveWidget, removeWidget } = useDashboardMutations();

  const [dashOpen, setDashOpen] = useState(false);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [dashName, setDashName] = useState("");
  const [widgetForm, setWidgetForm] = useState({ title: "", widget_type: "kpi", data_source: "" });

  return (
    <PageContainer>
      <PageHeader title="Dashboard Engine" description="Construa dashboards e widgets personalizados por tenant" icon={LayoutDashboard} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Dashboards</CardTitle>
            <Dialog open={dashOpen} onOpenChange={setDashOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4" /></Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Dashboard</DialogTitle></DialogHeader>
                <Label>Nome</Label>
                <Input value={dashName} onChange={(e) => setDashName(e.target.value)} />
                <DialogFooter>
                  <Button onClick={async () => { await saveDashboard.mutateAsync({ name: dashName }); setDashName(""); setDashOpen(false); }} disabled={!dashName}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {dashboards.length === 0 ? (
              <EmptyState
                compact
                icon={LayoutDashboard}
                title="Nenhum dashboard"
                description="Crie um dashboard para consolidar KPIs e visualizações."
              />
            ) : (
              <div className="space-y-1">
                {dashboards.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setActiveId(d.id)}
                    className={`w-full text-left p-2 rounded border ${activeId === d.id ? "bg-accent" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{d.name}</span>
                      <div className="flex items-center gap-2">
                        <Link to={`/dashboards/${d.id}`} onClick={(e) => e.stopPropagation()}>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </Link>
                        <Trash2 className="h-3 w-3 text-muted-foreground" onClick={(e) => { e.stopPropagation(); removeDashboard.mutate(d.id); }} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Widgets {activeId ? `(${widgets.length})` : ""}</CardTitle>
            <Dialog open={widgetOpen} onOpenChange={setWidgetOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!activeId}><Plus className="h-4 w-4 mr-1" /> Widget</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Widget</DialogTitle></DialogHeader>
                <div className="space-y-2">
                  <div><Label>Título</Label><Input value={widgetForm.title} onChange={(e) => setWidgetForm({ ...widgetForm, title: e.target.value })} /></div>
                  <div><Label>Tipo</Label><Input value={widgetForm.widget_type} onChange={(e) => setWidgetForm({ ...widgetForm, widget_type: e.target.value })} placeholder="kpi | line | bar | pie | table" /></div>
                  <div><Label>Fonte de dados</Label><Input value={widgetForm.data_source} onChange={(e) => setWidgetForm({ ...widgetForm, data_source: e.target.value })} placeholder="ex: sales.total, orders.count" /></div>
                </div>
                <DialogFooter>
                  <Button onClick={async () => {
                    if (!activeId) return;
                    await saveWidget.mutateAsync({ dashboard_id: activeId, ...widgetForm });
                    setWidgetForm({ title: "", widget_type: "kpi", data_source: "" });
                    setWidgetOpen(false);
                  }} disabled={!widgetForm.title || !widgetForm.data_source}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {!activeId ? (
              <EmptyState
                compact
                icon={LayoutDashboard}
                title="Selecione um dashboard"
                description="Escolha um dashboard à esquerda para visualizar e configurar seus widgets."
              />
            ) : widgets.length === 0 ? (
              <EmptyState
                compact
                icon={Plus}
                title="Nenhum widget"
                description="Adicione o primeiro widget para começar a visualizar dados neste dashboard."
              />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {widgets.map((w) => (
                    <div key={w.id} className="relative">
                      <Trash2
                        className="h-4 w-4 cursor-pointer text-muted-foreground absolute top-2 right-2 z-10"
                        onClick={() => removeWidget.mutate({ id: w.id, dashboard_id: activeId })}
                      />
                      <WidgetRenderer widget={w as any} />
                      <p className="text-[10px] text-muted-foreground mt-1 px-1">
                        <Badge variant="outline" className="text-[10px] mr-1">{w.widget_type}</Badge>
                        {w.data_source}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
