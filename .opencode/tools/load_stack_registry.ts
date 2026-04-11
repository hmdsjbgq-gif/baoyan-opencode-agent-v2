import fs from "fs/promises"
import path from "path"

export default {
  description: "Load the curated stack registry for the baoyan advisor project",
  args: {},
  async execute(_: Record<string, never>, context: { worktree?: string; directory?: string }) {
    const root = context.worktree || context.directory || process.cwd()
    const file = path.join(root, "data", "stack_registry.json")
    const raw = await fs.readFile(file, "utf-8")
    return JSON.parse(raw)
  }
}
