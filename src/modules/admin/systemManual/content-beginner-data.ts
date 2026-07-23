import type { BeginnerContent } from './content-types';

export const GENERIC_GLOSSARY: BeginnerContent['glossary'] = [
  { term: 'KPI', definition: 'Indicador-chave: um número que mostra se algo vai bem ou mal (ex.: vendas do dia).' },
  { term: 'Dashboard', definition: 'Painel com vários indicadores juntos, como o painel de um carro.' },
  { term: 'Workflow', definition: 'Fluxo de trabalho automático — o sistema empurra a tarefa para a pessoa certa.' },
  { term: 'RLS', definition: 'Regra invisível que garante que você só vê os dados da sua empresa.' },
];

export const FALLBACK_BEGINNER: BeginnerContent = {
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
