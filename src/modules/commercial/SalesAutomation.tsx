import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import DecisionEngineTab from '@/components/commercial/DecisionEngineTab';
import { FollowUpTab } from './sales-automation/FollowUpTab';
import { WhatsAppTab } from './sales-automation/WhatsAppTab';
import { AIMessagesTab } from './sales-automation/AIMessagesTab';
import { NurturingTab } from './sales-automation/NurturingTab';
import { AlertsTab } from './sales-automation/AlertsTab';

export default function SalesAutomation() {
  const [activeTab, setActiveTab] = useState('engine');

  return (
    <PageContainer>
      <PageHeader
        title="🤖 Automação Comercial"
        description="Follow-ups automáticos, WhatsApp, IA de mensagens e nutrição de leads"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full max-w-4xl mb-6">
          <TabsTrigger value="engine" className="text-xs">🧠 Motor</TabsTrigger>
          <TabsTrigger value="followups" className="text-xs">📋 Follow-ups</TabsTrigger>
          <TabsTrigger value="whatsapp" className="text-xs">💬 WhatsApp</TabsTrigger>
          <TabsTrigger value="ai-messages" className="text-xs">🤖 IA</TabsTrigger>
          <TabsTrigger value="nurturing" className="text-xs">🌱 Nutrição</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs">🔔 Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="engine"><DecisionEngineTab /></TabsContent>
        <TabsContent value="followups"><FollowUpTab /></TabsContent>
        <TabsContent value="whatsapp"><WhatsAppTab /></TabsContent>
        <TabsContent value="ai-messages"><AIMessagesTab /></TabsContent>
        <TabsContent value="nurturing"><NurturingTab /></TabsContent>
        <TabsContent value="alerts"><AlertsTab /></TabsContent>
      </Tabs>
    </PageContainer>
  );
}
