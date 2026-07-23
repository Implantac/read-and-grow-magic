import { Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBrainDecisions } from '@/hooks/ai/useAIBrain';
import { Button } from '@/ui/base/button';
import { cn } from '@/lib/utils';

export function BrainButton() {
  const navigate = useNavigate();
  const { data: brainPendingData } = useBrainDecisions('pending');
  const brainPending = Array.isArray(brainPendingData) ? brainPendingData : [];
  const brainCritical = brainPending.filter((d) => d.impact_level === 'critical').length;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        if (e.shiftKey) navigate('/executive/brain');
        else window.dispatchEvent(new CustomEvent('brain:open'));
      }}
      onAuxClick={() => navigate('/executive/brain')}
      title={brainPending.length > 0
        ? `${brainPending.length} decisões pendentes · Ctrl+J abre o Cérebro`
        : 'Cérebro Contextual (Ctrl+J) · Shift+clique abre a página completa'}
      aria-label={brainPending.length > 0 ? `Cérebro Nativo, ${brainPending.length} decisões pendentes` : 'Cérebro Nativo'}
      className="relative h-9 w-9 rounded-lg text-sidebar-foreground/60 hover:text-primary hover:bg-sidebar-accent/50 transition-all"
    >
      <Brain className="h-[18px] w-[18px]" aria-hidden="true" />
      {brainPending.length > 0 && (
        <span
          className={cn(
            'absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold px-1 ring-2 ring-sidebar animate-fade-in',
            brainCritical > 0
              ? 'bg-destructive text-destructive-foreground animate-pulse'
              : 'bg-primary text-primary-foreground'
          )}
        >
          {brainPending.length > 9 ? '9+' : brainPending.length}
        </span>
      )}
    </Button>
  );
}
