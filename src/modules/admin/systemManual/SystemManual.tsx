import { useMemo, useState } from 'react';
import { Search, GraduationCap, Sparkles } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';
import { Input } from '@/ui/base/input';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { MANUAL_MODULES, MANUAL_CATEGORIES, DIFFICULTY_STYLE } from './content';
import { useManualProgress } from './useManualProgress';
import manualIcon from './assets/manual-icon.png';
import { ProgressCard } from './home/ProgressCard';
import { RoadmapCard } from './home/RoadmapCard';
import { LearningPathsCard } from './home/LearningPathsCard';
import { ModulesGrid } from './home/ModulesGrid';
import { QuickStartCard } from './home/QuickStartCard';
import { GlossaryCard } from './home/GlossaryCard';
import { FAQCard } from './home/FAQCard';
import { CertificateCard } from './home/CertificateCard';

export default function SystemManual() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all');
  const { isDone, count, reset } = useManualProgress();

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return MANUAL_MODULES.filter((m) => {
      if (cat !== 'all' && m.category !== cat) return false;
      if (!t) return true;
      return (
        m.title.toLowerCase().includes(t) ||
        m.short.toLowerCase().includes(t) ||
        m.category.toLowerCase().includes(t)
      );
    });
  }, [q, cat]);

  const total = MANUAL_MODULES.length;
  const categories = Object.keys(MANUAL_CATEGORIES) as (keyof typeof MANUAL_CATEGORIES)[];

  return (
    <PageContainer>
      <PageHeader
        title="Manual do Sistema"
        description="Treinamento completo para implantação e uso diário. Escolha um módulo para ver instruções passo a passo, boas práticas, FAQ e troubleshooting."
        icon={GraduationCap}
      />

      <Card className="mb-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden">
        <div className="grid md:grid-cols-[1fr_auto] gap-4 items-center">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Um manual pensado para quem nunca usou um ERP
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Cada módulo tem uma aba <strong>👋 Para leigos</strong> com linguagem simples, uma analogia do dia a dia,
              os primeiros passos em português claro e um mini-dicionário. Se você é novo por aqui, comece pelos módulos
              marcados como <Badge variant="outline" className={DIFFICULTY_STYLE.Iniciante}>Iniciante</Badge>.
            </CardDescription>
          </CardHeader>
          <div className="pr-6 pb-6 md:pb-0 md:pr-8 hidden md:block">
            <img
              src={manualIcon}
              alt="Manual do sistema — livro aberto com lâmpada"
              width={140}
              height={140}
              loading="lazy"
              className="drop-shadow-xl"
            />
          </div>
        </div>
      </Card>

      <ProgressCard count={count} total={total} onReset={reset} />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar módulo, categoria ou palavra-chave..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={cat === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setCat('all')}>
            Todos ({MANUAL_MODULES.length})
          </Button>
          {categories.map((c) => {
            const n = MANUAL_MODULES.filter((m) => m.category === c).length;
            return (
              <Button key={c} variant={cat === c ? 'default' : 'outline'} size="sm" onClick={() => setCat(c)}>
                {c} ({n})
              </Button>
            );
          })}
        </div>
      </div>

      <RoadmapCard />
      <LearningPathsCard isDone={isDone} />

      <ModulesGrid modules={filtered} isDone={isDone} query={q} />

      <QuickStartCard />
      <GlossaryCard />
      <FAQCard />

      {count === total && total > 0 && <CertificateCard total={total} />}
    </PageContainer>
  );
}
