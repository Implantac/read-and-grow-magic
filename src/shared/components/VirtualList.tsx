/**
 * Fase 3 — VirtualList
 * Renderiza apenas as linhas visíveis usando @tanstack/react-virtual.
 * Use para listas > 200 itens (auditoria, logs, movimentos, etc).
 */
import { useRef, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

interface Props<T> {
  items: T[];
  rowHeight?: number;
  height?: number | string;
  overscan?: number;
  className?: string;
  renderRow: (item: T, index: number) => ReactNode;
  getKey?: (item: T, index: number) => string | number;
  emptyState?: ReactNode;
}

export function VirtualList<T>({
  items,
  rowHeight = 56,
  height = 480,
  overscan = 8,
  className,
  renderRow,
  getKey,
  emptyState,
}: Props<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  if (items.length === 0 && emptyState) return <>{emptyState}</>;

  return (
    <div
      ref={parentRef}
      className={cn("overflow-auto rounded-md border bg-card", className)}
      style={{ height: typeof height === "number" ? `${height}px` : height, contain: "strict" }}
    >
      <div style={{ height: virtualizer.getTotalSize(), width: "100%", position: "relative" }}>
        {virtualizer.getVirtualItems().map((v) => {
          const item = items[v.index];
          return (
            <div
              key={getKey ? getKey(item, v.index) : v.key}
              data-index={v.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${v.start}px)`,
              }}
            >
              {renderRow(item, v.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
