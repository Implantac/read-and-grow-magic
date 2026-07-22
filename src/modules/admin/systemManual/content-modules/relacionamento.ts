import { HeartHandshake } from 'lucide-react';
import { commonScreens, type ModuleManual } from '../content-types';

export const RELACIONAMENTO_MODULES: ModuleManual[] = [
  {
    slug: 'crm-nps',
    title: 'Relacionamento & NPS',
    category: 'Relacionamento',
    icon: HeartHandshake,
    short: 'Campanhas NPS, convites, respostas, CX e follow-up.',
    overview: ['Gestão de pesquisas NPS com campanhas, convites por link/e-mail, coleta e análise por segmento.'],
    routes: [
      { label: 'Campanhas', path: '/relacionamento/nps/campanhas' },
      { label: 'Convites', path: '/relacionamento/nps/convites' },
      { label: 'Respostas', path: '/relacionamento/nps/respostas' },
    ],
    personas: ['CX', 'Comercial', 'Marketing'],
    prerequisites: ['Base de clientes/contatos importada'],
    steps: [
      { title: 'Criar campanha', description: 'Campanhas → Nova. Defina público, canal e período.' },
      { title: 'Gerar convites', description: 'Convites → Gerar. Envie em lote por e-mail ou copie links.', tip: 'Ações em lote mostram falhas parciais por convite.' },
      { title: 'Analisar respostas', description: 'Dashboard NPS com promotores/neutros/detratores por segmento.' },
    ],
    sections: [{ heading: 'Guardrails', paragraphs: ['Segmente análises; NPS agregado esconde variação — sempre compare cortes.'] }],
    faq: [{ q: 'Convite não chegou?', a: 'Confira status no lote; reenvie ou copie link manualmente.' }],
    troubleshooting: [{ problem: 'Gerar convites inativo', solution: 'Crie ao menos uma campanha antes.' }],
    screenshots: commonScreens(['Campanha nova', 'Lote de convites', 'Dashboard NPS']),
  },
];
