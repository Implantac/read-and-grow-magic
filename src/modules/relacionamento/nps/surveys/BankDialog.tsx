import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { Input } from '@/ui/base/input';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Checkbox } from '@/ui/base/checkbox';
import { Skeleton } from '@/ui/base/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Library, Search, Sparkles, Trash } from 'lucide-react';
import { useQuestionBank, useImportQuestionsFromBank, useDeleteQuestionFromBank } from '../hooks';

export function BankDialog({
  open,
  onOpenChange,
  campaignId,
  currentCount,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  campaignId?: string;
  currentCount: number;
}) {
  const [tab, setTab] = useState<'global' | 'company'>('global');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const { data: bank = [], isLoading } = useQuestionBank({ search, category });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const importMut = useImportQuestionsFromBank();
  const delBank = useDeleteQuestionFromBank();

  const filtered = useMemo(
    () => (bank as any[]).filter((q) => (tab === 'global' ? q.is_global : !q.is_global)),
    [bank, tab],
  );

  const categories = useMemo(() => {
    const s = new Set<string>();
    (bank as any[]).forEach((q) => s.add(q.category));
    return Array.from(s).sort();
  }, [bank]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const doImport = () => {
    if (!campaignId || selected.size === 0) return;
    importMut.mutate(
      { campaign_id: campaignId, bank_ids: Array.from(selected), start_order: currentCount },
      { onSuccess: () => { setSelected(new Set()); onOpenChange(false); } },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="h-4 w-4" /> Biblioteca de perguntas
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="global">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Curadoria da plataforma
            </TabsTrigger>
            <TabsTrigger value="company">Suas perguntas</TabsTrigger>
          </TabsList>

          <div className="flex flex-col md:flex-row gap-2 my-3">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar pergunta…"
                className="pl-8"
              />
            </div>
            <Select value={category ?? '__all'} onValueChange={(v) => setCategory(v === '__all' ? undefined : v)}>
              <SelectTrigger className="md:w-64">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todas as categorias</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <TabsContent value={tab} className="mt-0">
            <div className="max-h-[420px] overflow-y-auto border rounded divide-y">
              {isLoading && <div className="p-6"><Skeleton className="h-24" /></div>}
              {!isLoading && filtered.length === 0 && (
                <p className="p-6 text-sm text-muted-foreground text-center">
                  {tab === 'global' ? 'Nenhuma pergunta na curadoria.' : 'Você ainda não salvou perguntas na biblioteca.'}
                </p>
              )}
              {filtered.map((q: any) => (
                <label key={q.id} className="flex items-start gap-3 p-3 hover:bg-muted/40 cursor-pointer">
                  <Checkbox checked={selected.has(q.id)} onCheckedChange={() => toggle(q.id)} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{q.question_text}</div>
                    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5 mt-1">
                      <Badge variant="outline">{q.category}</Badge>
                      <Badge variant="secondary">{q.question_type}</Badge>
                      {q.required && <Badge>obrigatória</Badge>}
                      {q.options?.choices?.length ? <span>· {q.options.choices.length} opções</span> : null}
                      {q.usage_count > 0 && <span>· usada {q.usage_count}×</span>}
                    </div>
                  </div>
                  {tab === 'company' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => { e.preventDefault(); delBank.mutate(q.id); }}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </label>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
          <span className="text-xs text-muted-foreground">{selected.size} selecionada(s)</span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={doImport} disabled={selected.size === 0 || !campaignId || importMut.isPending}>
              Adicionar {selected.size} à campanha
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
