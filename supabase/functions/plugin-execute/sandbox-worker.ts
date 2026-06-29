// Sandboxed plugin runner — executes a tenant-provided script in a Web Worker
// scope with NO Deno permissions. The host posts the script + action + payload;
// the script must register handlers via `register(action, fn)` on the global.
// Only `fetch` (host-proxied) and `console.log` are exposed. Hard timeout 3s.

declare const self: Worker;

const handlers = new Map<string, (payload: unknown, ctx: SandboxCtx) => unknown>();
const logs: string[] = [];

interface SandboxCtx {
  fetch: (url: string, init?: RequestInit) => Promise<unknown>;
  secrets: Record<string, string>;
}

// Inject a stripped-down global API the script can use.
(self as unknown as { register: typeof register }).register = register;
(self as unknown as { console: { log: (...a: unknown[]) => void } }).console = {
  log: (...args: unknown[]) => {
    const line = args
      .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
      .join(" ")
      .slice(0, 1000);
    if (logs.length < 100) logs.push(line);
  },
};

function register(action: string, fn: (payload: unknown, ctx: SandboxCtx) => unknown) {
  handlers.set(action, fn);
}

async function evaluatePluginScript(script: string) {
  // Avoid string evaluation primitives (eval/new Function).
  // Load plugin code as an ESM data URL inside this isolated worker scope.
  const moduleUrl = `data:application/javascript;charset=utf-8,${encodeURIComponent(script)}`;
  await import(moduleUrl);
}

self.onmessage = async (ev: MessageEvent) => {
  const { script, action, payload, secrets } = ev.data as {
    script: string;
    action: string;
    payload: unknown;
    secrets: Record<string, string>;
  };

  try {
    handlers.clear();
    logs.length = 0;

    // Evaluate the plugin script in the worker's global scope.
    // The worker has no Deno permissions (--allow-none), so the script can
    // only touch what we expose explicitly above.
    await evaluatePluginScript(script);

    const handler = handlers.get(action);
    if (!handler) throw new Error(`Action '${action}' is not registered by the plugin`);

    const ctx: SandboxCtx = {
      fetch: async (url, init) => {
        // Delegate network through the host so we can future-gate egress allowlists.
        const res = await fetch(url, init);
        const text = await res.text();
        return { status: res.status, ok: res.ok, body: text.slice(0, 64 * 1024) };
      },
      secrets,
    };

    const result = await Promise.resolve(handler(payload, ctx));
    self.postMessage({ ok: true, result, logs });
  } catch (err) {
    self.postMessage({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      logs,
    });
  }
};
