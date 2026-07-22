import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Checkbox } from '@/ui/base/checkbox';
import { Plus } from 'lucide-react';
import { TYPES, OPTION_TYPES } from './constants';

export type NewQuestionFormState = {
  question_text: string;
  question_type: string;
  required: boolean;
  choices: string;
};

export function NewQuestionForm({
  form,
  setForm,
  onSubmit,
  submitting,
}: {
  form: NewQuestionFormState;
  setForm: (f: NewQuestionFormState) => void;
  onSubmit: () => void;
  submitting?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nova pergunta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <Label>Texto da pergunta</Label>
            <Input
              value={form.question_text}
              onChange={(e) => setForm({ ...form, question_text: e.target.value })}
              placeholder="Ex.: Como você avalia o atendimento?"
            />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={form.question_type} onValueChange={(v) => setForm({ ...form, question_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {OPTION_TYPES.includes(form.question_type) && (
          <div>
            <Label>Opções (uma por linha)</Label>
            <textarea
              value={form.choices}
              onChange={(e) => setForm({ ...form, choices: e.target.value })}
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={'Ótimo\nBom\nRegular\nRuim'}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.required} onCheckedChange={(v) => setForm({ ...form, required: !!v })} /> Obrigatória
          </label>
          <Button onClick={onSubmit} disabled={!form.question_text || submitting}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
