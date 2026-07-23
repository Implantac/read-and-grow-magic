import type { Database } from '@/integrations/supabase/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BrainJson = Record<string, any>;

export interface BrainDecision {
  id: string;
  module: string;
  decision_type: string;
  title: string;
  rationale: string;
  impact_level: 'low' | 'medium' | 'high' | 'critical';
  risk_level: 'low' | 'medium' | 'high';
  confidence: number;
  evidence: BrainJson;
  proposed_action: BrainJson;
  status: string;
  auto_executable: boolean;
  requires_approval: boolean;
  execution_result: BrainJson;
  created_at: string;
}

export interface BrainMemory {
  id: string;
  category: string;
  key: string;
  value: BrainJson;
  importance: number;
  scope: string;
  updated_at: string;
}

export interface BrainRun {
  id: string;
  trigger: string;
  mode: string;
  synthesis: string | null;
  structured: BrainJson;
  decisions_count: number;
  duration_ms: number | null;
  status: string;
  created_at: string;
}

export interface BrainChatAction {
  tool: string;
  args: BrainJson;
  result: BrainJson;
}

export interface BrainChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: BrainChatAction[];
}

export interface SaveMemoryInput {
  category: string;
  key: string;
  value: BrainJson;
  importance?: number;
  scope?: string;
}

export interface LearningStats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  autoExecuted: number;
  executed: number;
  approvalRate: number;
  rejectionRate: number;
  avgConfidence: number;
  byModule: Array<{ module: string; total: number; approved: number; rejected: number; auto: number }>;
  calibration: Array<{ bucket: string; declared: number; actual: number; n: number }>;
  recentRejected: BrainDecision[];
  topMemories: BrainMemory[];
}

export type DecisionRow = Database['public']['Tables']['ai_brain_decisions']['Row'];
export type MemoryRow = Database['public']['Tables']['ai_brain_memory']['Row'];
export type RunRow = Database['public']['Tables']['ai_brain_runs']['Row'];
