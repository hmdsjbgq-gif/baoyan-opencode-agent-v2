import fs from "fs/promises"
import path from "path"

export default {
  description: "Load the current student profile JSON",
  args: {},
  async execute(_: Record<string, never>, context: { worktree?: string; directory?: string }) {
    const root = context.worktree || context.directory || process.cwd()
    const file = path.join(root, "data", "student_profile.json")
    try {
      const raw = await fs.readFile(file, "utf-8")
      return JSON.parse(raw)
    } catch {
      return {
        exists: false,
        message: "student_profile.json not found or empty"
      }
    }
  }
}
