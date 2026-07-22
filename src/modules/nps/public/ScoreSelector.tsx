interface Props {
  score: number | null;
  setScore: (n: number) => void;
  primary: string;
  companyName: string;
  touched: boolean;
}

export function ScoreSelector({ score, setScore, primary, companyName, touched }: Props) {
  return (
    <div className="space-y-3">
      <label className="block text-[15px] sm:text-base font-semibold text-white leading-snug">
        De 0 a 10, qual a probabilidade de recomendar {companyName} a um amigo ou colega? <span className="text-red-400">*</span>
      </label>
      <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 sm:gap-1.5">
        {Array.from({ length: 11 }, (_, n) => (
          <button
            key={n}
            onClick={() => setScore(n)}
            className="rounded-lg h-11 sm:h-10 text-[15px] sm:text-sm font-semibold transition-all active:scale-95 hover:scale-105 min-w-0 flex items-center justify-center"
            aria-pressed={score === n}
            style={{
              background:
                score === n
                  ? primary
                  : n <= 6
                  ? 'rgba(239,68,68,0.08)'
                  : n <= 8
                  ? 'rgba(245,158,11,0.08)'
                  : 'rgba(16,185,129,0.08)',
              color: score === n ? '#0f172a' : '#f1f5f9',
              border: `1px solid ${score === n ? primary : 'rgba(255,255,255,0.12)'}`,
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[11px] sm:text-xs text-slate-300 px-1">
        <span>Nada provável</span>
        <span>Muito provável</span>
      </div>
      {touched && score === null && <p className="text-xs text-red-400">Por favor, escolha uma nota.</p>}
    </div>
  );
}
