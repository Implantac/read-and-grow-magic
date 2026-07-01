/**
 * Fase 1 — Enterprise Drill-Down Hook
 *
 * Reads the entity definition from the registry and provides a normalized
 * data payload for the DrillDownDrawer. Kept intentionally light: heavy
 * queries live in the drawer's tab components (React Query, cached).
 */
import { useMemo } from "react";
import { getEntity, type EntityKey, type EntityDefinition } from "@/core/entityRegistry";

export interface DrillDownContext {
  entity: EntityDefinition | undefined;
  key: EntityKey | null;
  value?: number | string;
  delta?: { day?: number; week?: number; month?: number; year?: number };
  goal?: number;
}

export function useDrillDown(input: {
  entityKey: EntityKey | null;
  value?: number | string;
  delta?: DrillDownContext["delta"];
  goal?: number;
}): DrillDownContext {
  return useMemo(
    () => ({
      entity: input.entityKey ? getEntity(input.entityKey) : undefined,
      key: input.entityKey,
      value: input.value,
      delta: input.delta,
      goal: input.goal,
    }),
    [input.entityKey, input.value, input.delta, input.goal],
  );
}
