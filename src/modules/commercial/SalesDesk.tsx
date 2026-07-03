import { ShoppingCart } from 'lucide-react';
import { PDVDialog } from '@/components/fiscal/PDVDialog';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { toast } from 'sonner';

/**
 * Painel Único (PDV) — /comercial/pdv
 *
 * Único PDV do sistema. Renderiza o PDV Varejo como conteúdo de página
 * (não como modal), seguindo o padrão das demais telas do ERP.
 */
export default function SalesDeskPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Painel Único (PDV)"
        description="Terminal de vendas do varejo — cliente, itens, pagamento e fechamento em uma única tela"
        icon={ShoppingCart}
      />
      <PDVDialog
        asPage
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
    </PageContainer>
  );
}
