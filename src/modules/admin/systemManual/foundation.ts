// ============================================================================
// Fundamentos do sistema — barrel re-export
// Split em foundation-types / foundation-roadmap / foundation-modules
// para manter cada arquivo < 500 linhas (AUD-7).
// ============================================================================

export type {
  RoadmapPhase,
  BusinessRule,
  DailyRoutine,
  ModuleFoundation,
} from './foundation-types';

export { IMPLEMENTATION_ROADMAP } from './foundation-roadmap';
export { MODULE_FOUNDATION, getFoundation } from './foundation-modules';
