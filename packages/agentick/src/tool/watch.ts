import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join, matchesGlob, relative, resolve } from "node:path";
import chokidar from "chokidar";
import Fastify from "fastify";
import type { AgentickEvent } from "@alidantech/agentick-shared";
import { discoverProject, loadProjectConfig } from "./project.js";
import { HistoryStore } from "./history.js";

export interface WatchRuntime {
  close(): Promise<void>;
  url: string;
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.\//, "");
}

function matchesAny(path: string, patterns: readonly string[]): boolean {
  const normalized = normalizePath(path);
  return patterns.some((pattern) =>
    matchesGlob(normalized, normalizePath(pattern)),
  );
}

function bytesIntegrity(content: Uint8Array): string {
  return `sha512-${createHash("sha512").update(content).digest("base64")}`;
}

export async function watchProject(
  cwd = process.cwd(),
  portOverride?: number,
): Promise<WatchRuntime> {
  const project = await discoverProject(cwd);
  const config = await loadProjectConfig(project);
  const history = new HistoryStore(project);
  await history.open();
  const clients = new Set<(event: AgentickEvent) => void>();

  const publish = (event: AgentickEvent): void => {
    for (const send of clients) send(event);
  };

  const recordFileEvent = async (
    type: "file.added" | "file.changed" | "file.removed",
    watchedPath: string,
  ): Promise<void> => {
    const relativePath = normalizePath(
      relative(project.root, resolve(project.root, watchedPath)),
    );
    const event = await history.record(type, { path: relativePath });
    publish(event);

    if (matchesAny(relativePath, config.agents.protected)) {
      const recent = (await history.recent(100)).reverse();
      const permit = recent.find(
        (candidate) =>
          candidate.type === "tool.write.planned" &&
          candidate.path === relativePath &&
          Date.now() - Date.parse(candidate.timestamp) < 30_000,
      );
      let permitted = type === "file.removed" && Boolean(permit);
      const expectedIntegrity = permit?.payload?.integrity;
      if (!permitted && typeof expectedIntegrity === "string") {
        try {
          const current = await readFile(join(project.root, relativePath));
          permitted = bytesIntegrity(current) === expectedIntegrity;
        } catch {
          permitted = false;
        }
      }

      if (!permitted) {
        const { event: findingEvent } = await history.createFinding({
          severity: "critical",
          rule: "agents.protected-file-changed",
          path: relativePath,
          message: `Protected project instruction changed during an active watch session: ${relativePath}`,
          evidence: [type],
          suggestedAction:
            "Restore the protected file or record a separately authorized governance change.",
        });
        publish(findingEvent);
      }
    }
  };

  const watcher = chokidar.watch(config.watch.include, {
    cwd: project.root,
    ignored: config.watch.ignore,
    ignoreInitial: true,
    persistent: true,
  });
  watcher.on("add", (path) => void recordFileEvent("file.added", path));
  watcher.on("change", (path) => void recordFileEvent("file.changed", path));
  watcher.on("unlink", (path) => void recordFileEvent("file.removed", path));

  const server = Fastify({ logger: false });
  server.get("/health", async () => ({
    ok: true,
    project: config.project.name,
    sessionId: history.sessionId,
  }));
  server.get("/api/events", async () => ({
    events: await history.recent(200),
  }));
  server.get("/api/findings", async () => ({
    findings: history.findings(200),
  }));
  server.get("/events", async (_request, reply) => {
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");
    const send = (event: AgentickEvent): void => {
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    };
    clients.add(send);
    reply.raw.on("close", () => clients.delete(send));
    return reply.hijack();
  });
  server.get("/", async (_request, reply) =>
    reply.type("text/html").send(`<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>AgenTick</title><style>
body{font-family:ui-sans-serif,system-ui;margin:0;background:#0b1020;color:#e8ecf4}
main{max-width:1040px;margin:auto;padding:40px}h1{font-size:40px;margin:0}.muted{color:#9ba7bd}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.card{background:#121a2d;border:1px solid #27314a;border-radius:16px;padding:20px;margin-top:24px}
li{padding:10px 0;border-bottom:1px solid #27314a;font-family:ui-monospace,monospace;font-size:13px}.critical{color:#ff8e8e}
@media(max-width:760px){.grid{grid-template-columns:1fr}}
</style></head><body><main><h1>AgenTick ✅</h1><p class="muted">Watching ${config.project.name}</p>
<div class="grid"><div class="card"><strong>Live events</strong><ul id="events"></ul></div>
<div class="card"><strong>Open findings</strong><ul id="findings"></ul></div></div></main>
<script>
const events=document.getElementById('events');const findings=document.getElementById('findings');
function addEvent(e){const li=document.createElement('li');li.textContent=e.timestamp+'  '+e.type+'  '+(e.path||'');events.prepend(li);while(events.children.length>100)events.lastChild.remove();}
function addFinding(f){const li=document.createElement('li');li.className=f.severity;li.textContent=f.severity.toUpperCase()+'  '+f.rule+'  '+(f.path||'')+' — '+f.message;findings.prepend(li);}
fetch('/api/events').then(r=>r.json()).then(x=>x.events.forEach(addEvent));fetch('/api/findings').then(r=>r.json()).then(x=>x.findings.forEach(addFinding));
const stream=new EventSource('/events');stream.onmessage=e=>{const event=JSON.parse(e.data);addEvent(event);if(event.type==='finding.created'&&event.payload)addFinding(event.payload);};
</script></body></html>`),
  );

  const port = portOverride ?? config.runtime.port;
  await server.listen({ host: config.runtime.host, port });
  await history.record("session.started", { payload: { port } });

  return {
    url: `http://${config.runtime.host}:${port}`,
    async close() {
      await history.record("session.stopped");
      await watcher.close();
      await server.close();
      history.close();
    },
  };
}
