import { z } from "zod"
import fs from "fs/promises"
import path from "path"

export default {
  description: "Save or replace the student profile JSON",
  args: {
    profile: z.record(z.any()).describe("Normalized student profile object")
  },
  async execute(
    args: { profile: Record<string, unknown> },
    context: { worktree?: string; directory?: string }
  ) {
    const root = context.worktree || context.directory || process.cwd()
    const dir = path.join(root, "data")
    const file = path.join(dir, "student_profile.json")

    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(file, JSON.stringify(args.profile, null, 2), "utf-8")

    return {
      ok: true,
      path: file
    }
  }
}
