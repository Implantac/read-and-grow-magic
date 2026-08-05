import { Users, Building2, Settings, ShieldCheck, CreditCard } from 'lucide-react';
import { commonScreens, type ModuleManual } from '../content-types';

export const ADMINISTRACAO_MODULES: ModuleManual[] = [
  {
    slug: 'admin-usuarios',
    title: 'Usuários & Segurança',
    category: 'Administração',
    icon: Users,
    short: 'Controle quem acessa o quê. Gerencie senhas, papéis e auditoria.',
    overview: ['Gerencie os acessos da sua equipe de forma segura. Defina o que cada colaborador pode ver e fazer em cada módulo.'],
    routes: [{ label: 'Usuários', path: '/admin/usuarios' }, { label: 'Auditoria', path: '/admin/auditoria' }],
    personas: ['Administrador', 'TI', 'DPO'],
    prerequisites: ['Permissão de administrador'],
    steps: [
      { title: 'Adicionar Colaborador', description: 'Vá em Usuários → Novo. Informe o e-mail e o papel (Admin, Gerente ou Operador).' },
      { title: 'Acompanhar Ações', description: 'Em Auditoria, você vê exatamente quem alterou o quê e quando. Isso garante a segurança dos seus dados.' }
    ],
    sections: [],
    faq: [{ q: 'Posso limitar acesso por filial?', a: 'Sim, você pode restringir usuários a filiais específicas nas configurações do perfil.' }],
    troubleshooting: [{ problem: 'Usuário não recebe convite', solution: 'Peça para ele verificar a caixa de spam ou reenvie o convite pelo painel.' }],
    screenshots: [],
  },
  {
    slug: 'admin-empresas',
    title: 'Empresas & Filiais',
    category: 'Administração',
    icon: Building2,
    short: 'Configure seus CNPJs, logotipos e dados de faturamento.',
    overview: ['Gerencie a estrutura da sua empresa, desde a matriz até as filiais, centralizando o cadastro fiscal e logístico.'],
    routes: [{ label: 'Empresas', path: '/admin/empresas' }],
    personas: ['Administrador', 'Fiscal'],
    prerequisites: [],
    steps: [
      { title: 'Configurar Matriz', description: 'Preencha os dados do CNPJ. O sistema busca automaticamente o endereço via BrasilAPI.' },
      { title: 'Personalizar', description: 'Suba o logotipo da sua empresa para que ele apareça nos documentos e notas fiscais.' }
    ],
    sections: [],
    faq: [],
    troubleshooting: [],
    screenshots: [],
  },
  {
    slug: 'billing',
    title: 'Meu Plano & Assinatura',
    category: 'Administração',
    icon: CreditCard,
    short: 'Controle de custos, faturas e upgrade de recursos.',
    overview: ['Acompanhe o consumo do seu plano (NF-es emitidas, usuários ativos, IA) e gerencie seus pagamentos.'],
    routes: [{ label: 'Assinatura', path: '/billing/uso' }, { label: 'Upgrades', path: '/upgrade' }],
    personas: ['Proprietário', 'Administrador'],
    prerequisites: [],
    steps: [
      { title: 'Monitorar Uso', description: 'Acompanhe as barras de progresso para saber se você está chegando ao limite do seu plano.' },
      { title: 'Fazer Upgrade', description: 'Precisa de mais recursos? Escolha um novo plano e a ativação é imediata.' }
    ],
    sections: [],
    faq: [{ q: 'Como cancelo?', a: 'O cancelamento pode ser feito a qualquer momento pelo painel, sem multas.' }],
    troubleshooting: [],
    screenshots: [],
  },
];

