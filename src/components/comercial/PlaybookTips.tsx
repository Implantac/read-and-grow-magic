import { useState } from 'react';
import { usePlaybooks, useObjections, useLogPlaybookUsage, type Playbook, type Objection } from '@/hooks/usePlaybook';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Copy, MessageSquare, Target, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toastSuccess } from '@/lib/toastHelpers';

interface PlaybookTipsProps {
  stage: string;
  compact?: boolean;
}

export function PlaybookTips({ stage, compact = false }: PlaybookTipsProps) {
  const { data: playbooks = [] } = usePlaybooks(stage);
  const { data: objections = [] } = useObjections(stage);
  const logUsage = useLogPlaybookUsage();
  const { toast } = useToast();

  const pb = playbooks[0];
  if (!pb) return null;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toastSuccess('Copiado!');
    logUsage.mutate({ playbook_id: pb.id, action_type: 'copy_script', context: text.slice(0, 50) });
  };

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <BookOpen className="h-3 w-3 text-primary" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <ScrollArea className="max-h-[350px]">
            <div className="p-3 space-y-3">
              <p className="text-xs font-semibold flex items-center gap-1"><BookOpen className="h-3 w-3" /> Playbook: {pb.title}</p>
              
              {pb.scripts.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">SCRIPTS</p>
                  {pb.scripts.slice(0, 2).map((s, i) => (
                    <div key={i} className="bg-muted/50 rounded p-2 text-[11px] mb-1 group relative cursor-pointer" onClick={() => copy(s)}>
                      <p className="italic pr-5">"{s.slice(0, 120)}{s.length > 120 ? '...' : ''}"</p>
                      <Copy className="h-3 w-3 absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}

              {pb.actions.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">AÇÕES</p>
                  {pb.actions.slice(0, 3).map((a, i) => (
                    <p key={i} className="text-[11px] flex items-start gap-1"><span className="text-emerald-500">•</span>{a}</p>
                  ))}
                </div>
              )}

              {pb.next_steps.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">PRÓXIMOS PASSOS</p>
                  {pb.next_steps.slice(0, 2).map((n, i) => (
                    <p key={i} className="text-[11px] flex items-start gap-1"><span className="text-blue-500">→</span>{n}</p>
                  ))}
                </div>
              )}

              {pb.tips && (
                <div className="bg-amber-500/10 rounded p-2">
                  <p className="text-[10px]">💡 {pb.tips}</p>
                </div>
              )}

              {objections.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">OBJEÇÕES COMUNS</p>
                  {objections.slice(0, 2).map(obj => (
                    <div key={obj.id} className="border rounded p-2 mb-1">
                      <p className="text-[10px] text-destructive font-medium">"{obj.objection}"</p>
                      <p className="text-[10px] text-emerald-600 mt-0.5">→ {obj.response.slice(0, 100)}...</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="border rounded-lg p-3 bg-primary/5 space-y-2">
      <p className="text-xs font-semibold flex items-center gap-1"><BookOpen className="h-3.5 w-3.5 text-primary" /> {pb.title}</p>
      {pb.scripts[0] && (
        <div className="bg-background rounded p-2 text-xs group relative cursor-pointer" onClick={() => copy(pb.scripts[0])}>
          <p className="italic pr-6">"{pb.scripts[0]}"</p>
          <Copy className="h-3 w-3 absolute top-2 right-2 opacity-0 group-hover:opacity-100" />
        </div>
      )}
      {pb.tips && <p className="text-[11px] text-amber-600">💡 {pb.tips}</p>}
    </div>
  );
}
