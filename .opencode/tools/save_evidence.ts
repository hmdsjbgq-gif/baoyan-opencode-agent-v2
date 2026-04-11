import { z } from "zod"
import fs from "fs/promises"
import path from "path"

const TOPIC_TYPES = [
  "deadline",
  "eligibility",
  "materials_requirement",
  "english_requirement",
  "contact_info",
  "mentor_profile",
  "mentor_research",
  "mentor_admissions_signal",
  "lab_direction",
  "policy",
  "other"
] as const

const VOLATILE_TOPIC_TYPES = new Set<string>([
  "deadline",
  "eligibility",
  "materials_requirement",
  "english_requirement",
  "contact_info",
  "mentor_admissions_signal",
  "policy"
])

const SLOW_CHANGING_TOPIC_TYPES = new Set<string>([
  "mentor_profile",
  "mentor_research",
  "lab_direction"
])

const RELIABILITY_TIERS = ["high", "medium", "low"] as const
const SOURCE_AUTHORITIES = [
  "university_official",
  "department_official",
  "graduate_admissions_official",
  "faculty_official",
  "lab_official",
  "paper",
  "academic_profile",
  "forum_or_social",
  "other"
] as const
const STRONG_ADMISSIONS_AUTHORITIES = new Set<string>([
  "university_official",
  "department_official",
  "graduate_admissions_official"
])

function cleanText(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : ""
}

function parseTimestamp(value: string) {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? null : timestamp
}

function addDays(iso: string, days: number) {
  const base = parseTimestamp(iso)
  if (base === null) return null
  return new Date(base + days * 24 * 60 * 60 * 1000).toISOString()
}

function inferReliabilityTier(item: {
  source_type: "official" | "academic" | "public_discussion"
  source_authority?: string
  verified: boolean
  topic_type: string
}) {
  if (item.source_type === "official") {
    if (VOLATILE_TOPIC_TYPES.has(item.topic_type)) {
      if (!item.verified) return "medium"
      if (STRONG_ADMISSIONS_AUTHORITIES.has(cleanText(item.source_authority))) return "high"
      return "medium"
    }
    return item.verified ? "high" : "medium"
  }
  if (item.source_type === "academic") {
    if (["mentor_research", "lab_direction"].includes(item.topic_type)) {
      return item.verified ? "high" : "medium"
    }
    return item.verified ? "medium" : "low"
  }
  return "low"
}

function inferReviewAfter(item: {
  captured_at: string
  published_at?: string
  source_type: "official" | "academic" | "public_discussion"
  topic_type: string
}) {
  let days = 180
  if (VOLATILE_TOPIC_TYPES.has(item.topic_type)) days = 90
  if (SLOW_CHANGING_TOPIC_TYPES.has(item.topic_type)) days = 180
  if (item.source_type === "public_discussion") days = Math.min(days, 30)
  return addDays(cleanText(item.published_at) || item.captured_at, days) || item.captured_at
}

function validateTimestamp(value: string, fieldName: string) {
  if (parseTimestamp(value) === null) {
    return {
      ok: false as const,
      reason: `invalid_${fieldName}`,
      message: `Field '${fieldName}' must be a valid ISO 8601 timestamp.`
    }
  }
  return { ok: true as const }
}

/**
 * Schema for a single evidence claim.
 *
 * Stored records use `superseded_by` only on stale claims. When mode is
 * "supersede", callers temporarily pass the stale claim id via
 * `item.superseded_by`; the replacement record written to disk will have that
 * field removed so it remains the active claim.
 */
const EvidenceItem = z.object({
  id: z.string().describe(
    "Unique identifier for this claim, e.g. 'school_thu_deadline_2026'. " +
    "Used to reference this entry in superseded_by fields."
  ),
  entity: z.string().describe("Entity the claim is about, e.g. '清华大学计算机系'"),
  claim: z.string().describe("Structured claim text, e.g. '2026年预推免报名截止日期为9月5日'"),
  source_url: z.string().describe("Source URL (官方链接优先)"),
  source_type: z
    .enum(["official", "academic", "public_discussion"])
    .describe("Evidence source type: official=官网/官方通知; academic=论文/学术数据库; public_discussion=经验贴/论坛"),
  source_authority: z
    .enum(SOURCE_AUTHORITIES)
    .optional()
    .describe(
      "Optional source authority tier. " +
      "Use university_official / department_official / graduate_admissions_official for招生通知，" +
      "faculty_official / lab_official for导师主页或实验室站点，paper / academic_profile for学术来源。"
    ),
  topic_type: z
    .enum(TOPIC_TYPES)
    .default("other")
    .describe(
      "Evidence topic type. Use explicit types for volatile admissions facts " +
      "(deadline/eligibility/materials_requirement/english_requirement/contact_info/policy) " +
      "and mentor facts where possible."
    ),
  applicable_cycle: z
    .string()
    .optional()
    .describe("Explicit year/cycle, e.g. '2026夏令营' or '2026预推免'. Strongly recommended for time-sensitive claims."),
  published_at: z
    .string()
    .optional()
    .describe("Original publish time on the source page, if available, in ISO 8601 format"),
  verified: z.boolean().describe("Whether the claim was directly verified from the source"),
  captured_at: z.string().describe("ISO 8601 timestamp when the claim was captured, e.g. '2026-04-11T10:00:00Z'"),
  review_after: z
    .string()
    .optional()
    .describe("Next re-verification timestamp in ISO 8601 format. Omit to auto-compute from topic type."),
  reliability_tier: z
    .enum(RELIABILITY_TIERS)
    .optional()
    .describe("Optional override for computed evidence reliability: high / medium / low"),
  superseded_by: z
    .string()
    .optional()
    .describe("Set this to the id of a newer claim that corrects or replaces this one"),
  notes: z.string().optional().describe("Optional extra context or caveats")
})

type EvidenceStore = { claims: z.infer<typeof EvidenceItem>[] }

export default {
  description:
    "Save a claim to evidence_store.json. " +
    "Use mode='append' (default) to add a new claim, or mode='supersede' to mark an old claim as stale " +
    "and add a corrected replacement in one atomic operation. " +
    "The tool also tracks evidence reliability, applicable cycle, and next review time.",
  args: {
    item: EvidenceItem,
    mode: z
      .enum(["append", "supersede"])
      .default("append")
      .describe(
        "'append': add a new claim (default). " +
        "'supersede': find the existing claim whose id matches item.superseded_by, " +
        "set its superseded_by field to item.id, then append the new active claim. " +
        "Use supersede when correcting a previously saved claim."
      )
  },
  async execute(
    args: { item: z.infer<typeof EvidenceItem>; mode: "append" | "supersede" },
    context: { worktree?: string; directory?: string }
  ) {
    const root = context.worktree || context.directory || process.cwd()
    const dir = path.join(root, "data")
    const file = path.join(dir, "evidence_store.json")

    await fs.mkdir(dir, { recursive: true })

    let store: EvidenceStore = { claims: [] }
    try {
      const raw = await fs.readFile(file, "utf-8")
      const parsed = JSON.parse(raw)
      store.claims = Array.isArray(parsed.claims) ? parsed.claims : []
    } catch {}

    const mode = args.mode ?? "append"
    const duplicateId = store.claims.find(c => c.id === args.item.id)
    if (duplicateId) {
      return {
        ok: false,
        reason: "duplicate_claim_id",
        message: `A claim with id '${args.item.id}' already exists. Use a new id for corrected claims.`
      }
    }

    const topicType = args.item.topic_type ?? "other"
    const applicableCycle = cleanText(args.item.applicable_cycle)
    const publishedAt = cleanText(args.item.published_at)
    const reviewAfter = cleanText(args.item.review_after)
    const notes = cleanText(args.item.notes)
    const sourceAuthority = cleanText(args.item.source_authority)

    const capturedAtValidation = validateTimestamp(args.item.captured_at, "captured_at")
    if (!capturedAtValidation.ok) return capturedAtValidation

    if (publishedAt) {
      const publishedAtValidation = validateTimestamp(publishedAt, "published_at")
      if (!publishedAtValidation.ok) return publishedAtValidation
    }

    if (reviewAfter) {
      const reviewAfterValidation = validateTimestamp(reviewAfter, "review_after")
      if (!reviewAfterValidation.ok) return reviewAfterValidation
    }

    const itemToStore = {
      ...args.item,
      source_authority: sourceAuthority || undefined,
      topic_type: topicType,
      applicable_cycle: applicableCycle || undefined,
      published_at: publishedAt || undefined,
      review_after:
        reviewAfter ||
        inferReviewAfter({
          captured_at: args.item.captured_at,
          published_at: publishedAt || undefined,
          source_type: args.item.source_type,
          topic_type: topicType
        }),
      reliability_tier:
        args.item.reliability_tier ||
        inferReliabilityTier({
          source_type: args.item.source_type,
          source_authority: sourceAuthority || undefined,
          verified: args.item.verified,
          topic_type: topicType
        }),
      notes: notes || undefined
    }

    const warnings: string[] = []
    if (VOLATILE_TOPIC_TYPES.has(topicType) && !applicableCycle) {
      warnings.push("Time-sensitive claim is missing applicable_cycle, e.g. '2026夏令营'.")
    }
    if (VOLATILE_TOPIC_TYPES.has(topicType) && !publishedAt) {
      warnings.push("Time-sensitive claim is missing published_at; later freshness audits will be weaker.")
    }
    if (args.item.source_type === "official" && !sourceAuthority) {
      warnings.push(
        "Official evidence should record source_authority so later audits can distinguish university/department notices from faculty/lab pages."
      )
    }
    if (
      args.item.source_type === "official" &&
      VOLATILE_TOPIC_TYPES.has(topicType) &&
      !STRONG_ADMISSIONS_AUTHORITIES.has(sourceAuthority)
    ) {
      warnings.push(
        "Admissions-like facts should preferably come from university/department/graduate admissions official notices; current official source authority is missing or lower-tier."
      )
    }
    if (
      args.item.source_type === "academic" &&
      ["mentor_research", "lab_direction"].includes(topicType) &&
      !sourceAuthority
    ) {
      warnings.push(
        "Academic evidence for research-direction analysis should record source_authority such as 'paper' or 'academic_profile'."
      )
    }
    if (args.item.source_type === "public_discussion") {
      warnings.push("Public-discussion evidence cannot independently support key conclusions; keep it auxiliary.")
      if (!notes) {
        warnings.push("Public-discussion evidence should include notes describing uncertainty or corroboration status.")
      }
    }
    if (!args.item.verified) {
      warnings.push("Claim saved as unverified; do not use it as a key conclusion until directly checked.")
    }

    if (mode === "supersede") {
      const supersededId = args.item.superseded_by
      if (!supersededId) {
        return {
          ok: false,
          reason: "supersede_requires_superseded_by",
          message: "When mode is 'supersede', item.superseded_by must reference the id of the stale claim."
        }
      }
      const oldIndex = store.claims.findIndex(c => c.id === supersededId)
      if (oldIndex === -1) {
        return {
          ok: false,
          reason: "superseded_id_not_found",
          message: `No claim with id '${supersededId}' found in evidence_store. Use mode='append' to add a standalone correction.`
        }
      }
      if (store.claims[oldIndex]?.superseded_by) {
        return {
          ok: false,
          reason: "claim_already_superseded",
          message:
            `Claim '${supersededId}' is already stale. ` +
            "Supersede the latest active claim instead of chaining from an outdated record."
        }
      }
      // Mark the old claim as stale by pointing it at the new claim's id
      store.claims[oldIndex] = { ...store.claims[oldIndex], superseded_by: args.item.id }
      delete itemToStore.superseded_by
    }

    store.claims.push(itemToStore)
    await fs.writeFile(file, JSON.stringify(store, null, 2), "utf-8")

    return {
      ok: true,
      mode,
      total_claims: store.claims.length,
      active_claims: store.claims.filter(c => !c.superseded_by).length,
      reliability_tier: itemToStore.reliability_tier,
      review_after: itemToStore.review_after,
      warnings
    }
  }
}
