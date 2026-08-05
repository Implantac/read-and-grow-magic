import type { BeginnerContent } from './content-types';

export const MODULE_BEGINNER_ADMIN: Record<string, BeginnerContent> = {
  'crm-nps': {
    inPlainWords: 'Uma ferramenta para ouvir seus clientes e saber se eles estão felizes.',
    analogy: 'É como a "caixinha de sugestões" da loja, mas que pergunta pro cliente o que ele achou logo após a compra.',
    plainSteps: [
      'Crie uma Campanha (ex: Pesquisa Pós-Venda).',
      'Envie os convites. O sistema gera um link único para cada cliente.',
      'Acompanhe as notas: 9 e 10 são seus fãs, 0 a 6 precisam de atenção urgente.',
    ],
    glossary: [
      { term: 'NPS', definition: 'Nota de satisfação de 0 a 10.' },
      { term: 'Detrator', definition: 'Cliente insatisfeito que pode falar mal da marca.' },
    ],
    timeToLearn: '10 minutos',
  },
  'admin-usuarios': {
    inPlainWords: 'Gerencie quem da sua equipe tem a "chave" para abrir cada parte do sistema.',
    analogy: 'É como o chaveiro da empresa: você decide quem entra no cofre (financeiro) e quem fica só no balcão (vendas).',
    plainSteps: [
      'Convide o colega pelo e-mail.',
      'Escolha um papel pronto (Admin, Gerente ou Operador).',
      'Se alguém sair da empresa, basta inativar o acesso aqui.',
    ],
    glossary: [
      { term: 'Papel (Role)', definition: 'Um conjunto de permissões já prontas para cada cargo.' },
    ],
    timeToLearn: '15 minutos',
  },
  billing: {
    inPlainWords: 'Veja quanto você está usando do sistema e gerencie seus pagamentos.',
    analogy: 'É como a conta do celular: mostra quanto você usou de "internet" (IA) e "minutos" (NF-es).',
    plainSteps: [
      'Olhe o medidor de uso para não ser pego de surpresa.',
      'Precisa de mais? Clique em Upgrade e mude seu plano na hora.',
    ],
    glossary: [
      { term: 'Quota', definition: 'O limite máximo que você pode usar no mês.' },
    ],
    timeToLearn: '5 minutos',
  },
};

