import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Input } from '@/ui/base/input';
import { useWhatsAppTemplates } from '@/hooks/commercial/useFollowUpTasks';
import { MessageSquare, Send, Loader2 } from 'lucide-react';

const categoryLabels: Record<string, string> = {
  follow_up: '📋 Follow-up', proposal: '💼 Proposta', reactivation: '♻️ Reativação',
  reminder: '⏰ Lembrete', onboarding: '👋 Boas-vindas', satisfaction: '⭐ Satisfação', general: '📝 Geral'
};

export function WhatsAppTab() {
  const { data: templates = [], isLoading } = useWhatsAppTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});

  const buildMessage = () => {
    if (!selectedTemplate) return '';
    let msg = selectedTemplate.body;
    (selectedTemplate.variables || []).forEach((v: string) => {
      msg = msg.replace(`{{${v}}}`, variables[v] || `[${v}]`);
    });
    return msg;
  };

  const sendWhatsApp = () => {
    const msg = encodeURIComponent(buildMessage());
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${fullPhone}?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Templates de Mensagem</CardTitle>
          <CardDescription>Selecione um template para enviar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> :
            templates.map((t: any) => (
              <div key={t.id} onClick={() => { setSelectedTemplate(t); setVariables({}); }}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedTemplate?.id === t.id ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{t.name}</span>
                  <Badge variant="outline" className="text-xs">{categoryLabels[t.category] || t.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.body}</p>
              </div>
            ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4" />Compor Mensagem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Telefone (com DDD)" value={phone} onChange={e => setPhone(e.target.value)} />
          {selectedTemplate && (selectedTemplate.variables || []).map((v: string) => (
            <Input key={v} placeholder={v} value={variables[v] || ''} onChange={e => setVariables(p => ({ ...p, [v]: e.target.value }))} />
          ))}
          <div className="p-3 rounded-lg bg-muted/50 min-h-[100px]">
            <p className="text-sm whitespace-pre-wrap">{selectedTemplate ? buildMessage() : 'Selecione um template...'}</p>
          </div>
          <Button className="w-full" onClick={sendWhatsApp} disabled={!selectedTemplate || !phone}>
            <Send className="h-4 w-4 mr-2" />Enviar via WhatsApp
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
