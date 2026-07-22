import { useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, Circle, Printer } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { MANUAL_MODULES, MANUAL_CATEGORIES, getBeginner, getDifficulty, DIFFICULTY_STYLE } from './content';
import { getFoundation } from './foundation';
import { useManualProgress } from './useManualProgress';
import { toast } from '@/ui/base/use-toast';
import { BeginnerTab } from './detail/BeginnerTab';
import { FoundationTab } from './detail/FoundationTab';
import { RulesTab } from './detail/RulesTab';
import { OverviewTab } from './detail/OverviewTab';
import { StepsTab } from './detail/StepsTab';
import { MediaTab } from './detail/MediaTab';
import { FaqTab } from './detail/FaqTab';
import { TroubleshootingTab } from './detail/TroubleshootingTab';
import { ModuleSidebar } from './detail/ModuleSidebar';
import { ModuleNavigation } from './detail/ModuleNavigation';

export default function ModuleManualDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const manual = useMemo(() => MANUAL_MODULES.find((m) => m.slug === slug), [slug]);
  const { isDone, toggle } = useManualProgress();

  const currentIndex = useMemo(() => MANUAL_MODULES.findIndex((m) => m.slug === slug), [slug]);
  const prevModule = currentIndex > 0 ? MANUAL_MODULES[currentIndex - 1] : null;
  const nextModule = currentIndex >= 0 && currentIndex < MANUAL_MODULES.length - 1 ? MANUAL_MODULES[currentIndex + 1] : null;

  if (!manual) {
    return (
      <PageContainer>
        <PageHeader title="Módulo não encontrado" description="Verifique o link ou volte para o índice do manual." icon={BookOpen} />
        <Button onClick={() => navigate('/admin/manual')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Manual
        </Button>
      </PageContainer>
    );
  }

  const Icon = manual.icon;
  const catStyle = MANUAL_CATEGORIES[manual.category];
  const beginner = getBeginner(manual.slug);
  const difficulty = getDifficulty(manual.slug);
  const foundation = getFoundation(manual.slug);
  const completed = isDone(manual.slug);

  const handleToggleComplete = () => {
    toggle(manual.slug);
    if (!completed) {
      toast({
        title: '✓ Módulo concluído',
        description: nextModule ? `Próximo sugerido: ${nextModule.title}` : 'Você completou todos os módulos!',
      });
    }
  };

  return (
    <PageContainer>
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/admin/manual" className="hover:text-primary flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Manual do Sistema
        </Link>
        <span>/</span>
        <span className="text-foreground">{manual.title}</span>
      </div>

      <PageHeader
        title={manual.title}
        description={manual.short}
        icon={Icon}
        actions={
          <>
            <Badge variant="outline" className={catStyle.color}>{manual.category}</Badge>
            <Badge variant="outline" className={DIFFICULTY_STYLE[difficulty]}>{difficulty}</Badge>
            <Badge variant="outline" className="border-primary/30 text-primary">⏱ {beginner.timeToLearn}</Badge>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> Imprimir
            </Button>
            <Button
              variant={completed ? 'outline' : 'default'}
              size="sm"
              onClick={handleToggleComplete}
              className={completed ? 'border-green-500/40 text-green-600 dark:text-green-400 hover:bg-green-500/10' : ''}
            >
              {completed ? (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> Concluído</>
              ) : (
                <><Circle className="h-4 w-4 mr-2" /> Marcar como concluído</>
              )}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6 min-w-0">
          <Tabs defaultValue="beginner">
            <TabsList className="grid grid-cols-4 sm:grid-cols-8 w-full">
              <TabsTrigger value="beginner">👋 Leigos</TabsTrigger>
              <TabsTrigger value="foundation">🎯 Fundamentos</TabsTrigger>
              <TabsTrigger value="rules">📏 Regras</TabsTrigger>
              <TabsTrigger value="overview">Visão geral</TabsTrigger>
              <TabsTrigger value="steps">Passo a passo</TabsTrigger>
              <TabsTrigger value="media">Telas & vídeos</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="trouble">Problemas</TabsTrigger>
            </TabsList>

            <TabsContent value="beginner"><BeginnerTab beginner={beginner} /></TabsContent>
            <TabsContent value="foundation"><FoundationTab foundation={foundation} /></TabsContent>
            <TabsContent value="rules"><RulesTab foundation={foundation} /></TabsContent>
            <TabsContent value="overview"><OverviewTab manual={manual} /></TabsContent>
            <TabsContent value="steps"><StepsTab manual={manual} /></TabsContent>
            <TabsContent value="media"><MediaTab manual={manual} /></TabsContent>
            <TabsContent value="faq"><FaqTab manual={manual} /></TabsContent>
            <TabsContent value="trouble"><TroubleshootingTab manual={manual} /></TabsContent>
          </Tabs>
        </div>

        <ModuleSidebar manual={manual} />
      </div>

      <ModuleNavigation prevModule={prevModule} nextModule={nextModule} />
    </PageContainer>
  );
}
