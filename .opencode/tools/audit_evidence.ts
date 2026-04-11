import { z } from "zod"
import fs from "fs/promises"
import path from "path"

const VOLATILE_TOPIC_TYPES = new Set<string>([
  "deadline",
  "eligibility",
  "materials_requirement",
  "english_requirement",
  "contact_info",
  "mentor_admissions_signal",
  "policy"
])
const STRONG_ADMISSIONS_AUTHORITIES = new Set<string>([
  "university_official",
  "department_official",
  "graduate_admissions_official"
])

function cleanText(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : ""
}

function normalizeText(value: unknown) {
  return cleanText(value).toLowerCase()
}

function parseTimestamp(value: string) {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? null : timestamp
}

function addDays(iso: string, days: number) {
  const base = parseTimestamp(iso)
  if (base === null) return null
  return base + days * 24 * 60 * 60 * 1000
}

function inferReviewAfter(item: Record<string, any>) {
  const sourceType = cleanText(item.source_type)
  const topicType = cleanText(item.topic_type) || "other"
  const publishedAt = cleanText(item.published_at)
  const capturedAt = cleanText(item.captured_at)

  let days = 180
  if (VOLATILE_TOPIC_TYPES.has(topicType)) days = 90
  if (sourceType === "public_discussion") days = Math.min(days, 30)
  return addDays(publishedAt || capturedAt, days)
}

function summarizeClaim(item: Record<string, any>) {
  return {
    id: item.id,
    entity: item.entity,
    claim: item.claim,
    topic_type: item.topic_type || "",
    source_type: item.source_type,
    source_authority: item.source_authority || "",
    source_url: item.source_url,
    applicable_cycle: item.applicable_cycle || "",
    reliability_tier: item.reliability_tier || "",
    verified: Boolean(item.verified),
    captured_at: item.captured_at,
    published_at: item.published_at || "",
    review_after: item.review_after || ""
  }
}

function normalizeList(values: string[] | undefined) {
  return (values || []).map(normalizeText).filter(Boolean)
}

function matchesAnySubstring(target: string, keywords: string[]) {
  if (!keywords.length) return true
  const normalizedTarget = normalizeText(target)
  return keywords.some(keyword => normalizedTarget.includes(keyword))
}

function matchesAnyFieldSubstring(fields: unknown[], keywords: string[]) {
  if (!keywords.length) return true
  return fields.some(field => matchesAnySubstring(String(field ?? ""), keywords))
}

function matchesAnyExact(value: unknown, allowed: string[]) {
  if (!allowed.length) return true
  return allowed.includes(normalizeText(value))
}

function filterClaims(
  claims: Record<string, any>[],
  filters: {
    ids: string[]
    entity_keywords: string[]
    claim_keywords: string[]
    applicable_cycles: string[]
    topic_types: string[]
    source_types: string[]
    source_authorities: string[]
    include_superseded: boolean
  }
) {
  return claims.filter(claim => {
    if (!filters.include_superseded && claim?.superseded_by) return false

    if (!matchesAnyFieldSubstring([claim.id], filters.ids)) return false
    if (
      !matchesAnyFieldSubstring(
        [claim.entity, claim.claim, claim.source_url],
        filters.entity_keywords
      )
    ) {
      return false
    }
    if (
      !matchesAnyFieldSubstring(
        [claim.claim, claim.entity, claim.source_url, claim.notes],
        filters.claim_keywords
      )
    ) {
      return false
    }
    if (!matchesAnyExact(claim.applicable_cycle, filters.applicable_cycles)) return false
    if (!matchesAnyExact(claim.topic_type, filters.topic_types)) return false
    if (!matchesAnyExact(claim.source_type, filters.source_types)) return false
    if (!matchesAnyExact(claim.source_authority, filters.source_authorities)) return false

    return true
  })
}

export default {
  description:
    "Audit evidence_store.json for stale, low-confidence, weak-authority, and under-specified claims " +
    "so agents can refresh risky information before making recommendations. " +
    "Supports filtering by current school, mentor, topic, and application cycle.",
  args: {
    now: z
      .string()
      .optional()
      .describe("Optional ISO 8601 timestamp override for deterministic audits"),
    ids: z
      .array(z.string())
      .default([])
      .describe("Optional claim id filters. Partial match is allowed."),
    entity_keywords: z
      .array(z.string())
      .default([])
      .describe("Optional entity keywords such as school name, mentor name, or lab name."),
    claim_keywords: z
      .array(z.string())
      .default([])
      .describe("Optional claim/body keywords such as '夏令营', '招生', 'CV', 'deadline'."),
    applicable_cycles: z
      .array(z.string())
      .default([])
      .describe("Optional exact cycle filters, e.g. '2026夏令营', '2026预推免'."),
    topic_types: z
      .array(z.string())
      .default([])
      .describe("Optional exact topic_type filters."),
    source_types: z
      .array(z.string())
      .default([])
      .describe("Optional exact source_type filters."),
    source_authorities: z
      .array(z.string())
      .default([])
      .describe("Optional exact source_authority filters such as 'department_official' or 'faculty_official'."),
    include_superseded: z
      .boolean()
      .default(false)
      .describe("Whether to include superseded stale claims in the audit scope."),
    max_items_per_bucket: z.number().int().min(1).max(50).default(10)
  },
  async execute(
    args: {
      now?: string
      ids?: string[]
      entity_keywords?: string[]
      claim_keywords?: string[]
      applicable_cycles?: string[]
      topic_types?: string[]
      source_types?: string[]
      source_authorities?: string[]
      include_superseded?: boolean
      max_items_per_bucket: number
    },
    context: { worktree?: string; directory?: string }
  ) {
    const root = context.worktree || context.directory || process.cwd()
    const file = path.join(root, "data", "evidence_store.json")

    let claims: Record<string, any>[] = []
    try {
      const raw = await fs.readFile(file, "utf-8")
      const parsed = JSON.parse(raw)
      claims = Array.isArray(parsed.claims) ? parsed.claims : []
    } catch {
      const emptyFilters = {
        ids: args.ids || [],
        entity_keywords: args.entity_keywords || [],
        claim_keywords: args.claim_keywords || [],
        applicable_cycles: args.applicable_cycles || [],
        topic_types: args.topic_types || [],
        source_types: args.source_types || [],
        source_authorities: args.source_authorities || [],
        include_superseded: Boolean(args.include_superseded)
      }
      return {
        ok: true,
        total_claims: 0,
        scoped_claims: 0,
        active_claims: 0,
        filters_applied: emptyFilters,
        message: "No evidence_store.json claims found."
      }
    }

    const now = parseTimestamp(cleanText(args.now) || new Date().toISOString())
    if (now === null) {
      return {
        ok: false,
        reason: "invalid_now",
        message: "Field 'now' must be a valid ISO 8601 timestamp."
      }
    }
    const filters = {
      ids: normalizeList(args.ids),
      entity_keywords: normalizeList(args.entity_keywords),
      claim_keywords: normalizeList(args.claim_keywords),
      applicable_cycles: normalizeList(args.applicable_cycles),
      topic_types: normalizeList(args.topic_types),
      source_types: normalizeList(args.source_types),
      source_authorities: normalizeList(args.source_authorities),
      include_superseded: Boolean(args.include_superseded)
    }
    const scopedClaims = filterClaims(claims, filters)
    const activeClaims = scopedClaims.filter(item => !item?.superseded_by)
    const stale: Array<Record<string, any>> = []
    const lowConfidence: Array<Record<string, any>> = []
    const weakAuthority: Array<Record<string, any>> = []
    const missingContext: Array<Record<string, any>> = []
    const publicDiscussionOnly: Array<Record<string, any>> = []

    for (const claim of activeClaims) {
      const reviewAfter = cleanText(claim.review_after)
      const topicType = cleanText(claim.topic_type) || "other"
      const applicableCycle = cleanText(claim.applicable_cycle)
      const publishedAt = cleanText(claim.published_at)
      const reliabilityTier = cleanText(claim.reliability_tier)
      const sourceType = cleanText(claim.source_type)
      const sourceAuthority = cleanText(claim.source_authority)
      const verified = Boolean(claim.verified)

      const reviewAt = reviewAfter ? parseTimestamp(reviewAfter) : inferReviewAfter(claim)
      if (reviewAt !== null && now > reviewAt) {
        stale.push({
          ...summarizeClaim(claim),
          reason: `Evidence should be re-verified after ${new Date(reviewAt).toISOString()}.`
        })
      }

      if (!verified || reliabilityTier === "low") {
        lowConfidence.push({
          ...summarizeClaim(claim),
          reason: !verified
            ? "Claim is still unverified."
            : "Claim reliability is low and should not independently support key conclusions."
        })
      }

      if (
        sourceType === "official" &&
        VOLATILE_TOPIC_TYPES.has(topicType) &&
        !STRONG_ADMISSIONS_AUTHORITIES.has(sourceAuthority)
      ) {
        weakAuthority.push({
          ...summarizeClaim(claim),
          reason:
            sourceAuthority
              ? `Official source_authority='${sourceAuthority}' is weaker than a university/department/graduate admissions notice for this time-sensitive claim.`
              : "Official source_authority is missing; cannot confirm whether this time-sensitive claim comes from a high-authority admissions notice."
        })
      }

      if (VOLATILE_TOPIC_TYPES.has(topicType) && (!applicableCycle || !publishedAt)) {
        missingContext.push({
          ...summarizeClaim(claim),
          reason: [
            !applicableCycle ? "missing applicable_cycle" : "",
            !publishedAt ? "missing published_at" : ""
          ]
            .filter(Boolean)
            .join(" + ")
        })
      }

      if (sourceType === "public_discussion" && !verified) {
        publicDiscussionOnly.push({
          ...summarizeClaim(claim),
          reason: "Public discussion without direct verification."
        })
      }
    }

    const maxItems = args.max_items_per_bucket ?? 10
    return {
      ok: true,
      audit_time: new Date(now).toISOString(),
      total_claims: claims.length,
      scoped_claims: scopedClaims.length,
      active_claims: activeClaims.length,
      filters_applied: {
        ids: args.ids || [],
        entity_keywords: args.entity_keywords || [],
        claim_keywords: args.claim_keywords || [],
        applicable_cycles: args.applicable_cycles || [],
        topic_types: args.topic_types || [],
        source_types: args.source_types || [],
        source_authorities: args.source_authorities || [],
        include_superseded: Boolean(args.include_superseded)
      },
      stale_count: stale.length,
      low_confidence_count: lowConfidence.length,
      weak_authority_count: weakAuthority.length,
      missing_context_count: missingContext.length,
      public_discussion_only_count: publicDiscussionOnly.length,
      stale: stale.slice(0, maxItems),
      low_confidence: lowConfidence.slice(0, maxItems),
      weak_authority: weakAuthority.slice(0, maxItems),
      missing_context: missingContext.slice(0, maxItems),
      public_discussion_only: publicDiscussionOnly.slice(0, maxItems),
      message:
        scopedClaims.length === 0
          ? "No evidence claims matched the current audit scope."
          : undefined,
      recommendations: [
        "For deadline / eligibility / materials facts, always store applicable_cycle and published_at.",
        "For official admissions facts, record source_authority and prefer university / department / graduate-admissions notices over faculty or lab pages.",
        "Refresh any claim that is overdue for review before using it in shortlist or mentor recommendations.",
        "Do not let public-discussion evidence independently support a key conclusion.",
        "When calling audit_evidence inside school/mentor workflows, pass the current entity keywords and application cycle."
      ]
    }
  }
}
