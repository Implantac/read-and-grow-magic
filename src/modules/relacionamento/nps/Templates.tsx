import { useState } from 'react';
import { useNPSTemplates, useSaveTemplate } from './hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Skeleton } from '@/ui/base/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Plus, Palette } from 'lucide-react';

export default function Templates() {
  const { data: templates = [], isLoading } = useNPSTemplates();
  const save = useSaveTemplate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ name: '', primary_color: '#FF9800', background_color: '#1A2234', font_family: 'Inter', logo_url: '', banner_url: '', footer_text: '' });

  const submit = () => save.mutate(form, { onSuccess: () => setOpen(false) });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Templates visuais</h2>
          <p className="text-sm text-muted-foreground">Personalize a aparência das pesquisas (logo, cores, fontes, banner).</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Novo template</Button>
      </div>

      {isLoading ? <Skeleton className="h-40" /> : (
        <div className="grid gap-3 md:grid-cols-3">
          {templates.map((t: any) => (
            <Card key={t.id}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" style={{ color: t.primary_color }} /> {t.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <div className="h-6 w-6 rounded" style={{ background: t.primary_color }} />
                  <div className="h-6 w-6 rounded" style={{ background: t.background_color }} />
                </div>
                <p className="text-xs text-muted-foreground">{t.font_family}</p>
                <Button size="sm" variant="ghost" onClick={() => { setForm(t); setOpen(true); }}>Editar</Button>
              </CardContent>
            </Card>
          ))}
          {templates.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Nenhum template criado.</p>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? 'Editar' : 'Novo'} template</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Cor primária</Label><Input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} /></div>
            <div><Label>Cor de fundo</Label><Input type="color" value={form.background_color} onChange={(e) => setForm({ ...form, background_color: e.target.value })} /></div>
            <div><Label>Fonte</Label><Input value={form.font_family} onChange={(e) => setForm({ ...form, font_family: e.target.value })} /></div>
            <div><Label>Logo URL</Label><Input value={form.logo_url ?? ''} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} /></div>
            <div className="col-span-2"><Label>Banner URL</Label><Input value={form.banner_url ?? ''} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} /></div>
            <div className="col-span-2"><Label>Rodapé</Label><Textarea value={form.footer_text ?? ''} onChange={(e) => setForm({ ...form, footer_text: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={!form.name}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
