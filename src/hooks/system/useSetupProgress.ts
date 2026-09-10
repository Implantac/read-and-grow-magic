import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnterprise } from '@/core/auth/EnterpriseContext';

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  done: boolean;
  actionLabel: string;
  href: string;
}

async function countRows(table: string, companyId: string): Promise<number> {
  const { count, error } = await (supabase as any)
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId);
  if (error) return 0;
  return Number(count || 0);
}

/**
 * Progresso real da primeira configuração — contagens vindas do banco,
 * sem valores fictícios. Some da tela quando tudo está concluído.
 */
export function useSetupProgress() {
  const { currentCompany } = useEnterprise();
  const companyId = currentCompany?.id;

  const query = useQuery({
    queryKey: ['setup-progress', companyId],
    enabled: Boolean(companyId),
    staleTime: 60_000,
    queryFn: async (): Promise<SetupStep[]> => {
      const [branches, products, balances, partners, transfers] = await Promise.all([
        countRows('branches', companyId!),
        countRows('products', companyId!),
        countRows('stock_balances', companyId!),
        countRows('customers', companyId!),
        countRows('stock_transfer_orders', companyId!),
      ]);

      return [
        {
          id: 'branches',
          title: 'Cadastrar lojas, centro de distribuição e fábrica',
          description: 'Cada unidade que guarda ou vende mercadoria precisa existir no sistema.',
          done: branches > 0,
          actionLabel: 'Cadastrar unidades',
          href: '/gestao/filiais',
        },
        {
          id: 'products',
          title: 'Cadastrar produtos',
          description: 'Sem produtos não há estoque, venda nem reposição.',
          done: products > 0,
          actionLabel: 'Cadastrar produtos',
          href: '/estoque/produtos',
        },
        {
          id: 'balances',
          title: 'Informar o estoque inicial',
          description: 'Registre o que já existe em cada unidade para o sistema calcular a reposição.',
          done: balances > 0,
          actionLabel: 'Consultar estoque',
          href: '/estoque/saldos',
        },
        {
          id: 'partners',
          title: 'Cadastrar clientes',
          description: 'Necessário para faturar vendas e acompanhar o recebimento.',
          done: partners > 0,
          actionLabel: 'Cadastrar clientes',
          href: '/comercial/clientes',
        },
        {
          id: 'transfers',
          title: 'Fazer o primeiro envio entre unidades',
          description: 'Testa o caminho completo: enviar, acompanhar e receber a mercadoria.',
          done: transfers > 0,
          actionLabel: 'Transferir mercadoria',
          href: '/operacional/rede/transferencias',
        },
      ];
    },
  });

  const steps = query.data || [];
  const completed = steps.filter((s) => s.done).length;

  return {
    steps,
    completed,
    total: steps.length,
    isComplete: steps.length > 0 && completed === steps.length,
    isLoading: query.isLoading,
    hasCompany: Boolean(companyId),
  };
}
