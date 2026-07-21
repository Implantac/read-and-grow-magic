import { ShoppingCart } from 'lucide-react';
import { PDVDialog } from '@/components/fiscal/PDVDialog';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { OfflinePDVIndicator } from '@/components/pdv/OfflinePDVIndicator';
import { useNFCe } from '@/hooks/fiscal/useNFCe';
import { useOfflinePDV } from '@/hooks/pdv/useOfflinePDV';
import { toast } from 'sonner';

/**
 * Painel Único (PDV) — /comercial/pdv
 * Emissão online via useNFCe. Se offline, enfileira localmente (Dinheiro/PIX apenas)
 * e sincroniza automaticamente ao reconectar.
 */
export default function SalesDeskPage() {
  const { emit } = useNFCe();
  const { online, emitOffline } = useOfflinePDV();

  return (
    <PageContainer>
      <PageHeader
        title="Painel Único (PDV)"
        description="Terminal de vendas do varejo — cliente, itens, pagamento e fechamento em uma única tela"
        icon={ShoppingCart}
      >
        <OfflinePDVIndicator />
      </PageHeader>
      <PDVDialog
        asPage
        open
        onOpenChange={() => {
          /* PDV é a própria página — não fecha */
        }}
        onEmit={async (data) => {
          if (!online) {
            const method = data.paymentMethod as 'cash' | 'pix';
            if (method !== 'cash' && method !== 'pix') {
              toast.error('Sem conexão: use Dinheiro ou PIX no modo offline.');
              return { ok: false };
            }
            const queued = emitOffline({ ...data, paymentMethod: method });
            return queued ? { ok: true, offline: true } : { ok: false };
          }

          const result = await emit(data);
          if (!result) return { ok: false };
          toast.success('Venda registrada', { description: 'Cupom emitido com sucesso.' });
          return { ok: true, nfce: result };
        }}
      />
    </PageContainer>
  );
}
