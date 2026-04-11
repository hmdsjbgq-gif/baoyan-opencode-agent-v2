import { z } from "zod"
import fs from "fs/promises"
import path from "path"
import { parseJsoncObject, stringifyJsoncObject } from "./jsonc.ts"

const McpServerConfig = z.record(z.any())

export default {
  description: "Apply a vetted stack plan to opencode.json(c) by merging plugin and MCP entries",
  args: {
    plugins: z.array(z.string()).default([]),
    mcp: McpServerConfig.default({}),
    overwrite: z.boolean().default(false)
  },
  async execute(
    args: { plugins: string[]; mcp: Record<string, unknown>; overwrite: boolean },
    context: { worktree?: string; directory?: string }
  ) {
    const root = context.worktree || context.directory || process.cwd()
    const jsoncPath = path.join(root, "opencode.jsonc")
    const jsonPath = path.join(root, "opencode.json")

    let configPath: string | null = null
    try {
      await fs.access(jsoncPath)
      configPath = jsoncPath
    } catch {
      try {
        await fs.access(jsonPath)
        configPath = jsonPath
      } catch {
        configPath = null
      }
    }

    if (!configPath) {
      return {
        ok: false,
        reason: "no_config_found",
        message: "No opencode.json or opencode.jsonc found."
      }
    }

    let config: Record<string, unknown> = {}
    try {
      const raw = await fs.readFile(configPath, "utf-8")
      config = parseJsoncObject(raw)
    } catch {
      return {
        ok: false,
        reason: "invalid_json",
        message: "Config is not valid JSON/JSONC.",
        path: configPath
      }
    }

    const existingPlugins = Array.isArray(config.plugin) ? (config.plugin as string[]) : []
    const nextPlugins = [...existingPlugins]
    for (const plugin of args.plugins) {
      if (!nextPlugins.includes(plugin)) nextPlugins.push(plugin)
    }
    if (nextPlugins.length) config.plugin = nextPlugins

    const existingMcp =
      config.mcp && typeof config.mcp === "object" && !Array.isArray(config.mcp)
        ? (config.mcp as Record<string, unknown>)
        : {}
    const nextMcp: Record<string, unknown> = { ...existingMcp }
    for (const [name, entry] of Object.entries(args.mcp || {})) {
      if (nextMcp[name] && !args.overwrite) continue
      nextMcp[name] = entry
    }
    if (Object.keys(nextMcp).length) config.mcp = nextMcp

    await fs.writeFile(configPath, stringifyJsoncObject(config), "utf-8")

    return {
      ok: true,
      path: configPath,
      normalized_format: path.extname(configPath) === ".jsonc",
      plugins_added: args.plugins.filter(p => !existingPlugins.includes(p)),
      mcp_added: Object.keys(args.mcp || {}).filter(name => !(name in existingMcp))
    }
  }
}
