import { useState } from 'react';
import { Card, CardContent } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { ArrowRightLeft, Plus, RefreshCw, CheckCircle2, Zap, Settings2, Activity } from 'lucide-react';
import { useRFIDEvents } from '@/hooks/system/useRFID';
import { useRFIDWMSRules, emptyRule, type WMSRule, type RuleFormData } from './integration/useRFIDWMSRules';
import { RuleDialog } from './integration/RuleDialog';
import { RulesTable } from './integration/RulesTable';
import { ActionLogTab, HowToTab } from './integration/OtherTabs';

export default function RFIDIntegrationPage() {
  const { rules, loading, refetch, create, update, remove, toggleEnabled } = useRFIDWMSRules();
  const { events } = useRFIDEvents(50);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WMSRule | null>(null);

  const processedEvents = events.filter(e => e.processed && e.actionTaken);
  const activeRules = rules.filter(r => r.enabled).length;
  const totalRules = rules.length;

  const openNew = () => { setEditTarget(null); setDialogOpen(true); };
  const openEdit = (rule: WMSRule) => { setEditTarget(rule); setDialogOpen(true); };

  const handleSave = async (data: RuleFormData) => {
    if (editTarget) {
      return update(editTarget.id, {
        name: data.name, description: data.description, enabled: data.enabled,
        triggerZone: data.triggerZone, triggerEventType: data.triggerEventType,
        triggerReaderCode: data.triggerReaderCode, wmsAction: data.wmsAction,
        wmsTargetLocation: data.wmsTargetLocation, autoComplete: data.autoComplete,
        priority: data.priority,
      });
    }
    return create(data);
  };

  const getInitialForEdit = (rule: WMSRule): RuleFormData => ({
    name: rule.name, description: rule.description ?? '',
    enabled: rule.enabled, triggerZone: rule.triggerZone ?? '',
    triggerEventType: rule.triggerEventType, triggerReaderCode: rule.triggerReaderCode ?? '',
    wmsAction: rule.wmsAction, wmsTargetLocation: rule.wmsTargetLocation ?? '',
    autoComplete: rule.autoComplete, priority: rule.priority,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 text-primary" />
            Integração RFID ↔ WMS
          </h1>
          <p className="text-muted-foreground">Regras de automação: eventos RFID acionando operações WMS em tempo real</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch}><RefreshCw className="h-4 w-4 mr-1" />Atualizar</Button>
          <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" />Nova Regra</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-5 flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10"><Zap className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{activeRules}</p><p className="text-xs text-muted-foreground">Regras Ativas</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 flex items-center gap-3">
          <div className="p-2 rounded-md bg-muted"><Settings2 className="h-5 w-5 text-muted-foreground" /></div>
          <div><p className="text-2xl font-bold">{totalRules}</p><p className="text-xs text-muted-foreground">Total de Regras</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 flex items-center gap-3">
          <div className="p-2 rounded-md bg-green-500/10"><CheckCircle2 className="h-5 w-5 text-green-500" /></div>
          <div><p className="text-2xl font-bold">{processedEvents.length}</p><p className="text-xs text-muted-foreground">Eventos Processados</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 flex items-center gap-3">
          <div className="p-2 rounded-md bg-amber-500/10"><Activity className="h-5 w-5 text-amber-500" /></div>
          <div><p className="text-2xl font-bold">{events.filter(e => !e.processed).length}</p><p className="text-xs text-muted-foreground">Aguardando</p></div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Regras de Automação</TabsTrigger>
          <TabsTrigger value="log">Log de Ações WMS</TabsTrigger>
          <TabsTrigger value="howto">Como Funciona</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4 mt-4">
          <RulesTable rules={rules} loading={loading} onEdit={openEdit} onRemove={remove} onToggle={toggleEnabled} />
        </TabsContent>
        <TabsContent value="log" className="mt-4"><ActionLogTab events={processedEvents} /></TabsContent>
        <TabsContent value="howto" className="mt-4"><HowToTab /></TabsContent>
      </Tabs>

      <RuleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        initial={editTarget ? getInitialForEdit(editTarget) : undefined}
      />
    </div>
  );
}
