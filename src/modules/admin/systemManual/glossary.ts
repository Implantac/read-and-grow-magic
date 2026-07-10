// Glossário global do ERP — termos técnicos, fiscais e operacionais traduzidos
// para linguagem de negócio. Usado na página índice do Manual do Sistema.

export interface GlossaryTerm {
  term: string;
  acronym?: string;
  category: 'Fiscal' | 'Financeiro' | 'Operacional' | 'Comercial' | 'Sistema' | 'Produção';
  definition: string;
  example?: string;
}

export const GLOBAL_GLOSSARY: GlossaryTerm[] = [
  // Fiscal
  { term: 'Nota Fiscal Eletrônica', acronym: 'NF-e', category: 'Fiscal',
    definition: 'Documento digital que comprova uma venda entre empresas (B2B). Substitui a nota em papel e é autorizada pela SEFAZ antes da mercadoria sair.',
    example: 'Venda de 100 caixas de produto para um distribuidor gera uma NF-e modelo 55.' },
  { term: 'Nota Fiscal ao Consumidor', acronym: 'NFC-e', category: 'Fiscal',
    definition: 'Versão eletrônica do cupom fiscal — usada em vendas para consumidor final no PDV.',
    example: 'Cliente comprou no balcão: emitimos NFC-e modelo 65.' },
  { term: 'Conhecimento de Transporte Eletrônico', acronym: 'CT-e', category: 'Fiscal',
    definition: 'Documento fiscal do transportador. Comprova o serviço de frete e vincula-se à NF-e da mercadoria.' },
  { term: 'CFOP', category: 'Fiscal',
    definition: 'Código de Fiscal de Operações e Prestações. Diz o QUE aconteceu na nota: venda dentro do estado, transferência, devolução, etc.',
    example: '5102 = venda de mercadoria dentro do estado.' },
  { term: 'CST/CSOSN', category: 'Fiscal',
    definition: 'Código de Situação Tributária — informa COMO os impostos incidem (tributado, isento, ST, imune). CSOSN é a variação para Simples Nacional.' },
  { term: 'Substituição Tributária', acronym: 'ICMS-ST', category: 'Fiscal',
    definition: 'Regime em que UM contribuinte da cadeia recolhe o ICMS de TODOS os próximos. Fabricante paga o ICMS que seria do distribuidor e do varejo.' },
  { term: 'DIFAL', category: 'Fiscal',
    definition: 'Diferencial de Alíquota. Cobrado quando você vende para outro estado — reparte o ICMS entre origem e destino.' },
  { term: 'SPED', category: 'Fiscal',
    definition: 'Sistema Público de Escrituração Digital. Arquivos TXT enviados mensalmente ao fisco com todo o movimento fiscal/contábil.' },
  { term: 'REINF', category: 'Fiscal',
    definition: 'Escrituração de Retenções e Outras Informações Fiscais. Declara retenções de INSS, IR, PIS/COFINS na fonte.' },
  { term: 'DANFE', category: 'Fiscal',
    definition: 'Documento Auxiliar da NF-e — o PDF impresso que acompanha a mercadoria. É representação da NF-e, não o documento fiscal em si.' },

  // Financeiro
  { term: 'Contas a Pagar', acronym: 'AP', category: 'Financeiro',
    definition: 'Obrigações da empresa com fornecedores — o que precisamos pagar.' },
  { term: 'Contas a Receber', acronym: 'AR', category: 'Financeiro',
    definition: 'Direitos da empresa sobre clientes — o que temos a receber.' },
  { term: 'DRE', category: 'Financeiro',
    definition: 'Demonstração do Resultado do Exercício. Mostra se a empresa teve lucro ou prejuízo no período. Receita − Custos − Despesas = Resultado.' },
  { term: 'Fluxo de Caixa', category: 'Financeiro',
    definition: 'Previsão de entradas e saídas ao longo do tempo. Diferente do DRE: aqui só entra o que MOVE dinheiro (não o competência).' },
  { term: 'Conciliação Bancária', category: 'Financeiro',
    definition: 'Comparar o extrato do banco com o razão interno para achar divergências. Deve fechar 100% todo dia.' },
  { term: 'PIX', category: 'Financeiro',
    definition: 'Sistema de pagamento instantâneo do BC. No ERP, cobranças PIX são geradas com QRCode e baixadas via webhook automaticamente.' },
  { term: 'Boleto', category: 'Financeiro',
    definition: 'Instrumento de cobrança bancário. No ERP, integra com o banco para gerar, cancelar e registrar baixa.' },

  // Operacional / WMS
  { term: 'Warehouse Management System', acronym: 'WMS', category: 'Operacional',
    definition: 'Sistema que controla o armazém: onde cada item está, quem separa, para onde vai.' },
  { term: 'Kardex', category: 'Operacional',
    definition: 'Histórico linha-a-linha de todas as movimentações de um item — entradas, saídas, ajustes, transferências.' },
  { term: 'Picking', category: 'Operacional',
    definition: 'Ato de separar os itens do pedido no armazém. Pode ser por onda, por pedido ou por zona.' },
  { term: 'Putaway', category: 'Operacional',
    definition: 'Endereçamento — colocar o que chegou no lugar certo do armazém.' },
  { term: 'Onda de separação', category: 'Operacional',
    definition: 'Agrupamento de vários pedidos separados juntos para otimizar caminhada no armazém.' },
  { term: 'Curva ABC', category: 'Operacional',
    definition: 'Classificação de itens por importância: A = 20% que dá 80% do valor, C = itens de baixo giro.' },
  { term: 'FEFO/FIFO', category: 'Operacional',
    definition: 'Ordem de saída de estoque. FIFO = primeiro que entra sai primeiro. FEFO = primeiro que vence sai primeiro (obrigatório para perecíveis).' },

  // Comercial
  { term: 'Pipeline', category: 'Comercial',
    definition: 'Funil de vendas: leads → oportunidades → propostas → fechamento. Cada estágio tem uma probabilidade de conversão.' },
  { term: 'NPS', category: 'Comercial',
    definition: 'Net Promoter Score. Métrica de lealdade: "de 0 a 10, você recomendaria?" Promotores (9-10) − Detratores (0-6).' },
  { term: 'CRM', category: 'Comercial',
    definition: 'Customer Relationship Management. Onde ficam clientes, contatos, histórico de interações e oportunidades.' },
  { term: 'Comissão', category: 'Comercial',
    definition: 'Remuneração variável do vendedor. Só é liberada quando o pedido é faturado E pago — regra anti-golpe padrão.' },

  // Produção
  { term: 'OEE', category: 'Produção',
    definition: 'Overall Equipment Effectiveness. Eficiência real do equipamento: Disponibilidade × Performance × Qualidade. Meta ≥ 85%.' },
  { term: 'BOM', category: 'Produção',
    definition: 'Bill of Materials — a "receita" do produto. Lista quais insumos e quanto de cada é preciso para fabricar 1 unidade.' },
  { term: 'MRP', category: 'Produção',
    definition: 'Material Requirements Planning. Calcula o que comprar e quando produzir, partindo da demanda e do estoque atual.' },
  { term: 'Ordem de Produção', acronym: 'OP', category: 'Produção',
    definition: 'Documento que autoriza a fábrica a produzir X unidades de um item específico, em determinada data.' },
  { term: 'Apontamento', category: 'Produção',
    definition: 'Registro de que uma etapa foi realizada: quem operou, quanto tempo, quantidade boa vs. refugo.' },

  // Sistema
  { term: 'Multi-tenant', category: 'Sistema',
    definition: 'Uma instalação do sistema serve várias empresas, isoladas por RLS (Row Level Security). Nenhuma empresa vê dados da outra.' },
  { term: 'RLS', category: 'Sistema',
    definition: 'Row Level Security do PostgreSQL — filtra automaticamente linhas por company_id. É a defesa principal do multi-tenant.' },
  { term: 'Filial (Branch)', category: 'Sistema',
    definition: 'Unidade operacional dentro da empresa. Pedidos, estoque e financeiro podem ser separados por filial.' },
  { term: 'RBAC', category: 'Sistema',
    definition: 'Role-Based Access Control. Cada usuário tem um papel (admin, manager, operator, viewer) que define o que pode fazer.' },
  { term: 'Auditoria', category: 'Sistema',
    definition: 'Registro imutável de quem fez o quê e quando. Não se apaga — obrigatório para conformidade fiscal e LGPD.' },
];

export const GENERAL_FAQ = [
  {
    q: 'Comecei do zero. Por onde eu começo mesmo?',
    a: 'Suba na ordem: (1) Cadastre a empresa e filial em Administração; (2) crie usuários e papéis; (3) cadastre produtos, clientes e fornecedores; (4) configure regras fiscais; (5) SÓ ENTÃO comece a lançar pedidos. Pular para "emitir NF-e" antes de cadastros mestres = 90% dos problemas na implantação.',
  },
  {
    q: 'O sistema apagou meu dado?',
    a: 'Quase nunca. O ERP usa "soft delete" — o registro fica marcado como excluído mas continua no banco para auditoria. Se algo sumiu da tela, verifique filtros (data, status, filial) antes de assumir perda.',
  },
  {
    q: 'Emitir NF-e falhou. E agora?',
    a: 'Abra Fiscal → NF-e → veja o código de rejeição da SEFAZ. Erros comuns: (1) certificado A1 vencido; (2) CNPJ do destinatário inválido; (3) CFOP incompatível com CST; (4) SEFAZ da UF fora do ar (veja o painel de status). Corrija e retransmita — não recadastre a nota.',
  },
  {
    q: 'Quem pode ver o quê?',
    a: 'Depende do papel (RBAC) + filial (branch). Admin vê tudo da empresa; Manager vê da sua filial; Operator só executa; Viewer só lê. Regras fiscais e financeiras críticas exigem admin.',
  },
  {
    q: 'Comissão do vendedor não apareceu.',
    a: 'Comissão só é liberada quando o pedido tem status "Faturado + Recebido". Se o cliente ainda não pagou, a comissão fica em "provisionada". É proposital: evita pagar comissão de venda que depois é cancelada ou não paga.',
  },
  {
    q: 'Estoque negativo — pode?',
    a: 'Não deve. O sistema bloqueia por padrão. Se aparecer negativo, é sinal de: (1) saída sem entrada correspondente; (2) inventário desatualizado; (3) reserva não baixada. Rode uma contagem cíclica na SKU afetada.',
  },
  {
    q: 'A IA Executiva pode tomar decisões sozinha?',
    a: 'Só quando você autoriza via "modo autopilot" e apenas em ações reversíveis pré-aprovadas (ex: enviar cobrança, ajustar preço dentro de faixa). Ações irreversíveis (cancelar NF-e, dar desconto acima do teto) sempre pedem confirmação humana.',
  },
  {
    q: 'Como sei se estou pronto para virar a chave (go-live)?',
    a: 'Checklist mínimo: (1) 3 meses de dados históricos importados; (2) todos os cadastros mestres validados; (3) DRE fecha com o contador; (4) NF-e homologada com 20+ notas de teste; (5) equipe passou nas trilhas de aprendizado; (6) plano de rollback documentado.',
  },
];
