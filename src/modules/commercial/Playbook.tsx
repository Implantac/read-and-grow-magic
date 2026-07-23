import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { usePlaybooks, useObjections, useLogPlaybookUsage, usePlaybookAdherence } from '@/hooks/commercial/usePlaybook';
import { BookOpen, MessageSquare, Target, Clock, TrendingUp } from 'lucide-react';
import { toastSuccess } from '@/lib/toastHelpers';
import { PlaybookFunnelTab } from '@/modules/commercial/playbook/PlaybookFunnelTab';
import { ObjectionsTab } from '@/modules/commercial/playbook/ObjectionsTab';
import { ClosingTab } from '@/modules/commercial/playbook/ClosingTab';
import { RoutineTab } from '@/modules/commercial/playbook/RoutineTab';
import { AdherenceTab } from '@/modules/commercial/playbook/AdherenceTab';

export default function PlaybookPage() {
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const { data: playbooks = [], isLoading: loadingPB } = usePlaybooks(selectedStage === 'all' ? undefined : selectedStage);
  const { data: objections = [], isLoading: loadingObj } = useObjections();
  const { data: usageLogs = [] } = usePlaybookAdherence();
  const logUsage = useLogPlaybookUsage();

  const copyToClipboard = (text: string, playbookId?: string) => {
    navigator.clipboard.writeText(text);
    toastSuccess('Copiado!', 'Script copiado para a área de transferência');
    if (playbookId) {
      logUsage.mutate({ playbook_id: playbookId, action_type: 'copy_script', context: text.slice(0, 50) });
    }
  };

  const markObjectionUsed = (objId: string) => {
    logUsage.mutate({ objection_id: objId, action_type: 'used_objection' });
    toastSuccess('✅ Registrado', 'Uso da resposta registrado com sucesso');
  };

  return (
    <PageContainer>
      <PageHeader
        title="📘 Playbook Comercial"
        description="Guia completo de vendas — scripts, objeções, técnicas e rotina"
      />

      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="funnel" className="gap-1"><BookOpen className="h-4 w-4" /> Por Etapa</TabsTrigger>
          <TabsTrigger value="objections" className="gap-1"><MessageSquare className="h-4 w-4" /> Objeções</TabsTrigger>
          <TabsTrigger value="closing" className="gap-1"><Target className="h-4 w-4" /> Fechamento</TabsTrigger>
          <TabsTrigger value="routine" className="gap-1"><Clock className="h-4 w-4" /> Rotina</TabsTrigger>
          <TabsTrigger value="adherence" className="gap-1"><TrendingUp className="h-4 w-4" /> Aderência</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="space-y-4">
          <PlaybookFunnelTab
            playbooks={playbooks}
            loading={loadingPB}
            selectedStage={selectedStage}
            setSelectedStage={setSelectedStage}
            onCopy={copyToClipboard}
          />
        </TabsContent>

        <TabsContent value="objections" className="space-y-4">
          <ObjectionsTab
            objections={objections}
            loading={loadingObj}
            onCopy={(t) => copyToClipboard(t)}
            onMarkUsed={markObjectionUsed}
          />
        </TabsContent>

        <TabsContent value="closing" className="space-y-4">
          <ClosingTab
            playbooks={playbooks}
            selectedStage={selectedStage}
            onSelectStage={setSelectedStage}
            onCopy={copyToClipboard}
          />
        </TabsContent>

        <TabsContent value="routine" className="space-y-4">
          <RoutineTab />
        </TabsContent>

        <TabsContent value="adherence" className="space-y-4">
          <AdherenceTab usageLogs={usageLogs} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
