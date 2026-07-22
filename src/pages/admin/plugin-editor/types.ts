export interface PluginRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  vendor: string | null;
  version: string;
  required_modules: string[] | null;
  price_monthly: number;
  is_published: boolean;
  sandbox_script: string | null;
  manifest: Record<string, unknown> | null;
}

export interface PluginVersionRow {
  id: string;
  version: string;
  changelog: string | null;
  published_at: string;
}

export type PluginDraft = PluginRow | (Omit<PluginRow, "id"> & { id?: string });

export const BLANK: Omit<PluginRow, "id"> = {
  key: "",
  name: "",
  description: "",
  category: "general",
  vendor: "",
  version: "0.1.0",
  required_modules: [],
  price_monthly: 0,
  is_published: false,
  sandbox_script: `// Plugin sandbox script
// Use register(action, async (input, ctx) => { ... }) to expose actions.
// ctx.fetch(url, init) — proxied HTTP. ctx.secrets — installation config.
register("hello", async (input) => {
  return { ok: true, echo: input };
});
`,
  manifest: { actions: ["hello"], permissions: [] },
};
