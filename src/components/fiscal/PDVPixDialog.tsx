import { useEffect, useState } from 'react';
import { Copy, QrCode, X, Loader2 } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { formatBRL } from '@/lib/formatters';
import { toastError, toastSuccess } from '@/lib/toastHelpers';
import { supabase } from '@/integrations/supabase/client';
import type { PixCharge } from '@/hooks/financial/usePixCharges';

interface Props {
  open: boolean;
  amount: number;
  onConfirm: (chargeId: string) => void;
  onCancel: () => void;
}

export function PDVPixDialog({ open, amount, onConfirm, onCancel }: Props) {
  const [charge, setCharge] = useState<PixCharge | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setCharge(null); setError(null); return; }
    let active = true;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const { data, error: requestError } = await supabase.functions.invoke('pix-webhook?action=create', {
          body: { amount, description: 'Venda no PDV' },
        });
        if (requestError || !data?.ok || !data.charge?.id || !data.charge?.copy_paste) throw new Error('Provedor PIX indisponível');
        if (active) setCharge(data.charge as PixCharge);
      } catch {
        if (active) setError('Cobrança PIX indisponível. Selecione outra forma de pagamento.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [open, amount]);

  useEffect(() => {
    if (!open || !charge?.id || charge.status !== 'pending') return;
    let active = true;
    const check = async () => {
      const { data, error: requestError } = await supabase.from('pix_charges')
        .select('id,status,amount,expires_at').eq('id', charge.id).single();
      if (!active) return;
      if (requestError) { setError('Não foi possível consultar o pagamento.'); return; }
      if (data?.status === 'paid' && Math.abs(Number(data.amount) - amount) < 0.001) {
        onConfirm(charge.id);
      } else if (data?.status !== 'pending' || (data.expires_at && new Date(data.expires_at).getTime() < Date.now())) {
        setError('Cobrança expirada ou cancelada. Selecione outra forma de pagamento.');
      }
    };
    void check();
    const timer = window.setInterval(() => { void check(); }, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [open, charge, amount, onConfirm]);

  if (!open) return null;

  const copy = async () => {
    if (!charge?.copy_paste) return;
    try { await navigator.clipboard.writeText(charge.copy_paste); toastSuccess('Código PIX copiado'); }
    catch { toastError('Não foi possível copiar o código PIX.'); }
  };

  return (
    <div className="absolute inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Pagamento via PIX">
      <div className="bg-background border rounded-lg p-6 w-full max-w-md shadow-2xl space-y-4 relative">
        <Button variant="ghost" size="icon" className="absolute top-3 right-3" onClick={onCancel} aria-label="Fechar"><X className="h-4 w-4" /></Button>
        <div className="flex items-center gap-3"><QrCode className="h-5 w-5 text-primary" /><h3 className="font-bold text-lg">Pagamento via PIX</h3></div>
        <p className="text-2xl font-bold tabular-nums">{formatBRL(amount)}</p>
        {loading && <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Solicitando cobrança...</p>}
        {error && <p role="alert" className="text-destructive">{error}</p>}
        {charge && !error && <>
          <p className="text-sm text-muted-foreground">Aguardando confirmação do banco. A venda só poderá ser concluída após o pagamento.</p>
          <div className="break-all text-xs border rounded p-3 font-mono bg-muted">{charge.copy_paste}</div>
          <Button variant="outline" className="w-full gap-2" onClick={copy}><Copy className="h-4 w-4" /> Copiar código PIX</Button>
        </>}
        <Button variant="outline" className="w-full" onClick={onCancel}>Voltar ao pagamento</Button>
      </div>
    </div>
  );
}