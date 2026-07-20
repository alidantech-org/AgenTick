import { randomUUID } from "node:crypto";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type {
  AgentickEvent,
  AgentickEventType,
  Finding,
  FindingSeverity,
} from "@alidantech/skillib-shared";
import type { ProjectContext } from "./project.js";

export class HistoryStore {
  readonly stateDir: string;
  readonly jsonlPath: string;
  readonly sqlitePath: string;
  private database: DatabaseSync | undefined;

  constructor(
    private readonly project: ProjectContext,
    readonly sessionId = randomUUID(),
  ) {
    this.stateDir = join(project.agentsDir, ".skillib");
    this.jsonlPath = join(this.stateDir, "events.jsonl");
    this.sqlitePath = join(this.stateDir, "skillib.db");
  }

  async open(): Promise<void> {
    await mkdir(this.stateDir, { recursive: true });
    this.database = new DatabaseSync(this.sqlitePath);
    this.database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        type TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        path TEXT,
        payload_json TEXT NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS events_timestamp_idx ON events(timestamp);
      CREATE TABLE IF NOT EXISTS findings (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        severity TEXT NOT NULL,
        rule TEXT NOT NULL,
        status TEXT NOT NULL,
        path TEXT,
        message TEXT NOT NULL,
        evidence_json TEXT NOT NULL,
        suggested_action TEXT
      ) STRICT;
      CREATE INDEX IF NOT EXISTS findings_status_idx ON findings(status, severity);
    `);
  }

  async record(
    type: AgentickEventType,
    details: { path?: string; payload?: Record<string, unknown> } = {},
  ): Promise<AgentickEvent> {
    if (!this.database) await this.open();

    const event: AgentickEvent = {
      id: randomUUID(),
      sessionId: this.sessionId,
      type,
      timestamp: new Date().toISOString(),
      projectRoot: this.project.root,
      ...(details.path ? { path: details.path } : {}),
      ...(details.payload ? { payload: details.payload } : {}),
    };

    // JSONL is canonical. SQLite is a local query index that can be rebuilt.
    await appendFile(this.jsonlPath, `${JSON.stringify(event)}\n`, "utf8");
    this.database!.prepare(
      "INSERT INTO events (id, session_id, type, timestamp, path, payload_json) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(
      event.id,
      event.sessionId,
      event.type,
      event.timestamp,
      event.path ?? null,
      JSON.stringify(event.payload ?? {}),
    );
    return event;
  }

  async createFinding(input: {
    severity: FindingSeverity;
    rule: string;
    message: string;
    path?: string;
    evidence?: string[];
    suggestedAction?: string;
  }): Promise<{ finding: Finding; event: AgentickEvent }> {
    if (!this.database) await this.open();
    const finding: Finding = {
      id: randomUUID(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      severity: input.severity,
      rule: input.rule,
      message: input.message,
      status: "open",
      evidence: input.evidence ?? [],
      ...(input.path ? { path: input.path } : {}),
      ...(input.suggestedAction
        ? { suggestedAction: input.suggestedAction }
        : {}),
    };
    this.database!.prepare(
      `INSERT INTO findings
          (id, session_id, timestamp, severity, rule, status, path, message, evidence_json, suggested_action)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      finding.id,
      finding.sessionId,
      finding.timestamp,
      finding.severity,
      finding.rule,
      finding.status,
      finding.path ?? null,
      finding.message,
      JSON.stringify(finding.evidence),
      finding.suggestedAction ?? null,
    );
    const event = await this.record("finding.created", {
      ...(finding.path ? { path: finding.path } : {}),
      payload: { ...finding },
    });
    return { finding, event };
  }

  async recent(limit = 100): Promise<AgentickEvent[]> {
    try {
      const source = await readFile(this.jsonlPath, "utf8");
      return source
        .trim()
        .split("\n")
        .filter(Boolean)
        .slice(-limit)
        .map((line) => JSON.parse(line) as AgentickEvent);
    } catch {
      return [];
    }
  }

  findings(limit = 100): Finding[] {
    if (!this.database) return [];
    return this.database
      .prepare(
        `SELECT id, session_id, timestamp, severity, rule, status, path, message,
                evidence_json, suggested_action
         FROM findings ORDER BY timestamp DESC LIMIT ?`,
      )
      .all(limit)
      .map((row) => {
        const item = row as Record<string, unknown>;
        return {
          id: String(item.id),
          sessionId: String(item.session_id),
          timestamp: String(item.timestamp),
          severity: item.severity as FindingSeverity,
          rule: String(item.rule),
          status: item.status as Finding["status"],
          message: String(item.message),
          evidence: JSON.parse(String(item.evidence_json)) as string[],
          ...(item.path ? { path: String(item.path) } : {}),
          ...(item.suggested_action
            ? { suggestedAction: String(item.suggested_action) }
            : {}),
        };
      });
  }

  close(): void {
    this.database?.close();
    this.database = undefined;
  }
}
