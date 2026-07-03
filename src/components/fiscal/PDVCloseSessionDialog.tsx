import { useMemo, useState } from 'react';
import { Printer, Lock, X } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Separator } from '@/ui/base/separator';
import { formatBRL } from '@/lib/formatters';
import { toSafeNumber } from '@/lib/numericValidation';
import { cn } from '@/lib/utils';

export interface CashCloseSummary {
  operatorName: string;
  terminalId: string;
  openedAt: string;
  openingAmount: number;
  totalSales: number;
  salesCount: number;
  sangria: number;
  suprimento: number;
  expectedCash: number;
}

interface Props {
  open: boolean;
  summary: CashCloseSummary | null;
  onClose: (result: { countedAmount: number; difference: number }) => void;
  onCancel: () => void;
}

export function PDVCloseSessionDialog({ open, summary, onClose, onCancel }: Props) {
  const [counted, setCounted] = useState<number>(0);
  const [revealed, setRevealed] = useState(false);

  const difference = useMemo(() => {
    if (!summary) return 0;
    return Math.round((counted - summary.expectedCash) * 100) / 100;
  }, [counted, summary]);

  if (!open || !summary) return null;

  const printReport = () => {
    const win = window.open('', '_blank', 'width=420,height=720');
    if (!win) return;
    const rows: [string, string][] = [
      ['Terminal', summary.terminalId],
      ['Operador', summary.operatorName],
      ['Aberto em', new Date(summary.openedAt).toLocaleString('pt-BR')],
      ['Fechado em', new Date().toLocaleString('pt-BR')],
      ['Abertura', formatBRL(summary.openingAmount)],
      ['Vendas em dinheiro', formatBRL(summary.totalSales)],
      ['Nº de vendas', String(summary.salesCount)],
      ['Suprimento', formatBRL(summary.suprimento)],
      ['Sangria', `− ${formatBRL(summary.sangria)}`],
      ['Esperado no caixa', formatBRL(summary.expectedCash)],
      ['Contado', formatBRL(counted)],
      ['Diferença', `${difference >= 0 ? '+' : ''}${formatBRL(difference)}`],
    ];
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>Fechamento de Caixa</title>
      <style>body{font-family:ui-monospace,monospace;font-size:11px;padding:20px}
      h1{font-size:14px;text-align:center;letter-spacing:2px;margin:0 0 6px}
      hr{border:none;border-top:1px dashed #999;margin:8px 0}
      .kv{display:flex;justify-content:space-between;margin:3px 0}
      .diff{font-size:16px;font-weight:900;color:${difference === 0 ? '#059669' : '#dc2626'}}
      button{margin-top:14px;padding:10px 14px;font-weight:700}</style></head><body>
      <h1>REDUÇÃO Z — FECHAMENTO</h1><hr/>
      ${rows.map(([k, v]) => `<div class="kv"><span>${k}</span><span>${v}</span></div>`).join('')}
      <hr/><div class="diff" style="text-align:center">
        ${difference === 0 ? '✓ SEM DIVERGÊNCIA' : (difference > 0 ? `SOBRA: ${formatBRL(difference)}` : `FALTA: ${formatBRL(Math.abs(difference))}`)}
      </div>
      <button onclick="window.print()">Imprimir</button>
      <script>window.onload=()=>setTimeout(()=>window.print(),200)</script>
      </body></html>`);
    win.document.close();
  };

  const finish = () => {
    onClose({ countedAmount: counted, difference });
    setCounted(0);
    setRevealed(false);
  };

  return (
    <div className="absolute inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center animate-in fade-in" onClick={onCancel}>
      <div className="bg-background border-2 rounded-2xl p-6 w-[520px] max-h-[92vh] overflow-y-auto shadow-2xl space-y-4 relative" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-3 right-3 text-muted-foreground hover:text-foreground" onClick={onCancel} aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-lg"><Lock className="h-5 w-5" /></div>
          <div>
            <h3 className="font-black text-lg">Fechamento de caixa (cego)</h3>
            <p className="text-xs text-muted-foreground">Conte o dinheiro fisicamente antes de comparar com o sistema.</p>
          </div>
        </div>

        <div className="rounded-xl bg-muted/30 border p-4 grid grid-cols-2 gap-3 text-sm">
          <div><div className="text-[10px] uppercase font-bold text-muted-foreground">Vendas do turno</div><div className="font-black tabular-nums">{formatBRL(summary.totalSales)}</div></div>
          <div><div className="text-[10px] uppercase font-bold text-muted-foreground">Nº transações</div><div className="font-black tabular-nums">{summary.salesCount}</div></div>
          <div><div className="text-[10px] uppercase font-bold text-muted-foreground">Ticket médio</div><div className="font-black tabular-nums">{formatBRL(summary.salesCount ? summary.totalSales / summary.salesCount : 0)}</div></div>
          <div><div className="text-[10px] uppercase font-bold text-muted-foreground">Abertura</div><div className="font-black tabular-nums">{formatBRL(summary.openingAmount)}</div></div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase font-bold text-muted-foreground">Valor contado no caixa</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">R$</span>
            <Input
              type="number" step="0.01" min={0} value={counted || ''}
              onChange={(e) => setCounted(toSafeNumber(e.target.value))}
              onFocus={(e) => e.currentTarget.select()}
              className="pl-10 h-14 text-2xl font-black tabular-nums" autoFocus
              placeholder="0,00"
            />
          </div>
          <p className="text-[10px] text-muted-foreground">Fechamento cego: o esperado só aparece depois que você confirmar a contagem.</p>
        </div>

        {!revealed ? (
          <Button
            className="w-full h-12 font-black uppercase tracking-widest"
            disabled={counted <= 0}
            onClick={() => setRevealed(true)}
          >
            Comparar com o sistema
          </Button>
        ) : (
          <div className="space-y-3 animate-in slide-in-from-bottom-2">
            <div className="rounded-xl border-2 p-4 space-y-2 bg-muted/20">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Esperado (sistema)</span><span className="font-bold tabular-nums">{formatBRL(summary.expectedCash)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Contado</span><span className="font-bold tabular-nums">{formatBRL(counted)}</span></div>
              <Separator />
              <div className={cn(
                'flex justify-between items-center rounded-lg p-3 -mx-1',
                Math.abs(difference) < 0.005
                  ? 'bg-emerald-500/10 text-emerald-700'
                  : difference > 0 ? 'bg-amber-500/10 text-amber-700' : 'bg-red-500/10 text-red-700',
              )}>
                <span className="text-xs font-black uppercase tracking-widest">
                  {Math.abs(difference) < 0.005 ? 'Sem divergência' : difference > 0 ? 'Sobra' : 'Falta'}
                </span>
                <span className="text-2xl font-black tabular-nums">
                  {difference >= 0 ? '+' : ''}{formatBRL(difference)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={printReport} className="gap-2 h-11">
                <Printer className="h-4 w-4" /> Imprimir Z
              </Button>
              <Button onClick={finish} className="h-11 font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white">
                Confirmar fechamento
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
