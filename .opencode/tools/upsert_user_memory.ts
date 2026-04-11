import { z } from "zod"
import fs from "fs/promises"
import path from "path"
import mergeProfile from "./merge_profile.ts"
import saveProfile from "./save_profile.ts"
import loadProfile from "./load_profile.ts"

const STAGE_VALUES = ["early_prep", "summer_camp", "pre_recommendation", "offer_choice"] as const
type StageValue = typeof STAGE_VALUES[number]

type Profile = Record<string, any>
type MemoryStore = {
  _schema: {
    description: string
    memory_limit_chars: number
  }
  memory_limit_chars: number
  last_updated: string
  turn_count: number
  notes: string[]
  recent_questions: string[]
  open_questions: string[]
  recent_entities: {
    last_target_school: string
    last_target_mentor: string
    last_direction: string
    last_city: string
    recent_target_schools: string[]
    recent_target_mentors: string[]
    recent_directions: string[]
    recent_cities: string[]
  }
  memory_text: string
}

const DEFAULT_MEMORY_STORE: MemoryStore = {
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

const ArgsSchema = {
  profile_patch: z.record(z.any()).default({}),
  profile_mode: z.enum(["merge", "replace"]).default("merge"),
  latest_user_message: z.string().optional(),
  notes: z.array(z.string()).default([]),
  open_questions: z.array(z.string()).default([]),
  resolved_open_questions: z.array(z.string()).default([]),
  recent_entities_patch: z
    .object({
      last_target_school: z.string().optional(),
      last_target_mentor: z.string().optional(),
      last_direction: z.string().optional(),
      last_city: z.string().optional(),
      recent_target_schools: z.array(z.string()).optional(),
      recent_target_mentors: z.array(z.string()).optional(),
      recent_directions: z.array(z.string()).optional(),
      recent_cities: z.array(z.string()).optional()
    })
    .default({}),
  memory_limit_chars: z.number().int().min(300).max(5000).default(1500)
}

type SectionKey =
  | "identity"
  | "academic"
  | "experience"
  | "preferences"
  | "targets"
  | "progress"
  | "notes"
  | "recent_questions"
  | "open_questions"

function cleanText(value: unknown) {
  if (typeof value !== "string") return ""
  return value.replace(/\s+/g, " ").trim()
}

function truncateText(value: string, maxChars: number) {
  if (value.length <= maxChars) return value
  if (maxChars <= 1) return value.slice(0, maxChars)
  return `${value.slice(0, maxChars - 1)}…`
}

function uniquePush(existing: string[], incoming: string[], maxItems: number, perItemLimit = 80) {
  const next = [...existing]
  for (const item of incoming) {
    const normalized = truncateText(cleanText(item), perItemLimit)
    if (!normalized) continue
    const existingIndex = next.findIndex(v => v === normalized)
    if (existingIndex >= 0) next.splice(existingIndex, 1)
    next.push(normalized)
  }
  return next.slice(-maxItems)
}

function overwriteEntityList(existing: string[], incoming: string[] | undefined, maxItems = 5) {
  if (!Array.isArray(incoming) || incoming.length === 0) return existing
  return uniquePush([], incoming, maxItems, 80)
}

function removeResolved(existing: string[], resolved: string[]) {
  const normalizedResolved = resolved.map(cleanText).filter(Boolean)
  if (!normalizedResolved.length) return existing

  return existing.filter(item => {
    const normalizedItem = cleanText(item)
    return !normalizedResolved.some(
      resolvedItem =>
        normalizedItem === resolvedItem ||
        normalizedItem.includes(resolvedItem) ||
        resolvedItem.includes(normalizedItem)
    )
  })
}

function hasArrayValue(value: unknown) {
  return Array.isArray(value) && value.some(item => {
    if (typeof item === "string") return cleanText(item)
    if (item && typeof item === "object") return Object.values(item).some(v => cleanText(String(v)))
    return false
  })
}

function hasAnyEnglishScore(english: Record<string, unknown> | undefined) {
  if (!english || typeof english !== "object") return false
  return Object.values(english).some(value => cleanText(value))
}

function hasMaterialsInfo(materials: Record<string, unknown> | undefined) {
  if (!materials || typeof materials !== "object") return false
  return Object.values(materials).some(value => typeof value === "boolean")
}

function normalizeStage(value: unknown): StageValue | "" {
  const raw = cleanText(value)
  if (!raw) return ""
  if ((STAGE_VALUES as readonly string[]).includes(raw)) return raw as StageValue

  if (raw.includes("夏令营")) return "summer_camp"
  if (raw.includes("预推") || raw.includes("九推")) return "pre_recommendation"
  if (raw.includes("offer") || raw.includes("择校") || raw.includes("决策")) return "offer_choice"
  if (raw.includes("准备") || raw.includes("前期") || raw.includes("早期")) return "early_prep"
  return ""
}

function computeMissingFields(profile: Profile) {
  const missing: string[] = []
  const english = profile.academic?.english
  const materialsReady = profile.application_state?.materials_ready

  if (!cleanText(profile.basic?.school)) missing.push("本科院校")
  if (!cleanText(profile.basic?.major)) missing.push("专业")
  if (!cleanText(profile.basic?.grade)) missing.push("当前年级")
  if (!cleanText(profile.academic?.gpa)) missing.push("GPA")
  if (!cleanText(profile.academic?.rank)) missing.push("专业排名")
  if (!cleanText(profile.academic?.rank_percent)) missing.push("排名百分比")
  if (!hasAnyEnglishScore(english)) missing.push("英语成绩")
  if (
    !hasArrayValue(profile.experience?.research) &&
    !hasArrayValue(profile.experience?.projects) &&
    !hasArrayValue(profile.experience?.competitions)
  ) {
    missing.push("科研/项目/竞赛经历")
  }
  if (!hasArrayValue(profile.preferences?.degree_type)) missing.push("学位偏好")
  if (!hasArrayValue(profile.preferences?.cities)) missing.push("城市偏好")
  if (!cleanText(profile.preferences?.career_goal)) missing.push("职业目标")
  if (!cleanText(profile.current_stage)) missing.push("当前申请阶段")
  if (!hasMaterialsInfo(materialsReady)) {
    missing.push("材料准备情况")
  }

  return missing
}

function summarizeEnglish(english: Record<string, unknown> | undefined) {
  if (!english || typeof english !== "object") return ""
  const pairs = [
    ["CET4", cleanText(english.cet4)],
    ["CET6", cleanText(english.cet6)],
    ["TOEFL", cleanText(english.toefl)],
    ["IELTS", cleanText(english.ielts)]
  ].filter(([, value]) => value)

  if (!pairs.length) return ""
  return `英语：${pairs.map(([label, value]) => `${label}${value}`).join(" / ")}`
}

function summarizeItems(items: unknown[], formatter: (item: any) => string, maxItems = 2) {
  if (!Array.isArray(items)) return []
  return items
    .map(item => formatter(item))
    .map(cleanText)
    .filter(Boolean)
    .slice(0, maxItems)
}

function summarizeMaterials(materials: Record<string, unknown> | undefined) {
  if (!materials || typeof materials !== "object") return ""
  const ready = Object.entries(materials)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => {
      if (key === "cv") return "CV"
      if (key === "ps") return "PS"
      if (key === "cold_email_ready") return "套磁信"
      if (key === "transcript") return "成绩单"
      return key
    })

  if (!ready.length) return "材料：待补充"
  return `材料已就绪：${ready.join("、")}`
}

function buildProfileSections(profile: Profile): Record<SectionKey, string[]> {
  const identity: string[] = []
  const academic: string[] = []
  const experience: string[] = []
  const preferences: string[] = []
  const targets: string[] = []
  const progress: string[] = []

  const school = cleanText(profile.basic?.school)
  const major = cleanText(profile.basic?.major)
  const grade = cleanText(profile.basic?.grade)
  if (school || major || grade) {
    identity.push(
      [school, major, grade].filter(Boolean).join(" / ")
    )
  }

  const gpa = cleanText(profile.academic?.gpa)
  const rank = cleanText(profile.academic?.rank)
  const rankPercent = cleanText(profile.academic?.rank_percent)
  if (gpa || rank || rankPercent) {
    academic.push(
      [
        gpa ? `GPA ${gpa}` : "",
        rank ? `排名 ${rank}` : "",
        rankPercent ? `前 ${rankPercent}` : ""
      ].filter(Boolean).join("；")
    )
  }

  const englishSummary = summarizeEnglish(profile.academic?.english)
  if (englishSummary) academic.push(englishSummary)

  experience.push(
    ...summarizeItems(
      profile.experience?.research,
      item => `科研：${cleanText(item?.title)}${cleanText(item?.role) ? `（${cleanText(item.role)}）` : ""}`
    )
  )
  experience.push(
    ...summarizeItems(
      profile.experience?.projects,
      item => `项目：${cleanText(item?.title)}${cleanText(item?.stack) ? `（${cleanText(item.stack)}）` : ""}`
    )
  )
  experience.push(
    ...summarizeItems(
      profile.experience?.competitions,
      item => `竞赛：${cleanText(item?.name)}${cleanText(item?.award) ? `（${cleanText(item.award)}）` : ""}`
    )
  )
  if (Array.isArray(profile.experience?.awards) && profile.experience.awards.length) {
    experience.push(`奖项：${profile.experience.awards.slice(0, 3).map(cleanText).filter(Boolean).join("、")}`)
  }

  if (Array.isArray(profile.preferences?.cities) && profile.preferences.cities.length) {
    preferences.push(`城市：${profile.preferences.cities.map(cleanText).filter(Boolean).join("、")}`)
  }
  if (Array.isArray(profile.preferences?.target_directions) && profile.preferences.target_directions.length) {
    preferences.push(`方向：${profile.preferences.target_directions.map(cleanText).filter(Boolean).join("、")}`)
  }
  if (Array.isArray(profile.preferences?.degree_type) && profile.preferences.degree_type.length) {
    preferences.push(`学位：${profile.preferences.degree_type.map(cleanText).filter(Boolean).join("、")}`)
  }
  if (cleanText(profile.preferences?.career_goal)) {
    preferences.push(`目标：${cleanText(profile.preferences.career_goal)}`)
  }
  if (Array.isArray(profile.preferences?.family_constraints) && profile.preferences.family_constraints.length) {
    preferences.push(`约束：${profile.preferences.family_constraints.map(cleanText).filter(Boolean).join("；")}`)
  }

  targets.push(
    ...summarizeItems(
      profile.application_state?.target_schools,
      item =>
        `院校：${cleanText(item?.name)}${cleanText(item?.tier) ? `（${cleanText(item.tier)}` : ""}${
          cleanText(item?.status) ? ` / ${cleanText(item.status)}` : ""
        }${cleanText(item?.tier) ? "）" : ""}`
    , 4)
  )
  targets.push(
    ...summarizeItems(
      profile.application_state?.target_mentors,
      item =>
        `导师：${cleanText(item?.name)}${cleanText(item?.school) ? `（${cleanText(item.school)}` : ""}${
          cleanText(item?.direction) ? ` / ${cleanText(item.direction)}` : ""
        }${cleanText(item?.status) ? ` / ${cleanText(item.status)}` : ""}${cleanText(item?.school) ? "）" : ""}`
    , 4)
  )

  const normalizedStage = normalizeStage(profile.current_stage)
  if (normalizedStage) progress.push(`阶段：${normalizedStage}`)
  if (typeof profile.application_round === "number") progress.push(`迭代轮次：${profile.application_round}`)

  const materialsSummary = summarizeMaterials(profile.application_state?.materials_ready)
  if (materialsSummary) progress.push(materialsSummary)

  if (Array.isArray(profile.risk_flags) && profile.risk_flags.length) {
    progress.push(`风险：${profile.risk_flags.slice(0, 3).map(cleanText).filter(Boolean).join("；")}`)
  }

  return {
    identity,
    academic,
    experience: experience.filter(Boolean),
    preferences,
    targets,
    progress,
    notes: [],
    recent_questions: [],
    open_questions: []
  }
}

function renderSections(
  sections: Record<SectionKey, string[]>,
  counts: Record<SectionKey, number>,
  perItemLimit: number
) {
  const labels: Record<SectionKey, string> = {
    identity: "画像",
    academic: "学业",
    experience: "经历",
    preferences: "偏好",
    targets: "目标",
    progress: "进度",
    notes: "补充记忆",
    recent_questions: "最近提问",
    open_questions: "待确认"
  }

  const order: SectionKey[] = [
    "identity",
    "academic",
    "experience",
    "preferences",
    "targets",
    "progress",
    "notes",
    "recent_questions",
    "open_questions"
  ]

  return order
    .map(key => {
      const items = sections[key]
        .slice(0, counts[key])
        .map(item => truncateText(cleanText(item), perItemLimit))
        .filter(Boolean)
      if (!items.length) return ""
      return `${labels[key]}：${items.join("；")}`
    })
    .filter(Boolean)
    .join("\n")
}

function compactMemoryText(sections: Record<SectionKey, string[]>, limit: number) {
  const keys = Object.keys(sections) as SectionKey[]
  const counts = keys.reduce(
    (acc, key) => {
      acc[key] = sections[key].length
      return acc
    },
    {} as Record<SectionKey, number>
  )
  const minCounts: Record<SectionKey, number> = {
    identity: Math.min(1, counts.identity),
    academic: 0,
    experience: 0,
    preferences: 0,
    targets: 0,
    progress: Math.min(1, counts.progress),
    notes: 0,
    recent_questions: 0,
    open_questions: 0
  }
  const reductionOrder: SectionKey[] = [
    "recent_questions",
    "notes",
    "open_questions",
    "targets",
    "experience",
    "preferences",
    "progress",
    "academic",
    "identity"
  ]

  let perItemLimit = 72
  let text = renderSections(sections, counts, perItemLimit)

  while (text.length > limit) {
    if (perItemLimit > 32) {
      perItemLimit -= 8
      text = renderSections(sections, counts, perItemLimit)
      continue
    }

    const reducible = reductionOrder.find(key => counts[key] > minCounts[key])
    if (reducible) {
      counts[reducible] -= 1
      text = renderSections(sections, counts, perItemLimit)
      continue
    }

    if (perItemLimit > 16) {
      perItemLimit -= 4
      text = renderSections(sections, counts, perItemLimit)
      continue
    }

    return truncateText(text, limit)
  }

  return text
}

function hasPatchContent(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === "boolean") return true
  if (value && typeof value === "object") {
    const entries = Object.values(value)
    return entries.length > 0 && entries.some(item => hasPatchContent(item))
  }
  return Boolean(cleanText(value))
}

async function readMemoryStore(file: string) {
  try {
    const raw = await fs.readFile(file, "utf-8")
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_MEMORY_STORE,
      ...parsed,
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      recent_questions: Array.isArray(parsed.recent_questions) ? parsed.recent_questions : [],
      open_questions: Array.isArray(parsed.open_questions) ? parsed.open_questions : [],
      recent_entities: {
        ...DEFAULT_MEMORY_STORE.recent_entities,
        ...(parsed.recent_entities && typeof parsed.recent_entities === "object"
          ? {
              ...parsed.recent_entities,
              recent_target_schools: Array.isArray(parsed.recent_entities.recent_target_schools)
                ? parsed.recent_entities.recent_target_schools
                : [],
              recent_target_mentors: Array.isArray(parsed.recent_entities.recent_target_mentors)
                ? parsed.recent_entities.recent_target_mentors
                : [],
              recent_directions: Array.isArray(parsed.recent_entities.recent_directions)
                ? parsed.recent_entities.recent_directions
                : [],
              recent_cities: Array.isArray(parsed.recent_entities.recent_cities)
                ? parsed.recent_entities.recent_cities
                : []
            }
          : {})
      }
    } as MemoryStore
  } catch {
    return { ...DEFAULT_MEMORY_STORE }
  }
}

export default {
  description:
    "Update student_profile.json and the local compact user memory after each user turn. " +
    "The memory summary is automatically compressed to stay within the configured character limit.",
  args: ArgsSchema,
  async execute(
    args: {
      profile_patch: Record<string, unknown>
      profile_mode: "merge" | "replace"
      latest_user_message?: string
      notes: string[]
      open_questions: string[]
      resolved_open_questions: string[]
      recent_entities_patch: {
        last_target_school?: string
        last_target_mentor?: string
        last_direction?: string
        last_city?: string
        recent_target_schools?: string[]
        recent_target_mentors?: string[]
        recent_directions?: string[]
        recent_cities?: string[]
      }
      memory_limit_chars: number
    },
    context: { worktree?: string; directory?: string }
  ) {
    const root = context.worktree || context.directory || process.cwd()
    const dataDir = path.join(root, "data")
    const memoryPath = path.join(dataDir, "user_memory.json")

    await fs.mkdir(dataDir, { recursive: true })

    const patchProvided = hasPatchContent(args.profile_patch)
    if (patchProvided) {
      await mergeProfile.execute(
        { patch: args.profile_patch, mode: args.profile_mode ?? "merge" },
        context
      )
    }

    const loadedProfile = await loadProfile.execute({}, context)
    const hasExistingProfile = (loadedProfile as any)?.exists !== false
    const profile = hasExistingProfile && loadedProfile && typeof loadedProfile === "object"
      ? ({ ...(loadedProfile as Profile) } as Profile)
      : null

    let profileUpdated = false
    let nextProfile: Profile | null = profile

    if (nextProfile) {
      const normalizedStage = normalizeStage(nextProfile.current_stage)
      if (normalizedStage || cleanText(nextProfile.current_stage) === "") {
        nextProfile.current_stage = normalizedStage
      }

      if (!Number.isInteger(nextProfile.application_round) || nextProfile.application_round < 1) {
        nextProfile.application_round = 1
      }

      nextProfile.missing_fields = computeMissingFields(nextProfile)
      await saveProfile.execute({ profile: nextProfile }, context)
      profileUpdated = true
    }

    const store = await readMemoryStore(memoryPath)
    const now = new Date().toISOString()

    const latestQuestion = cleanText(args.latest_user_message)
    store.memory_limit_chars = args.memory_limit_chars ?? store.memory_limit_chars ?? 1500
    store._schema.memory_limit_chars = store.memory_limit_chars
    store.notes = uniquePush(store.notes, args.notes ?? [], 12, 80)
    store.open_questions = removeResolved(store.open_questions, args.resolved_open_questions ?? [])
    store.open_questions = uniquePush(store.open_questions, args.open_questions ?? [], 12, 60)
    store.recent_entities = {
      ...store.recent_entities,
      ...(args.recent_entities_patch?.last_target_school
        ? { last_target_school: cleanText(args.recent_entities_patch.last_target_school) }
        : {}),
      ...(args.recent_entities_patch?.last_target_mentor
        ? { last_target_mentor: cleanText(args.recent_entities_patch.last_target_mentor) }
        : {}),
      ...(args.recent_entities_patch?.last_direction
        ? { last_direction: cleanText(args.recent_entities_patch.last_direction) }
        : {}),
      ...(args.recent_entities_patch?.last_city
        ? { last_city: cleanText(args.recent_entities_patch.last_city) }
        : {}),
      recent_target_schools: overwriteEntityList(
        store.recent_entities.recent_target_schools,
        args.recent_entities_patch?.recent_target_schools
      ),
      recent_target_mentors: overwriteEntityList(
        store.recent_entities.recent_target_mentors,
        args.recent_entities_patch?.recent_target_mentors
      ),
      recent_directions: overwriteEntityList(
        store.recent_entities.recent_directions,
        args.recent_entities_patch?.recent_directions
      ),
      recent_cities: overwriteEntityList(
        store.recent_entities.recent_cities,
        args.recent_entities_patch?.recent_cities
      )
    }

    if (latestQuestion) {
      store.recent_questions = uniquePush(store.recent_questions, [latestQuestion], 6, 80)
      store.turn_count += 1
    } else if (patchProvided || (args.notes?.length ?? 0) || (args.open_questions?.length ?? 0)) {
      store.turn_count += 1
    }

    const sections = buildProfileSections(nextProfile || {})
    sections.notes = store.notes
    sections.recent_questions = store.recent_questions
    sections.open_questions = uniquePush(
      [],
      [...store.open_questions, ...((nextProfile?.missing_fields as string[]) || [])],
      12,
      60
    )

    store.memory_text = compactMemoryText(sections, store.memory_limit_chars)
    store.last_updated = now

    await fs.writeFile(memoryPath, JSON.stringify(store, null, 2), "utf-8")

    return {
      ok: true,
      memory_path: memoryPath,
      profile_updated: profileUpdated,
      memory_length: store.memory_text.length,
      memory_limit_chars: store.memory_limit_chars,
      turn_count: store.turn_count,
      missing_fields: nextProfile?.missing_fields || []
    }
  }
}
