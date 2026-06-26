import { useMemo } from "react";
import type { WorkflowStep } from "@/hooks/useWorkflowEngine";

interface Props {
  steps: WorkflowStep[];
  currentStepKey?: string | null;
}

interface Node {
  key: string;
  label: string;
  type: string;
  x: number;
  y: number;
}

interface Edge {
  from: string;
  to: string;
  label?: string;
  conditional?: boolean;
}

/**
 * Visualizador SVG puro de um workflow: layout em camadas via BFS a partir
 * do primeiro step. Mostra arestas padrão (next) e condicionais (branches).
 */
export function WorkflowGraph({ steps, currentStepKey }: Props) {
  const { nodes, edges, width, height } = useMemo(() => {
    if (!steps.length) return { nodes: [], edges: [], width: 400, height: 100 };

    // BFS layering
    const byKey = new Map(steps.map((s) => [s.key, s]));
    const depth = new Map<string, number>();
    const queue: Array<{ k: string; d: number }> = [{ k: steps[0].key, d: 0 }];
    while (queue.length) {
      const { k, d } = queue.shift()!;
      if (depth.has(k)) continue;
      depth.set(k, d);
      const s = byKey.get(k);
      if (!s) continue;
      const targets = [
        ...(s.next ? [s.next] : []),
        ...(s.branches ?? []).map((b) => b.next),
      ].filter(Boolean);
      for (const t of targets) {
        if (!depth.has(t) && byKey.has(t)) queue.push({ k: t, d: d + 1 });
      }
    }
    // unreached nodes go to last layer
    const maxD = Math.max(0, ...Array.from(depth.values()));
    steps.forEach((s) => {
      if (!depth.has(s.key)) depth.set(s.key, maxD + 1);
    });

    // group by depth
    const layers = new Map<number, string[]>();
    steps.forEach((s) => {
      const d = depth.get(s.key) ?? 0;
      const arr = layers.get(d) ?? [];
      arr.push(s.key);
      layers.set(d, arr);
    });

    const colW = 220;
    const rowH = 90;
    const nodeW = 170;
    const nodeH = 60;
    const nodes: Node[] = [];
    const sortedLayers = Array.from(layers.entries()).sort((a, b) => a[0] - b[0]);
    sortedLayers.forEach(([d, keys]) => {
      keys.forEach((k, i) => {
        const s = byKey.get(k)!;
        nodes.push({
          key: k,
          label: s.label || k,
          type: s.type ?? "task",
          x: 20 + d * colW,
          y: 20 + i * rowH,
        });
      });
    });

    const edges: Edge[] = [];
    steps.forEach((s) => {
      if (s.next && byKey.has(s.next)) edges.push({ from: s.key, to: s.next });
      (s.branches ?? []).forEach((b) => {
        if (b.next && byKey.has(b.next))
          edges.push({ from: s.key, to: b.next, label: b.label, conditional: true });
      });
    });

    const width = Math.max(...nodes.map((n) => n.x + nodeW + 20), 400);
    const height = Math.max(...nodes.map((n) => n.y + nodeH + 20), 120);
    return { nodes, edges, width, height };
  }, [steps]);

  if (!steps.length) {
    return <p className="text-sm text-muted-foreground">Nenhuma etapa para visualizar.</p>;
  }

  const nodeMap = new Map(nodes.map((n) => [n.key, n]));
  const nodeW = 170;
  const nodeH = 60;

  return (
    <div className="overflow-auto border rounded bg-card/30">
      <svg width={width} height={height} className="block">
        <defs>
          <marker
            id="arrow"
            viewBox="0 -5 10 10"
            refX="8"
            refY="0"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,-5L10,0L0,5" className="fill-muted-foreground" />
          </marker>
          <marker
            id="arrow-cond"
            viewBox="0 -5 10 10"
            refX="8"
            refY="0"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,-5L10,0L0,5" className="fill-primary" />
          </marker>
        </defs>
        {edges.map((e, i) => {
          const a = nodeMap.get(e.from);
          const b = nodeMap.get(e.to);
          if (!a || !b) return null;
          const x1 = a.x + nodeW;
          const y1 = a.y + nodeH / 2;
          const x2 = b.x;
          const y2 = b.y + nodeH / 2;
          const mx = (x1 + x2) / 2;
          const d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
          return (
            <g key={i}>
              <path
                d={d}
                fill="none"
                className={e.conditional ? "stroke-primary" : "stroke-muted-foreground"}
                strokeWidth={e.conditional ? 2 : 1.5}
                strokeDasharray={e.conditional ? "4 3" : undefined}
                markerEnd={e.conditional ? "url(#arrow-cond)" : "url(#arrow)"}
              />
              {e.label && (
                <text
                  x={mx}
                  y={(y1 + y2) / 2 - 4}
                  textAnchor="middle"
                  className="fill-primary text-[10px]"
                >
                  {e.label}
                </text>
              )}
            </g>
          );
        })}
        {nodes.map((n) => {
          const isCurrent = n.key === currentStepKey;
          return (
            <g key={n.key} transform={`translate(${n.x},${n.y})`}>
              <rect
                width={nodeW}
                height={nodeH}
                rx={8}
                className={
                  isCurrent
                    ? "fill-primary/20 stroke-primary"
                    : "fill-card stroke-border"
                }
                strokeWidth={isCurrent ? 2 : 1}
              />
              <text x={10} y={22} className="fill-foreground text-xs font-medium">
                {n.label.length > 22 ? n.label.slice(0, 21) + "…" : n.label}
              </text>
              <text x={10} y={42} className="fill-muted-foreground text-[10px]">
                {n.type} · {n.key}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
