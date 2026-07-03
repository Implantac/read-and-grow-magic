import { PDVDialog } from '@/components/fiscal/PDVDialog';
import { toast } from 'sonner';

/**
 * Painel Único (PDV) — /comercial/pdv
 *
 * Único PDV do sistema. Renderiza o PDV Varejo em tela cheia (grid de
 * categorias, busca/leitor/câmera, carrinho, split de pagamento, PIX QR,
 * fiado, suspender/retomar cupom, fechamento cego, atalhos F1–F12).
 *
 * O antigo fluxo B2B/O2C foi removido daqui — para pedidos B2B use
 * Comercial → Pedidos.
 */
export default function SalesDeskPage() {
  return (
    <PDVDialog
      open
      onOpenChange={() => {
        /* PDV é a própria página — não fecha */
      }}
      onEmit={async (): Promise<any> => {
        toast.success('Venda registrada', {
          description: 'Cupom emitido com sucesso.',
        });
        return { ok: true };
      }}
    />
  );
}
