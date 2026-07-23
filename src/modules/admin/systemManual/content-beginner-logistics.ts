import type { BeginnerContent } from './content-types';

export const MODULE_BEGINNER_LOGISTICS: Record<string, BeginnerContent> = {
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
};
