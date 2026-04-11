import { z } from "zod"
import fs from "fs/promises"
import path from "path"

type RegistryComponent = {
  id: string
  type: string
  auto_apply?: boolean
  plugin_name?: string
  mcp_config?: Record<string, unknown>
  install_hint?: string
  repo_url?: string
  docs_url?: string
  app_url?: string
  notes?: string
}

export default {
  description: "Build an auto-apply plan from stack registry and selected component ids",
  args: {
    component_ids: z.array(z.string()).default([])
  },
  async execute(
    args: { component_ids: string[] },
    context: { worktree?: string; directory?: string }
  ) {
    const root = context.worktree || context.directory || process.cwd()
    const registryPath = path.join(root, "data", "stack_registry.json")
    const raw = await fs.readFile(registryPath, "utf-8")
    const registry = JSON.parse(raw) as { components: RegistryComponent[] }

    const selected = new Set(args.component_ids)
    const plugins: string[] = []
    const mcp: Record<string, unknown> = {}
    const manual: Array<{
      id: string
      install_hint?: string
      repo_url?: string
      docs_url?: string
      app_url?: string
      notes?: string
    }> = []

    for (const c of registry.components || []) {
      if (!selected.has(c.id)) continue
      if (c.auto_apply) {
        if (c.plugin_name) plugins.push(c.plugin_name)
        if (c.mcp_config && typeof c.mcp_config === "object") {
          for (const [name, entry] of Object.entries(c.mcp_config)) {
            mcp[name] = entry
          }
        }
      } else {
        manual.push({
          id: c.id,
          install_hint: c.install_hint,
          repo_url: c.repo_url,
          docs_url: c.docs_url,
          app_url: c.app_url,
          notes: c.notes
        })
      }
    }

    return {
      plugins,
      mcp,
      manual
    }
  }
}
