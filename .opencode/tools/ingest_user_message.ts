import { z } from "zod"
import extractProfilePatch from "./extract_profile_patch.ts"
import loadProfile from "./load_profile.ts"
import loadUserMemory from "./load_user_memory.ts"
import upsertUserMemory from "./upsert_user_memory.ts"

export default {
  description:
    "Single-entry user-message ingestion: extract profile updates from a free-form message, " +
    "resolve answered follow-up questions, and persist both profile and compact memory locally.",
  args: {
    message: z.string().describe("Latest user message"),
    infer_open_questions: z.boolean().default(true),
    profile_mode: z.enum(["merge", "replace"]).default("merge"),
    extra_notes: z.array(z.string()).default([]),
    extra_open_questions: z.array(z.string()).default([]),
    extra_resolved_open_questions: z.array(z.string()).default([]),
    memory_limit_chars: z.number().int().min(300).max(5000).default(1500)
  },
  async execute(
    args: {
      message: string
      infer_open_questions: boolean
      profile_mode: "merge" | "replace"
      extra_notes: string[]
      extra_open_questions: string[]
      extra_resolved_open_questions: string[]
      memory_limit_chars: number
    },
    context: { worktree?: string; directory?: string }
  ) {
    const currentProfile = await loadProfile.execute({}, context)
    const currentMemory = await loadUserMemory.execute({}, context)

    const extracted = await extractProfilePatch.execute(
      {
        message: args.message,
        infer_open_questions: args.infer_open_questions ?? true,
        current_profile: (currentProfile as any)?.exists === false ? {} : currentProfile,
        current_memory: (currentMemory as any)?.exists === false ? {} : currentMemory
      },
      context
    )

    const persisted = await upsertUserMemory.execute(
      {
        latest_user_message: args.message,
        profile_patch: extracted.profile_patch || {},
        profile_mode: args.profile_mode ?? "merge",
        notes: [...(extracted.notes || []), ...(args.extra_notes || [])],
        open_questions: [...(extracted.open_questions || []), ...(args.extra_open_questions || [])],
        resolved_open_questions: [
          ...(extracted.resolved_open_questions || []),
          ...(args.extra_resolved_open_questions || [])
        ],
        recent_entities_patch: extracted.recent_entities_patch || {},
        memory_limit_chars: args.memory_limit_chars ?? 1500
      },
      context
    )

    return {
      ok: true,
      extracted,
      persisted
    }
  }
}
