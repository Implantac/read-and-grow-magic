import { Input } from '@/ui/base/input';
import { Textarea } from '@/ui/base/textarea';
import type { Question } from './types';
import { EMOJIS } from './types';

interface Props {
  q: Question;
  answers: Record<string, any>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  touched: boolean;
  primary: string;
}

export function QuestionRenderer({ q, answers, setAnswers, touched, primary }: Props) {
  const val = answers[q.id];
  const set = (v: any) => setAnswers((prev) => ({ ...prev, [q.id]: v }));
  const rawOpts: any = q.options;
  const optsArr: any[] = Array.isArray(rawOpts)
    ? rawOpts
    : Array.isArray(rawOpts?.choices)
    ? rawOpts.choices
    : Array.isArray(rawOpts?.labels)
    ? rawOpts.labels
    : [];
  const choices: Array<{ label: string; value: string }> = optsArr.map((o: any) =>
    typeof o === 'string' || typeof o === 'number'
      ? { label: String(o), value: String(o) }
      : { label: String(o?.label ?? o?.value ?? ''), value: String(o?.value ?? o?.label ?? '') },
  );
  const missing = touched && q.required && (val === undefined || val === '' || (Array.isArray(val) && val.length === 0));

  const isOtherLabel = (label: string) => /^(outro|outros|other|especificar|especifique)\b/i.test((label ?? '').trim());
  const otherValues = new Set(choices.filter((o) => isOtherLabel(o.label)).map((o) => o.value));
  const currentOther: string = (answers[`${q.id}__other`] as string) ?? '';
  const setOther = (v: string) => setAnswers((prev) => ({ ...prev, [`${q.id}__other`]: v }));
  const showOtherFor = (selected: string | string[]) => {
    if (otherValues.size === 0) return false;
    if (Array.isArray(selected)) return selected.some((s) => otherValues.has(s));
    return otherValues.has(selected);
  };
  const OtherField = ({ show }: { show: boolean }) =>
    show ? (
      <Textarea
        value={currentOther}
        onChange={(e) => setOther(e.target.value)}
        rows={2}
        placeholder="Descreva sua resposta"
        className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm mt-2"
        maxLength={500}
      />
    ) : null;

  switch (q.question_type) {
    case 'text':
      return (
        <Textarea
          value={val ?? ''}
          onChange={(e) => set(e.target.value)}
          rows={3}
          className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500"
          aria-invalid={missing}
        />
      );
    case 'number':
      return <Input type="number" value={val ?? ''} onChange={(e) => set(Number(e.target.value))} className="bg-slate-950 border-slate-700 text-slate-100" aria-invalid={missing} />;
    case 'date':
      return <Input type="date" value={val ?? ''} onChange={(e) => set(e.target.value)} className="bg-slate-950 border-slate-700 text-slate-100" aria-invalid={missing} />;
    case 'stars':
      return (
        <div className="flex gap-1" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
              onClick={() => set(n)}
              className="text-3xl leading-none transition-transform hover:scale-110"
              style={{ color: (val ?? 0) >= n ? primary : '#334155' }}
            >
              ★
            </button>
          ))}
        </div>
      );
    case 'emoji':
      return (
        <div className="flex gap-2">
          {EMOJIS.map((emo, i) => (
            <button
              key={i}
              type="button"
              onClick={() => set(i + 1)}
              className="text-3xl transition-transform hover:scale-110 rounded-md px-2 py-1"
              style={{ background: val === i + 1 ? 'rgba(255,152,0,0.15)' : 'transparent', border: `1px solid ${val === i + 1 ? primary : 'rgba(255,255,255,0.1)'}` }}
            >
              {emo}
            </button>
          ))}
        </div>
      );
    case 'likert': {
      const labels: string[] = choices.length > 0 ? choices.map((c) => c.label) : ['1', '2', '3', '4', '5'];
      return (
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${labels.length > 5 ? Math.ceil(labels.length / 2) : labels.length}, minmax(0, 1fr))` }}>
          {labels.map((lbl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => set(i + 1)}
              className="rounded-md py-2.5 px-2 text-xs font-medium transition-all min-h-[44px]"
              style={{
                background: val === i + 1 ? primary : 'rgba(255,255,255,0.05)',
                color: val === i + 1 ? '#0f172a' : '#f1f5f9',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {lbl}
            </button>
          ))}
        </div>
      );
    }
    case 'radio':
    case 'multi_choice':
      return (
        <div className="space-y-2" role="radiogroup">
          {choices.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 p-3 rounded-md cursor-pointer hover:bg-slate-800/60 border text-slate-100" style={{ borderColor: val === opt.value ? primary : 'rgba(255,255,255,0.12)' }}>
              <input type="radio" name={q.id} checked={val === opt.value} onChange={() => set(opt.value)} className="accent-current" />
              <span>{opt.label}</span>
            </label>
          ))}
          <OtherField show={showOtherFor(val)} />
        </div>
      );
    case 'checkbox': {
      const arr: string[] = Array.isArray(val) ? val : [];
      return (
        <div className="space-y-2">
          {choices.map((opt) => {
            const checked = arr.includes(opt.value);
            return (
              <label key={opt.value} className="flex items-center gap-2 p-3 rounded-md cursor-pointer hover:bg-slate-800/60 border text-slate-100" style={{ borderColor: checked ? primary : 'rgba(255,255,255,0.12)' }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => set(e.target.checked ? [...arr, opt.value] : arr.filter((x) => x !== opt.value))}
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
          <OtherField show={showOtherFor(Array.isArray(val) ? val : [])} />
        </div>
      );
    }
    case 'dropdown':
      return (
        <div className="space-y-2">
          <select
            value={val ?? ''}
            onChange={(e) => set(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-md h-11 px-3 text-sm text-slate-100"
            aria-invalid={missing}
          >
            <option value="">Selecione…</option>
            {choices.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <OtherField show={showOtherFor(val)} />
        </div>
      );
    default:
      return <Input value={val ?? ''} onChange={(e) => set(e.target.value)} className="bg-slate-950 border-slate-700 text-slate-100" />;
  }
}
