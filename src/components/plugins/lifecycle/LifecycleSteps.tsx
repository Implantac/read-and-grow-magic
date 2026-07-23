import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import type { Step } from "./constants";

export function LifecycleSteps({ steps }: { steps: Step[] }) {
  if (steps.length === 0) return null;
  return (
    <div className="rounded border divide-y">
      {steps.map((s) => (
        <div key={s.key} className="flex items-center gap-2 px-3 py-2 text-sm">
          {s.status === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          {s.status === "running" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          {s.status === "pending" && <Circle className="h-4 w-4 text-muted-foreground/50" />}
          {s.status === "error" && <XCircle className="h-4 w-4 text-destructive" />}
          <span className={s.status === "pending" ? "text-muted-foreground" : ""}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}
