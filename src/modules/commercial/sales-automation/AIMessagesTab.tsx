import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Textarea } from '@/ui/base/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { useAISalesMessage } from '@/hooks/commercial/useFollowUpTasks';
import { Bot, Loader2, Sparkles, RefreshCw } from 'lucide-react';

export function AIMessagesTab() {
  const aiMessage = useAISalesMessage();
  const [context, setContext] = useState({ clientName: '', segment: '', situation: 'follow_up', objective: '', lastPurchase: '', avgTicket: '' });
  const [result, setResult] = useState('');
  const [objection, setObjection] = useState('');
  const [objectionResult, setObjectionResult] = useState('');

  const generateMessage = () => {
    aiMessage.mutate({ action: 'suggest_message', context }, {
      onSuccess: (data) => setResult(data.result || ''),
    });
  };

  const handleObjection = () => {
    aiMessage.mutate({ action: 'suggest_objection_response', context: { objection, product: 'ERP USE SISTEMAS' } }, {
      onSuccess: (data) => setObjectionResult(data.result || ''),
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Bot className="h-4 w-4" />Gerar Mensagem com IA</CardTitle>
          <CardDescription>A IA cria mensagens personalizadas por contexto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Nome do cliente" value={context.clientName} onChange={e => setContext(p => ({ ...p, clientName: e.target.value }))} />
          <Input placeholder="Segmento" value={context.segment} onChange={e => setContext(p => ({ ...p, segment: e.target.value }))} />
          <Select value={context.situation} onValueChange={v => setContext(p => ({ ...p, situation: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="follow_up">Follow-up</SelectItem>
              <SelectItem value="reactivation">Reativação</SelectItem>
              <SelectItem value="proposal">Proposta</SelectItem>
              <SelectItem value="closing">Fechamento</SelectItem>
              <SelectItem value="onboarding">Boas-vindas</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Objetivo específico" value={context.objective} onChange={e => setContext(p => ({ ...p, objective: e.target.value }))} />
          <Button className="w-full" onClick={generateMessage} disabled={!context.clientName || aiMessage.isPending}>
            {aiMessage.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Gerar Mensagem
          </Button>
          {result && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm whitespace-pre-wrap">{result}</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => navigator.clipboard.writeText(result)}>Copiar</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><RefreshCw className="h-4 w-4" />Respostas para Objeções</CardTitle>
          <CardDescription>Cole a objeção do cliente e receba a resposta ideal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea placeholder="Ex: 'Está muito caro', 'Vou pensar', 'Preciso consultar meu sócio'..." value={objection} onChange={e => setObjection(e.target.value)} rows={3} />
          <Button className="w-full" onClick={handleObjection} disabled={!objection || aiMessage.isPending}>
            {aiMessage.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bot className="h-4 w-4 mr-2" />}
            Sugerir Resposta
          </Button>
          {objectionResult && (
            <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
              <p className="text-sm whitespace-pre-wrap">{objectionResult}</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => navigator.clipboard.writeText(objectionResult)}>Copiar</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
