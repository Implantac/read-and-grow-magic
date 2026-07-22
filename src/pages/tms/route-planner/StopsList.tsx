import { GripVertical } from 'lucide-react';
import { StopRow } from './StopRow';

type Props = {
  stops: any[];
  route: any;
  feasibilityMap: Record<string, any>;
  dragIndex: number | null;
  overIndex: number | null;
  setDragIndex: (v: number | null) => void;
  setOverIndex: (v: number | null) => void;
  onMove: (idx: number, dir: -1 | 1) => void;
  onStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onDrop: (idx: number) => void;
};

export function StopsList({
  stops, feasibilityMap, dragIndex, overIndex,
  setDragIndex, setOverIndex, onMove, onStatus, onDelete, onDrop,
}: Props) {
  if (stops.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        Nenhuma parada cadastrada. Adicione a primeira para começar a planejar a rota.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-1">
        Arraste pelo ícone <GripVertical className="inline h-3 w-3" /> para reordenar — o mapa atualiza automaticamente.
      </p>
      {stops.map((s, idx) => (
        <StopRow
          key={s.id}
          stop={s}
          late={feasibilityMap[s.id]?.status === 'late'}
          canUp={idx > 0}
          canDown={idx < stops.length - 1}
          onUp={() => onMove(idx, -1)}
          onDown={() => onMove(idx, 1)}
          onStatus={(status) => onStatus(s.id, status)}
          onDelete={() => onDelete(s.id)}
          isDragging={dragIndex === idx}
          isOver={overIndex === idx && dragIndex !== null && dragIndex !== idx}
          onDragStart={() => setDragIndex(idx)}
          onDragOver={(e) => { e.preventDefault(); if (overIndex !== idx) setOverIndex(idx); }}
          onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
          onDrop={() => onDrop(idx)}
        />
      ))}
    </div>
  );
}
