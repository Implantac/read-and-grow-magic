/**
 * PCP Services barrel — re-exports from split modules in `./pcp/*`.
 * Kept for backward compatibility with existing imports.
 */
export * from './pcp/types';
export { MRPService } from './pcp/mrp';
export { SchedulingService } from './pcp/scheduling';
export { SimulationService } from './pcp/simulation';
export { PCPMetricsService } from './pcp/metrics';
export { PriorityEngineService } from './pcp/priority';
export { WarModeService, type WarModeResult } from './pcp/warmode';
export { BottleneckDetectionService } from './pcp/bottleneck';
export { SuggestionEngine, type SmartSuggestion } from './pcp/suggestions';
export { KanbanService } from './pcp/kanban';
