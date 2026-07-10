import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, ArrowRight, GraduationCap } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Input } from '@/ui/base/input';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { MANUAL_MODULES, MANUAL_CATEGORIES } from './content';

export default function SystemManual() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all');

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

  const categories = Object.keys(MANUAL_CATEGORIES) as (keyof typeof MANUAL_CATEGORIES)[];

  return (
    <PageContainer>
      <PageHeader
        title="Manual do Sistema"
        description="Treinamento completo para implantação e uso diário. Escolha um módulo para ver instruções passo a passo, boas práticas, FAQ e troubleshooting."
        icon={GraduationCap}
      />

      <Card className="mb-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Como usar este manual
          </CardTitle>
          <CardDescription>
            Cada card abaixo abre um guia completo do módulo: visão geral, pré-requisitos, passo a passo, boas práticas,
            perguntas frequentes e solução de problemas. Ideal para onboarding de novos usuários, treinamento de equipes
            e consulta rápida durante a operação.
          </CardDescription>
        </CardHeader>
      </Card>

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
            const count = MANUAL_MODULES.filter((m) => m.category === c).length;
            return (
              <Button key={c} variant={cat === c ? 'default' : 'outline'} size="sm" onClick={() => setCat(c)}>
                {c} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => {
          const Icon = m.icon;
          const catStyle = MANUAL_CATEGORIES[m.category];
          return (
            <Link
              key={m.slug}
              to={`/admin/manual/${m.slug}`}
              className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
            >
              <Card className="h-full transition-all hover:shadow-elevation-3 hover:border-primary/50 hover:-translate-y-0.5">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-inset ring-primary/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className={catStyle.color}>
                      {m.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-3 group-hover:text-primary transition-colors">
                    {m.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{m.short}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{m.steps.length} passos · {m.faq.length} FAQs</span>
                    <span className="flex items-center gap-1 text-primary font-medium">
                      Abrir guia <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="mt-6">
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum módulo encontrado para "{q}".
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
