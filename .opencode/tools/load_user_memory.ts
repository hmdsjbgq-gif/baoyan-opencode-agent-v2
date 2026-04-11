import fs from "fs/promises"
import path from "path"

const DEFAULT_MEMORY = {
  _schema: {
    description:
      "对话级本地记忆。memory_text 为给 agent 直接复用的压缩摘要，默认限制 1500 字符；" +
      "每次用户提问后增量更新，超限时按优先级提炼。recent_entities 用于多轮指代解析。",
    memory_limit_chars: 1500
  },
  memory_limit_chars: 1500,
  last_updated: "",
  turn_count: 0,
  notes: [],
  recent_questions: [],
  open_questions: [],
  recent_entities: {
    last_target_school: "",
    last_target_mentor: "",
    last_direction: "",
    last_city: "",
    recent_target_schools: [],
    recent_target_mentors: [],
    recent_directions: [],
    recent_cities: []
  },
  memory_text: ""
}

export default {
  description: "Load the local compact conversation memory for the current student",
  args: {},
  async execute(_: Record<string, never>, context: { worktree?: string; directory?: string }) {
    const root = context.worktree || context.directory || process.cwd()
    const file = path.join(root, "data", "user_memory.json")
    try {
      const raw = await fs.readFile(file, "utf-8")
      return JSON.parse(raw)
    } catch {
      return {
        ...DEFAULT_MEMORY,
        exists: false,
        path: file
      }
    }
  }
}
