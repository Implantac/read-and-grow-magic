import { useMemo, useState } from 'react';
import { Copy, QrCode, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { formatBRL } from '@/lib/formatters';
import { toastSuccess } from '@/lib/toastHelpers';

interface Props {
  open: boolean;
  amount: number;
  companyName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Simple deterministic pseudo-random QR grid (placeholder — real PIX QR would come from PSP)
function buildMatrix(payload: string, size = 29): boolean[][] {
  const m: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  let seed = 0;
  for (let i = 0; i < payload.length; i++) seed = (seed * 131 + payload.charCodeAt(i)) >>> 0;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xffffffff; };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) m[y][x] = rand() > 0.55;
  // Finder patterns (3 corners) — visual hint that it's a QR
  const stamp = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      const border = x === 0 || y === 0 || x === 6 || y === 6;
      const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
      m[oy + y][ox + x] = border || inner;
    }
    for (let y = -1; y <= 7; y++) if (oy + y >= 0 && oy + y < size) {
      if (ox - 1 >= 0) m[oy + y]?.[ox - 1] !== undefined && (m[oy + y][ox - 1] = false);
      if (ox + 7 < size) m[oy + y][ox + 7] = false;
    }
    for (let x = -1; x <= 7; x++) if (ox + x >= 0 && ox + x < size) {
      if (oy - 1 >= 0) m[oy - 1][ox + x] = false;
      if (oy + 7 < size) m[oy + 7][ox + x] = false;
    }
  };
  stamp(0, 0); stamp(size - 7, 0); stamp(0, size - 7);
  return m;
}

export function PDVPixDialog({ open, amount, companyName, onConfirm, onCancel }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const payload = useMemo(
    () => `PIX|${companyName || 'LOJA'}|${amount.toFixed(2)}|${Date.now()}`,
    [amount, companyName],
  );
  const matrix = useMemo(() => buildMatrix(payload, 29), [payload]);

  if (!open) return null;

  const copy = async () => {
    try { await navigator.clipboard.writeText(payload); toastSuccess('Copia-e-cola PIX copiado'); }
    catch { /* noop */ }
  };

  const confirm = () => {
    setConfirmed(true);
    window.setTimeout(() => { onConfirm(); setConfirmed(false); }, 900);
  };

  return (
    <div className="absolute inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center animate-in fade-in" onClick={onCancel}>
      <div className="bg-background border-2 rounded-2xl p-6 w-[440px] shadow-2xl space-y-4 relative" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-3 right-3 text-muted-foreground hover:text-foreground" onClick={onCancel} aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-600 rounded-lg"><QrCode className="h-5 w-5" /></div>
          <div>
            <h3 className="font-black text-lg">Pagamento via PIX</h3>
            <p className="text-xs text-muted-foreground">O cliente escaneia o QR abaixo pelo app do banco.</p>
          </div>
        </div>

        <div className="bg-cyan-500/5 border-2 border-cyan-500/20 rounded-xl p-4 text-center">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Valor a receber</div>
          <div className="text-3xl font-black text-cyan-700 tabular-nums">{formatBRL(amount)}</div>
        </div>

        {!confirmed ? (
          <>
            <div className="mx-auto bg-white p-3 rounded-lg border w-fit">
              <svg viewBox="0 0 29 29" width="240" height="240" shapeRendering="crispEdges" aria-label="QR Code PIX">
                {matrix.flatMap((row, y) => row.map((on, x) => on ? (
                  <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#111" />
                ) : null))}
              </svg>
            </div>
            <Button variant="outline" className="w-full gap-2" onClick={copy}>
              <Copy className="h-4 w-4" /> Copiar código PIX (copia-e-cola)
            </Button>
            <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest" onClick={confirm}>
              Confirmar recebimento
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 gap-3 animate-in zoom-in-95">
            <div className="rounded-full bg-emerald-500/15 p-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            </div>
            <div className="text-emerald-700 font-black text-lg">PIX confirmado!</div>
          </div>
        )}
      </div>
    </div>
  );
}
