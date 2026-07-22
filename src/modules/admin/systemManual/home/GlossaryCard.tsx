import { useMemo, useState } from 'react';
import { ArrowUpAZ, BookMarked, Boxes, Cog, Factory, Landmark, Layers, Search, ShoppingCart, Wallet, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';
import { Input } from '@/ui/base/input';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { HighlightText } from '@/shared/components/HighlightText';
import { GLOBAL_GLOSSARY, type GlossaryTerm } from '../glossary';

const GLOSSARY_CATS: Array<{ key: string; icon: typeof Layers }> = [
  { key: 'all', icon: Layers },
  { key: 'Fiscal', icon: Landmark },
  { key: 'Financeiro', icon: Wallet },
  { key: 'Operacional', icon: Boxes },
  { key: 'Comercial', icon: ShoppingCart },
  { key: 'Produção', icon: Factory },
  { key: 'Sistema', icon: Cog },
];

export function GlossaryCard() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all');
  const [sort, setSort] = useState<'az' | 'category'>('az');

  const tokens = useMemo(() => q.trim().toLowerCase().split(/\s+/).filter(Boolean), [q]);

  const counts = useMemo(() => {
    const acc: Record<string, number> = { all: GLOBAL_GLOSSARY.length };
    for (const g of GLOBAL_GLOSSARY) acc[g.category] = (acc[g.category] ?? 0) + 1;
    return acc;
  }, []);

  const filtered = useMemo(() => {
    const list = GLOBAL_GLOSSARY.filter((g) => {
      if (cat !== 'all' && g.category !== cat) return false;
      if (tokens.length === 0) return true;
      const hay = `${g.term} ${g.acronym ?? ''} ${g.definition} ${g.example ?? ''}`.toLowerCase();
      return tokens.every((tok) => hay.includes(tok));
    });
    if (sort === 'az') return [...list].sort((a, b) => a.term.localeCompare(b.term, 'pt-BR'));
    return [...list].sort((a, b) =>
      a.category === b.category ? a.term.localeCompare(b.term, 'pt-BR') : a.category.localeCompare(b.category, 'pt-BR'),
    );
  }, [cat, tokens, sort]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookMarked className="h-5 w-5 text-primary" /> Glossário do ERP — a linguagem que você vai ouvir
        </CardTitle>
        <CardDescription>
          {GLOBAL_GLOSSARY.length} termos técnicos, fiscais e operacionais traduzidos para linguagem de negócio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por termo, sigla, definição ou exemplo (ex: NF-e imposto, picking FEFO)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 pr-9"
                aria-label="Buscar no glossário"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ('')}
                  aria-label="Limpar busca"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button
                variant={sort === 'az' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSort('az')}
                className="text-xs"
                aria-pressed={sort === 'az'}
              >
                <ArrowUpAZ className="h-3.5 w-3.5 mr-1" /> A–Z
              </Button>
              <Button
                variant={sort === 'category' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSort('category')}
                className="text-xs"
                aria-pressed={sort === 'category'}
              >
                <Layers className="h-3.5 w-3.5 mr-1" /> Categoria
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {GLOSSARY_CATS.map(({ key, icon: CIcon }) => {
              const active = cat === key;
              const label = key === 'all' ? 'Todos' : key;
              return (
                <Button
                  key={key}
                  variant={active ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCat(key)}
                  className="text-xs gap-1.5"
                  aria-pressed={active}
                >
                  <CIcon className="h-3.5 w-3.5" />
                  {label}
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ml-0.5 h-4 px-1.5 ${active ? 'bg-primary-foreground/20 text-primary-foreground' : ''}`}
                  >
                    {counts[key] ?? 0}
                  </Badge>
                </Button>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Mostrando <strong className="text-foreground tabular-nums">{filtered.length}</strong>
              {' '}de {GLOBAL_GLOSSARY.length} termos
              {tokens.length > 0 && <> para <em className="text-foreground">"{q}"</em></>}
              {cat !== 'all' && <> em <strong className="text-foreground">{cat}</strong></>}
            </span>
            {(q || cat !== 'all') && (
              <button
                type="button"
                onClick={() => { setQ(''); setCat('all'); }}
                className="text-primary hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            <BookMarked className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>Nenhum termo encontrado{q && <> para <strong>"{q}"</strong></>}.</p>
            <p className="text-xs mt-1">Tente outra palavra-chave ou remova os filtros de categoria.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 max-h-[460px] overflow-y-auto pr-2">
            {filtered.map((g: GlossaryTerm, i) => (
              <div key={`${g.term}-${i}`} className="rounded-lg border p-3 bg-muted/10 hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-sm font-semibold text-primary flex items-center gap-2 flex-wrap">
                    <HighlightText text={g.term} search={q} />
                    {g.acronym && (
                      <Badge variant="outline" className="text-[10px] font-mono">
                        <HighlightText text={g.acronym} search={q} />
                      </Badge>
                    )}
                  </p>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{g.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <HighlightText text={g.definition} search={q} />
                </p>
                {g.example && (
                  <p className="text-xs text-foreground/70 mt-2 italic border-l-2 border-primary/30 pl-2">
                    Ex: <HighlightText text={g.example} search={q} />
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
