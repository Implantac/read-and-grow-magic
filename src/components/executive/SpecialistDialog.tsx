import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { ScrollArea } from '@/ui/base/scroll-area';
import { Badge } from '@/ui/base/badge';
import { useBrainChat } from '@/hooks/ai/useAIBrain';
import { Loader2, Send, Sparkles, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SpecialistProfile {
  role: string;
  icon: LucideIcon;
  color: string;
  focus: string;
  suggestions: string[];
}

interface Props {
  specialist: SpecialistProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SpecialistDialog({ specialist, open, onOpenChange }: Props) {
  const { messages, loading, send, clear } = useBrainChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      clear();
      setInput('');
    }
  }, [open, clear]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  if (!specialist) return null;
  const Icon = specialist.icon;

  const ask = (text: string) => {
    if (!text.trim() || loading) return;
    const prompt = `[Persona: ${specialist.role} — Foco: ${specialist.focus}]\n${text.trim()}`;
    send(prompt, specialist.role);
    setInput('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={cn('p-1.5 rounded-full bg-background ring-1 ring-primary/20', specialist.color)}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            Especialista: {specialist.role}
            <Badge variant="outline" className="text-[10px]">IA</Badge>
          </DialogTitle>
          <DialogDescription>{specialist.focus}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[320px] rounded-md border bg-muted/20 p-3">
          <div ref={scrollRef} className="space-y-3" role="log" aria-live="polite">
            {messages.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-6">
                <Sparkles className="h-5 w-5 mx-auto mb-2 text-primary/60" aria-hidden="true" />
                Pergunte algo ao especialista ou escolha uma sugestão abaixo.
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={cn('text-sm', m.role === 'user' ? 'text-right' : 'text-left')}>
                <div className={cn(
                  'inline-block px-3 py-2 rounded-lg max-w-[85%] whitespace-pre-wrap',
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border'
                )}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> Consultando {specialist.role}…
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex flex-wrap gap-1.5">
          {specialist.suggestions.map((s) => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => ask(s)}
              disabled={loading}
            >
              {s}
            </Button>
          ))}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); ask(input); }}
          className="flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Pergunte ao ${specialist.role}…`}
            aria-label={`Mensagem para ${specialist.role}`}
            disabled={loading}
          />
          <Button type="submit" size="sm" disabled={loading || !input.trim()} aria-label="Enviar">
            <Send className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
