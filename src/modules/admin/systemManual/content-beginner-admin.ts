import type { BeginnerContent } from './content-types';

export const MODULE_BEGINNER_ADMIN: Record<string, BeginnerContent> = {
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
