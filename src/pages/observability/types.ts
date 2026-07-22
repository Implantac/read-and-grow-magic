export type Health = {
  events: { critical: number; error: number; warning: number; info: number; total: number };
  incidents: { open: number; mitigating: number; resolved_24h: number };
  generated_at: string;
};

export type SystemEvent = {
  id: string;
  occurred_at: string;
  source: string;
  event_type: string;
  severity: "debug" | "info" | "warning" | "error" | "critical";
  message: string;
  context: Record<string, unknown>;
};

export type Incident = {
  id: string;
  title: string;
  description: string | null;
  severity: "minor" | "major" | "critical";
  status: "open" | "mitigating" | "resolved";
  source: string | null;
  opened_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
};

export type AlertRule = {
  id: string;
  name: string;
  source: string | null;
  min_severity: "info" | "warning" | "error" | "critical";
  threshold: number;
  window_minutes: number;
  incident_severity: "minor" | "major" | "critical";
  enabled: boolean;
  last_triggered_at: string | null;
};
