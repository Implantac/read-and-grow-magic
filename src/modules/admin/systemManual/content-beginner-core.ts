import type { BeginnerContent } from './content-types';
import { GENERIC_GLOSSARY } from './content-beginner-data';

export const MODULE_BEGINNER_CORE: Record<string, BeginnerContent> = {
  dashboard: {
    inPlainWords: 'A tela principal que mostra, em um piscar de olhos, se sua empresa está bem hoje.',
    analogy: 'É como o painel do carro: mostra velocidade, combustível e alertas — você não precisa abrir o capô para saber se está tudo certo.',
    plainSteps: [
      'Faça login. O painel abre sozinho — não é preciso configurar nada no primeiro uso.',
      'Olhe as cores dos cartões: verde é bom, amarelo pede atenção, vermelho precisa de ação.',
      'Clique em qualquer cartão para ver os detalhes (chamamos isso de "drill-down").',
      'Se algo estiver zerado, cheque no topo se você selecionou a empresa certa.',
    ],
    glossary: [
      { term: 'Drill-down', definition: 'Clicar em um número para descobrir de onde ele veio.' },
      { term: 'Command Palette', definition: 'Atalho Ctrl+K que abre uma busca rápida para pular para qualquer tela.' },
      ...GENERIC_GLOSSARY.slice(0, 2),
    ],
    timeToLearn: '5 minutos',
  },
  comercial: {
    inPlainWords: 'Onde você cadastra clientes, cria pedidos de venda e acompanha o funil comercial.',
    analogy: 'Pense em um caderno de pedidos digital que, sozinho, calcula impostos, reserva estoque e envia a nota fiscal.',
    plainSteps: [
      'Cadastre o cliente uma vez (digite só o CNPJ, o resto o sistema busca).',
      'Crie um pedido: escolha o cliente, adicione os produtos e revise.',
      'Arraste o pedido no Kanban conforme ele evolui (Proposta → Fechado → Faturado).',
      'Quando fechar, o sistema emite a nota fiscal e lança a cobrança sozinho.',
    ],
    glossary: [
      { term: 'Pipeline / Kanban', definition: 'Quadro visual com colunas onde cada cartão é um pedido em andamento.' },
      { term: 'NF-e', definition: 'Nota fiscal eletrônica — o documento oficial da venda.' },
      { term: 'Churn', definition: 'Cliente que parou de comprar. A IA avisa antes que aconteça.' },
    ],
    timeToLearn: '30 minutos',
  },
  financeiro: {
    inPlainWords: 'Controla o dinheiro que entra e sai da empresa e mostra quanto sobra no fim do mês.',
    analogy: 'É a versão profissional do seu app de banco pessoal, com contas a pagar, contas a receber e conciliação automática.',
    plainSteps: [
      'Cadastre suas contas bancárias uma vez.',
      'Lance contas a pagar assim que a nota chegar (ou deixe o sistema criar sozinho a partir de compras).',
      'Uma vez por semana, importe o extrato do banco (.OFX). O sistema "casa" os lançamentos sozinho.',
      'Consulte a Tesouraria para saber quanto você terá em caixa nos próximos 30 dias.',
    ],
    glossary: [
      { term: 'AP (Contas a Pagar)', definition: 'Tudo que você deve pagar: fornecedores, aluguel, impostos.' },
      { term: 'AR (Contas a Receber)', definition: 'Tudo que vão te pagar: vendas a prazo, boletos emitidos.' },
      { term: 'Conciliação', definition: 'Comparar o extrato do banco com o que está no sistema para achar diferenças.' },
      { term: 'DRE', definition: 'Relatório que mostra se você teve lucro ou prejuízo no período.' },
    ],
    timeToLearn: '1 hora',
  },
  fiscal: {
    inPlainWords: 'Cuida das notas fiscais e das obrigações que sua empresa precisa entregar ao governo.',
    analogy: 'É como um contador digital que preenche e envia os documentos oficiais para você, sem erros de conta.',
    plainSteps: [
      'Suba o certificado digital A1 (arquivo .pfx que sua contabilidade te enviou).',
      'Configure uma vez as regras de imposto por estado — o sistema aplica sozinho depois.',
      'Toda venda vira NF-e automaticamente; você só revisa e confirma.',
      'No fim do mês, gere o SPED e envie ao contador.',
    ],
    glossary: [
      { term: 'Certificado A1', definition: 'Um arquivo que funciona como sua assinatura digital para o governo.' },
      { term: 'CFOP', definition: 'Código que diz "o que" está sendo feito com a mercadoria (venda, devolução, brinde).' },
      { term: 'SPED', definition: 'Arquivo digital que você entrega mensalmente à Receita.' },
      { term: 'ICMS / PIS / COFINS', definition: 'Impostos que incidem sobre a venda. O sistema calcula pra você.' },
    ],
    timeToLearn: '2 horas com apoio do contador',
  },
  producao: {
    inPlainWords: 'Planeja e acompanha a fabricação: o que produzir, quando, com quais materiais.',
    analogy: 'É a receita de bolo somada à agenda da cozinha: sabe o que tem no armário e quando ligar o forno.',
    plainSteps: [
      'Cadastre a "receita" de cada produto (BOM: quais insumos e quantidades).',
      'Rode o MRP: o sistema calcula o que falta comprar e o que produzir.',
      'Abra uma Ordem de Produção e imprima para o chão de fábrica.',
      'Operador aponta início, fim e quantidade no terminal ou coletor.',
    ],
    glossary: [
      { term: 'BOM', definition: 'Lista de ingredientes de um produto (Bill of Materials).' },
      { term: 'MRP', definition: 'Cálculo automático do que precisa ser comprado e produzido para atender pedidos.' },
      { term: 'OEE', definition: 'Nota de 0 a 100 que diz o quão eficiente sua fábrica está.' },
      { term: 'Apontamento', definition: 'Registro que o operador faz no chão de fábrica dizendo "comecei/terminei".' },
    ],
    timeToLearn: '3 horas',
  },
  contabilidade: {
    inPlainWords: 'Registra oficialmente cada movimento financeiro para gerar balanço e DRE.',
    analogy: 'É o "diário oficial" da empresa. Cada operação vira uma partida dobrada, como débito e crédito no banco.',
    plainSteps: [
      'Importe (ou use o padrão) seu Plano de Contas.',
      'Deixe o sistema criar os lançamentos automáticos das vendas, compras e folha.',
      'Revise diariamente as divergências.',
      'No fim do mês, feche o período — depois disso ninguém edita mais.',
    ],
    glossary: [
      { term: 'Plano de Contas', definition: 'Lista de "gavetas" onde cada centavo é classificado.' },
      { term: 'Partida Dobrada', definition: 'Todo lançamento tem 2 lados: origem e destino do dinheiro.' },
      { term: 'Balancete', definition: 'Foto do saldo de todas as contas em um dia.' },
    ],
    timeToLearn: '4 horas com contador',
  },
};
