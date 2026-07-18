export type AgentickEventType =
  | "session.started"
  | "session.stopped"
  | "file.added"
  | "file.changed"
  | "file.removed"
  | "verification.started"
  | "verification.finished"
  | "command.started"
  | "command.finished"
  | "finding.created"
  | "finding.updated"
  | "project.initialized"
  | "tool.write.planned"
  | "tool.write.completed"
  | "skill.pulled"
  | "skill.published"
  | "skill.declared"
  | "skill.removed"
  | "registry.login"
  | "registry.logout";

export interface AgentickEvent {
  id: string;
  sessionId: string;
  type: AgentickEventType;
  timestamp: string;
  projectRoot: string;
  path?: string;
  payload?: Record<string, unknown>;
}

export type FindingSeverity = "info" | "warning" | "error" | "critical";
export type FindingStatus =
  | "open"
  | "accepted"
  | "fixed"
  | "disputed"
  | "blocked"
  | "waived";

export interface Finding {
  id: string;
  sessionId: string;
  timestamp: string;
  severity: FindingSeverity;
  rule: string;
  message: string;
  status: FindingStatus;
  path?: string;
  evidence: string[];
  suggestedAction?: string;
  response?: string;
}
