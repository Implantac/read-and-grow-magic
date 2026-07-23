import { useEffect, useRef } from "react";
import { levelColor, type LogLine } from "./constants";

export function LifecycleLogs({ logs }: { logs: LogLine[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-muted-foreground">Logs detalhados</span>
        <span className="text-xs text-muted-foreground">
          {logs.length} entrada{logs.length === 1 ? "" : "s"}
        </span>
      </div>
      <div
        ref={ref}
        className="h-48 overflow-auto rounded border bg-muted/30 p-2 font-mono text-[11px] space-y-0.5"
      >
        {logs.length === 0 ? (
          <p className="text-muted-foreground italic">Aguardando início da operação...</p>
        ) : (
          logs.map((l, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-muted-foreground shrink-0">
                {new Date(l.ts).toLocaleTimeString("pt-BR")}
              </span>
              <span className={levelColor(l.level)}>[{l.level.toUpperCase()}]</span>
              <span className="break-words">{l.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
