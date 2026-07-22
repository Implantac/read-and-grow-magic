import { useState } from 'react';
import { Card, CardContent } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Badge } from '@/ui/base/badge';
import { Switch } from '@/ui/base/switch';
import { toast } from 'sonner';
import { ArrowUp, ArrowDown, BookmarkPlus, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TYPES, OPTION_TYPES } from './constants';

export function SortableQuestion({
  q, index, total, onMoveUp, onMoveDown, onToggleRequired, onEdit, onSaveToBank, onDelete,
}: {
  q: any;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleRequired: (v: boolean) => void;
  onEdit: (patch: Record<string, any>) => void;
  onSaveToBank: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  } as React.CSSProperties;

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState<string>(q.question_text ?? '');
  const [type, setType] = useState<string>(q.question_type ?? 'text');
  const [choices, setChoices] = useState<string>((q.options?.choices ?? []).join('\n'));
  const editingHasOptions = OPTION_TYPES.includes(type);

  const startEdit = () => {
    setText(q.question_text ?? '');
    setType(q.question_type ?? 'text');
    setChoices((q.options?.choices ?? []).join('\n'));
    setEditing(true);
  };

  const save = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error('O texto da pergunta não pode ficar em branco.');
      return;
    }
    const patch: Record<string, any> = { question_text: trimmed, question_type: type };
    if (editingHasOptions) {
      const arr = choices.split('\n').map((s) => s.trim()).filter(Boolean);
      if (arr.length < 2) {
        toast.error('Adicione pelo menos 2 opções (uma por linha).');
        return;
      }
      patch.options = { ...(q.options ?? {}), choices: arr };
    } else {
      patch.options = null;
    }
    onEdit(patch);
    setEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={isDragging ? 'ring-2 ring-primary/40' : ''}>
        <CardContent className="pt-4 flex justify-between items-start gap-3">
          <button
            type="button"
            className="mt-1 cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
            aria-label="Arrastar para reordenar"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="md:col-span-2">
                    <Label className="text-xs">Texto da pergunta</Label>
                    <Input value={text} onChange={(e) => setText(e.target.value)} autoFocus />
                  </div>
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <Select
                      value={type}
                      onValueChange={(v) => {
                        setType(v);
                        if (OPTION_TYPES.includes(v) && choices.trim() === '') {
                          setChoices('Opção 1\nOpção 2');
                        }
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                {editingHasOptions && (
                  <div>
                    <Label className="text-xs">Opções (uma por linha)</Label>
                    <textarea
                      value={choices}
                      onChange={(e) => setChoices(e.target.value)}
                      className="w-full min-h-[90px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder={'Ótimo\nBom\nRegular\nRuim'}
                    />
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={save}>Salvar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={startEdit}
                className="text-left w-full group"
                title="Clique para editar"
              >
                <div className="font-medium group-hover:underline decoration-dotted underline-offset-4">
                  {index + 1}. {q.question_text}
                </div>
                <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5 mt-1">
                  <Badge variant="outline">{q.question_type}</Badge>
                  {q.required && <Badge variant="secondary">obrigatória</Badge>}
                  {q.options?.choices?.length ? <span>{q.options.choices.length} opções</span> : null}
                </div>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Obrig.
              <Switch checked={!!q.required} onCheckedChange={onToggleRequired} />
            </label>
            {!editing && (
              <Button size="icon" variant="ghost" title="Editar" onClick={startEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button size="icon" variant="ghost" title="Mover para cima" disabled={index === 0} onClick={onMoveUp}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" title="Mover para baixo" disabled={index === total - 1} onClick={onMoveDown}>
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" title="Salvar na biblioteca" onClick={onSaveToBank}>
              <BookmarkPlus className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
