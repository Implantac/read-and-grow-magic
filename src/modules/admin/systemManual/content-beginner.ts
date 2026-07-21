import type { BeginnerContent, Difficulty } from './content-types';

export const MODULE_DIFFICULTY: Record<string, Difficulty> = {
  dashboard: 'Iniciante',
  comercial: 'Iniciante',
  financeiro: 'Intermediário',
  fiscal: 'Avançado',
  producao: 'Avançado',
  wms: 'Intermediário',
  compras: 'Iniciante',
  estoque: 'Iniciante',
  contabilidade: 'Avançado',
  tms: 'Intermediário',
  'crm-nps': 'Iniciante',
  executivo: 'Iniciante',
  'admin-usuarios': 'Intermediário',
  'admin-empresas': 'Intermediário',
  'admin-parametros': 'Intermediário',
  'admin-seguranca': 'Avançado',
  billing: 'Iniciante',
  rfid: 'Avançado',
  relatorios: 'Iniciante',
};

const GENERIC_GLOSSARY: BeginnerContent['glossary'] = [
  { term: 'KPI', definition: 'Indicador-chave: um número que mostra se algo vai bem ou mal (ex.: vendas do dia).' },
  { term: 'Dashboard', definition: 'Painel com vários indicadores juntos, como o painel de um carro.' },
  { term: 'Workflow', definition: 'Fluxo de trabalho automático — o sistema empurra a tarefa para a pessoa certa.' },
  { term: 'RLS', definition: 'Regra invisível que garante que você só vê os dados da sua empresa.' },
];

export const MODULE_BEGINNER: Record<string, BeginnerContent> = {
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
  wms: {
    inPlainWords: 'Organiza o armazém: recebe mercadoria, guarda em endereços e separa para expedição.',
    analogy: 'É o GPS da sua loja de trás: cada item tem um "endereço" e o sistema fala pro operador onde ir.',
    plainSteps: [
      'Ao chegar mercadoria, escaneie a nota — o sistema confere quantidades.',
      'Deixe o sistema sugerir o endereço de armazenagem (put-away).',
      'Ao receber pedidos, gere uma "onda" de picking — o coletor guia o operador.',
      'Após conferir, gere o manifesto de saída.',
    ],
    glossary: [
      { term: 'Put-away', definition: 'Guardar a mercadoria no lugar certo depois de receber.' },
      { term: 'Picking', definition: 'Separar os produtos de um pedido no armazém.' },
      { term: 'Onda', definition: 'Um grupo de pedidos separado junto para economizar caminhadas.' },
      { term: 'Coletor', definition: 'Aparelho de mão com leitor de código de barras que o operador usa.' },
    ],
    timeToLearn: '2 horas',
  },
  compras: {
    inPlainWords: 'Onde a empresa pede orçamentos, aprova e emite pedidos de compra para fornecedores.',
    analogy: 'Como um WhatsApp organizado com seus fornecedores: você pede preço, compara e aprova por dentro do sistema.',
    plainSteps: [
      'Crie uma requisição dizendo o que precisa.',
      'Envie a cotação para 2 ou 3 fornecedores.',
      'Compare preço, prazo e frete lado a lado.',
      'Aprovador recebe no Workflow Inbox e aprova em um clique.',
    ],
    glossary: [
      { term: 'PO', definition: 'Pedido de Compra: documento oficial enviado ao fornecedor.' },
      { term: 'Alçada', definition: 'Valor máximo que cada pessoa pode aprovar sozinha.' },
      { term: 'Cotação', definition: 'Pedir preço a vários fornecedores antes de decidir.' },
    ],
    timeToLearn: '30 minutos',
  },
  estoque: {
    inPlainWords: 'Mostra o que você tem, o que está vendendo bem e o que está parado.',
    analogy: 'É o inventário da despensa: você sabe o que tem, quanto vale e o que precisa repor.',
    plainSteps: [
      'Cadastre seus produtos com SKU, unidade e categoria.',
      'Consulte o Kardex para ver toda entrada/saída de um item.',
      'Use a Curva ABC para focar nos itens que mais faturam.',
    ],
    glossary: [
      { term: 'SKU', definition: 'Código único do produto no seu sistema.' },
      { term: 'Kardex', definition: 'Extrato de movimentações de um produto (parecido com extrato bancário).' },
      { term: 'Curva ABC', definition: 'Regra 80/20: A = os poucos que mais faturam, C = os muitos de baixo giro.' },
    ],
    timeToLearn: '20 minutos',
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
  tms: {
    inPlainWords: 'Planeja rotas de entrega, cadastra frota e acompanha os motoristas em tempo real.',
    analogy: 'É o Waze da sua expedição: monta a melhor rota e mostra onde cada motorista está agora.',
    plainSteps: [
      'Cadastre veículos e motoristas.',
      'Selecione pedidos prontos e clique em "otimizar rota".',
      'Envie o manifesto para o motorista via app.',
      'Acompanhe o rastreamento ao vivo e receba o comprovante (foto) quando entregar.',
    ],
    glossary: [
      { term: 'POD', definition: 'Prova de entrega — foto ou assinatura do recebedor.' },
      { term: 'Manifesto', definition: 'Documento com todas as entregas que o motorista vai fazer no dia.' },
      { term: 'Live Tracking', definition: 'Ver a localização do motorista em tempo real no mapa.' },
    ],
    timeToLearn: '1 hora',
  },
  'crm-nps': {
    inPlainWords: 'Envia pesquisas curtas aos clientes para saber se estão satisfeitos.',
    analogy: 'Aquela perguntinha "de 0 a 10, quanto você recomendaria?" — agora automática por e-mail.',
    plainSteps: [
      'Crie uma campanha definindo o público e o canal.',
      'Gere os convites em lote — cada cliente recebe um link único.',
      'Aguarde as respostas caírem no dashboard.',
      'Ligue para os detratores (nota 0–6) para reverter insatisfação.',
    ],
    glossary: [
      { term: 'NPS', definition: 'Nota de 0 a 10 que mede o quanto o cliente recomendaria sua empresa.' },
      { term: 'Promotor', definition: 'Nota 9 ou 10 — cliente feliz que indica.' },
      { term: 'Detrator', definition: 'Nota 0 a 6 — cliente insatisfeito que precisa de atenção.' },
    ],
    timeToLearn: '15 minutos',
  },
  executivo: {
    inPlainWords: 'Uma IA que responde perguntas sobre a empresa e pode executar ações no ERP para você.',
    analogy: 'É como ter um analista disponível 24h: pergunte em português e ele consulta os dados reais e responde.',
    plainSteps: [
      'Abra o Cérebro e digite perguntas como você faria a um colega.',
      'Peça análises: "compare minhas vendas deste mês com o anterior".',
      'Se ele sugerir uma ação (ex.: enviar cobrança), confirme antes de executar.',
      'Se errar, corrija no Learning — ele aprende com o feedback.',
    ],
    glossary: [
      { term: 'Tool Calling', definition: 'Quando a IA executa uma ação de verdade no sistema (não só conversa).' },
      { term: 'Guardrails', definition: 'Barreiras de segurança que exigem sua confirmação em ações críticas.' },
      { term: 'Autopilot', definition: 'Rotinas automáticas diárias (ex.: relatório às 7h no WhatsApp).' },
    ],
    timeToLearn: '10 minutos',
  },
  'admin-usuarios': {
    inPlainWords: 'Convida colaboradores e define o que cada um pode ver e fazer.',
    analogy: 'É o controle de chaves da empresa: você decide quem entra em quais salas.',
    plainSteps: [
      'Convide o usuário por e-mail.',
      'Escolha o papel inicial (admin, gerente, operador, viewer).',
      'Se quiser, ajuste permissões específicas por tela.',
      'Acompanhe mudanças na auditoria — toda alteração fica registrada.',
    ],
    glossary: [
      { term: 'RBAC', definition: 'Sistema de permissões baseado em papéis (ex.: "todo Gerente pode X").' },
      { term: 'Papel / Role', definition: 'Um conjunto pronto de permissões (admin, manager, viewer).' },
      { term: 'MFA', definition: 'Segundo fator de autenticação (código no celular além da senha).' },
    ],
    timeToLearn: '20 minutos',
  },
  'admin-empresas': {
    inPlainWords: 'Cadastra a matriz e as filiais da sua empresa (multi-CNPJ).',
    analogy: 'Uma "árvore genealógica" da sua empresa: matriz no topo e filiais penduradas.',
    plainSteps: [
      'Cadastre a matriz digitando só o CNPJ.',
      'Adicione filiais vinculadas à matriz.',
      'Use o seletor no topo do sistema para alternar entre empresas.',
    ],
    glossary: [
      { term: 'Multi-tenant', definition: 'Vários CNPJs no mesmo sistema, cada um com seus próprios dados.' },
      { term: 'Filial', definition: 'Unidade que depende de uma matriz mas pode ter regime próprio.' },
    ],
    timeToLearn: '15 minutos',
  },
  'admin-parametros': {
    inPlainWords: 'Ajusta o comportamento do sistema sem precisar de programador.',
    analogy: 'É o "menu de configurações" do sistema, como as configurações do seu celular.',
    plainSteps: [
      'Escolha uma categoria (Fiscal, Financeiro, WMS…).',
      'Encontre o parâmetro que quer ajustar.',
      'Salve. Algumas mudanças pedem re-login para valer.',
    ],
    glossary: [
      { term: 'Parâmetro', definition: 'Uma configuração salva que muda como o sistema se comporta.' },
    ],
    timeToLearn: '10 minutos',
  },
  'admin-seguranca': {
    inPlainWords: 'Mostra tudo que aconteceu de importante no sistema: quem fez o quê e quando.',
    analogy: 'Uma câmera de segurança digital: grava as ações críticas para você conferir depois.',
    plainSteps: [
      'Filtre por período, usuário ou tipo de ação.',
      'Ao clicar em um evento, compare "antes" e "depois".',
      'Exporte para auditoria externa quando pedirem.',
    ],
    glossary: [
      { term: 'Audit Log', definition: 'Registro imutável de uma ação (não pode ser apagado).' },
      { term: 'ROLE_CHANGE', definition: 'Evento de mudança de papel de um usuário — sempre revise.' },
    ],
    timeToLearn: '20 minutos',
  },
  billing: {
    inPlainWords: 'Mostra o quanto do seu plano você já usou e como fazer upgrade.',
    analogy: 'É como a tela de "dados do celular": mostra quanto você já consumiu no mês.',
    plainSteps: [
      'Veja o consumo por medidor (usuários, NF-e, IA...).',
      'Se chegar em 80%, o sistema avisa.',
      'Clique em "Upgrade" para subir de plano imediatamente.',
    ],
    glossary: [
      { term: 'Medidor', definition: 'Uma métrica que o plano limita (ex.: 1000 NF-e/mês).' },
    ],
    timeToLearn: '5 minutos',
  },
  rfid: {
    inPlainWords: 'Rastreia produtos por etiquetas de rádio-frequência, sem precisar bipar um por um.',
    analogy: 'É o pedágio automático da sua loja: a etiqueta passa perto do leitor e ele já contabiliza.',
    plainSteps: [
      'Cadastre o leitor (IP + localização).',
      'Cole uma tag RFID em cada produto rastreável.',
      'Acompanhe eventos em tempo real no feed.',
    ],
    glossary: [
      { term: 'Tag RFID', definition: 'Etiqueta pequena com um chip que emite sinal de rádio.' },
      { term: 'Leitor', definition: 'Antena que capta as tags que passam perto.' },
    ],
    timeToLearn: '1 hora',
  },
  relatorios: {
    inPlainWords: 'Relatórios prontos, com filtros, que podem ser exportados em PDF ou Excel.',
    analogy: 'É o "cardápio de relatórios": escolhe o que quer ver, aplica os filtros e imprime.',
    plainSteps: [
      'Escolha o relatório no menu.',
      'Aplique filtros (período, empresa, categoria).',
      'Clique em Exportar (PDF para apresentar, Excel para analisar).',
    ],
    glossary: [
      { term: 'Filtro', definition: 'Restrição que reduz o relatório ao que você quer ver.' },
    ],
    timeToLearn: '10 minutos',
  },
};

const FALLBACK_BEGINNER: BeginnerContent = {
  inPlainWords: 'Este módulo faz parte do ERP e trabalha integrado aos demais para automatizar processos.',
  analogy: 'Pense nele como uma peça de um quebra-cabeça: sozinho já ajuda, mas junto com os outros módulos fica poderoso.',
  plainSteps: [
    'Explore a tela principal e clique em cada botão sem medo — mudanças pedem confirmação.',
    'Consulte a aba "Passo a passo" para o fluxo padrão de uso.',
    'Se algo não funcionar, veja a aba "Problemas" antes de abrir chamado.',
  ],
  glossary: GENERIC_GLOSSARY,
  timeToLearn: '30 minutos',
};

export function getBeginner(slug: string): BeginnerContent {
  return MODULE_BEGINNER[slug] ?? FALLBACK_BEGINNER;
}

export function getDifficulty(slug: string): Difficulty {
  return MODULE_DIFFICULTY[slug] ?? 'Intermediário';
}

export const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  Iniciante: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  Intermediário: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  Avançado: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
};
