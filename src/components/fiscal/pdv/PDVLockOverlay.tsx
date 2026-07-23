import { Lock, Unlock } from 'lucide-react';
import { Button } from '@/ui/base/button';

export function PDVLockOverlay({ onUnlock }: { onUnlock: () => void }) {
  return (
    <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center gap-6">
      <Lock className="h-16 w-16 text-primary" />
      <div className="text-center">
        <p className="text-2xl font-black uppercase tracking-widest">PDV Bloqueado</p>
        <p className="text-sm text-muted-foreground mt-2">Aguardando reautenticação do operador</p>
      </div>
      <Button size="lg" onClick={onUnlock} className="gap-2">
        <Unlock className="h-4 w-4" /> Desbloquear
      </Button>
    </div>
  );
}

export function PDVShortcutsHint() {
  return (
    <div className="mt-3 flex items-center justify-center gap-3 text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex-wrap">
      <span>F1 Dinh</span><span>F2 Créd</span><span>F3 Déb</span><span>F4 PIX</span><span>F5 Voucher</span><span>F6 Fiado</span>
      <span className="opacity-40">|</span>
      <span>F7 Suspender</span><span>F8 Retomar</span><span>F9 Limpar</span><span>F10 Finalizar</span><span>Ctrl+L Bloq</span>
    </div>
  );
}
