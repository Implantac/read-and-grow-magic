import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { useNurturingSequences } from '@/hooks/commercial/useFollowUpTasks';
import { Loader2, Users } from 'lucide-react';

const triggerLabels: Record<string, string> = {
  manual: 'Manual', new_lead: 'Novo Lead', inactive: 'Cliente Inativo',
  post_purchase: 'Pós-Compra', proposal_sent: 'Proposta Enviada'
};

export function NurturingTab() {
  const { data: sequences = [], isLoading } = useNurturingSequences();

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold">{sequences.length}</div>
          <div className="text-xs text-muted-foreground">Sequências</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold">{sequences.filter((s: any) => s.is_active).length}</div>
          <div className="text-xs text-muted-foreground">Ativas</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold">{sequences.reduce((a: number, s: any) => a + (s.total_enrolled || 0), 0)}</div>
          <div className="text-xs text-muted-foreground">Leads em Nutrição</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sequências de Nutrição</CardTitle>
          <CardDescription>Fluxos automáticos de acompanhamento de leads</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> :
            sequences.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma sequência criada ainda</p>
                <p className="text-xs">Use a IA Comercial para gerar sequências automaticamente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sequences.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <div className="font-medium text-sm">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.description}</div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{triggerLabels[s.trigger_event] || s.trigger_event}</Badge>
                        <Badge variant={s.is_active ? 'default' : 'secondary'} className="text-xs">{s.is_active ? 'Ativa' : 'Inativa'}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{s.total_enrolled || 0}</div>
                      <div className="text-xs text-muted-foreground">inscritos</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
