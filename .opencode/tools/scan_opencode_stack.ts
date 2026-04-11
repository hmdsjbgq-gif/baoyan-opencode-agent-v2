import fs from "fs/promises"
import path from "path"
import os from "os"
import { parseJsoncObject } from "./jsonc.ts"

async function exists(p: string) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function readJsonIfExists(p: string) {
  try {
    const raw = await fs.readFile(p, "utf-8")
    return parseJsoncObject(raw)
  } catch {
    return null
  }
}

async function listDirNames(p: string) {
  try {
    const items = await fs.readdir(p, { withFileTypes: true })
    return items.filter(i => i.isDirectory()).map(i => i.name).sort()
  } catch {
    return []
  }
}

async function listFiles(p: string) {
  try {
    const items = await fs.readdir(p, { withFileTypes: true })
    return items.filter(i => i.isFile()).map(i => i.name).sort()
  } catch {
    return []
  }
}

export default {
  description: "Scan project-level and global OpenCode stack for plugins, agents, skills, tools, commands, and MCP config",
  args: {},
  async execute(_: Record<string, never>, context: { worktree?: string; directory?: string }) {
    const root = context.worktree || context.directory || process.cwd()
    // Cross-platform global config directory
    const globalDir =
      process.platform === "win32"
        ? path.join(process.env.APPDATA || os.homedir(), "opencode")
        : path.join(os.homedir(), ".config", "opencode")
    const projectConfig = await readJsonIfExists(path.join(root, "opencode.json")) ||
      await readJsonIfExists(path.join(root, "opencode.jsonc"))
    const globalConfig = await readJsonIfExists(path.join(globalDir, "opencode.json")) ||
      await readJsonIfExists(path.join(globalDir, "opencode.jsonc"))

    return {
      project_root: root,
      global_config_dir: globalDir,
      project: {
        has_project_config: !!projectConfig,
        plugins_declared: projectConfig?.plugin || [],
        mcp_declared: projectConfig?.mcp ? Object.keys(projectConfig.mcp) : [],
        tools_declared: projectConfig?.tools ? Object.keys(projectConfig.tools) : [],
        agent_declared: projectConfig?.agent ? Object.keys(projectConfig.agent) : [],
        local_plugins: await listFiles(path.join(root, ".opencode", "plugins")),
        local_agents: await listFiles(path.join(root, ".opencode", "agents")),
        local_skills: await listDirNames(path.join(root, ".opencode", "skills")),
        local_tools: await listFiles(path.join(root, ".opencode", "tools")),
        local_commands: await listFiles(path.join(root, ".opencode", "commands"))
      },
      global: {
        has_global_config: !!globalConfig,
        plugins_declared: globalConfig?.plugin || [],
        mcp_declared: globalConfig?.mcp ? Object.keys(globalConfig.mcp) : [],
        tools_declared: globalConfig?.tools ? Object.keys(globalConfig.tools) : [],
        agent_declared: globalConfig?.agent ? Object.keys(globalConfig.agent) : [],
        global_plugins_dir_exists: await exists(path.join(globalDir, "plugins")),
        global_agents_dir_exists: await exists(path.join(globalDir, "agents"))
      }
    }
  }
}
