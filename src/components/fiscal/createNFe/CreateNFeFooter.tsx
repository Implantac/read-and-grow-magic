import { ArrowLeft, ChevronRight, Send } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { DialogFooter } from '@/ui/base/dialog';
import { cn } from '@/lib/utils';
import { STEPS } from './types';

interface Props {
  step: number;
  saving: boolean;
  hasBlockingErrors: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function CreateNFeFooter({ step, saving, hasBlockingErrors, onPrev, onNext, onSubmit, onClose }: Props) {
  const isLast = step === STEPS.length - 1;
  return (
    <DialogFooter className="px-8 py-4 border-t bg-muted/30 flex items-center justify-between sm:justify-between">
      <Button variant="ghost" onClick={onClose} className="px-6 h-11">Sair</Button>
      <div className="flex gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={onPrev} className="px-6 h-11 gap-2 border-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        )}
        {!isLast ? (
          <Button
            onClick={onNext}
            disabled={hasBlockingErrors}
            className={cn(
              'px-8 h-11 gap-2 shadow-lg transition-all',
              hasBlockingErrors ? 'opacity-50 grayscale cursor-not-allowed' : 'shadow-primary/20',
            )}
          >
            Avançar <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={onSubmit}
            disabled={saving || hasBlockingErrors}
            className={cn(
              'px-10 h-11 gap-2 bg-success hover:bg-success/90 shadow-lg transition-all',
              hasBlockingErrors ? 'opacity-50 grayscale cursor-not-allowed' : 'shadow-success/20',
            )}
          >
            {saving ? 'Processando...' : <><Send className="h-4 w-4" /> Gerar NF-e</>}
          </Button>
        )}
      </div>
    </DialogFooter>
  );
}
