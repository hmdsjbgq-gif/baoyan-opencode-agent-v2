import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import saveEvidence from "../.opencode/tools/save_evidence.ts"
import auditEvidence from "../.opencode/tools/audit_evidence.ts"

async function makeTempWorktree() {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "baoyan-evidence-check-"))
  await fs.mkdir(path.join(tmp, "data"), { recursive: true })
  return tmp
}

async function main() {
  const tmp = await makeTempWorktree()
  const context = { worktree: tmp }

  const officialDeadline = await saveEvidence.execute(
    {
      item: {
        id: "thu_cs_deadline_old",
        entity: "清华大学计算机系",
        claim: "报名截止时间为 2025-07-01 17:00",
        source_url: "https://example.edu/thu-cs-camp-2025",
        source_type: "official",
        topic_type: "deadline",
        verified: true,
        captured_at: "2025-01-01T00:00:00.000Z"
      },
      mode: "append"
    },
    context
  )

  assert.equal(officialDeadline.ok, true)
  assert.equal(officialDeadline.reliability_tier, "medium")
  assert.ok(
    Array.isArray(officialDeadline.warnings) &&
      officialDeadline.warnings.some(item => item.includes("applicable_cycle"))
  )
  assert.ok(
    Array.isArray(officialDeadline.warnings) &&
      officialDeadline.warnings.some(item => item.includes("source_authority"))
  )

  const publicDiscussion = await saveEvidence.execute(
    {
      item: {
        id: "mentor_push_discussion",
        entity: "某导师课题组",
        claim: "公开讨论提到该组管理风格较 push",
        source_url: "https://forum.example.com/post/123",
        source_type: "public_discussion",
        topic_type: "other",
        verified: false,
        captured_at: "2026-03-01T00:00:00.000Z"
      },
      mode: "append"
    },
    context
  )

  assert.equal(publicDiscussion.ok, true)
  assert.equal(publicDiscussion.reliability_tier, "low")

  const facultySignal = await saveEvidence.execute(
    {
      item: {
        id: "mentor_admission_hint_faculty",
        entity: "某大学某导师",
        claim: "导师主页提到 2026 年拟接收推免生",
        source_url: "https://faculty.example.edu/mentor",
        source_type: "official",
        source_authority: "faculty_official",
        topic_type: "mentor_admissions_signal",
        applicable_cycle: "2026预推免",
        published_at: "2026-03-10T00:00:00.000Z",
        verified: true,
        captured_at: "2026-03-11T00:00:00.000Z"
      },
      mode: "append"
    },
    context
  )

  assert.equal(facultySignal.ok, true)
  assert.equal(facultySignal.reliability_tier, "medium")
  assert.ok(
    Array.isArray(facultySignal.warnings) &&
      facultySignal.warnings.some(item => item.includes("graduate admissions"))
  )

  const freshOfficial = await saveEvidence.execute(
    {
      item: {
        id: "pku_ai_deadline_2026",
        entity: "北京大学智能学院",
        claim: "2026夏令营报名截止时间为 2026-06-30 17:00",
        source_url: "https://example.edu/pku-ai-camp-2026",
        source_type: "official",
        source_authority: "department_official",
        topic_type: "deadline",
        applicable_cycle: "2026夏令营",
        published_at: "2026-04-01T00:00:00.000Z",
        verified: true,
        captured_at: "2026-04-02T00:00:00.000Z"
      },
      mode: "append"
    },
    context
  )

  assert.equal(freshOfficial.ok, true)
  assert.equal(freshOfficial.reliability_tier, "high")
  assert.deepEqual(freshOfficial.warnings, [])

  const audit = await auditEvidence.execute(
    {
      now: "2026-04-11T00:00:00.000Z",
      max_items_per_bucket: 10
    },
    context
  )

  assert.equal(audit.ok, true)
  assert.equal(audit.total_claims, 4)
  assert.equal(audit.scoped_claims, 4)
  assert.equal(audit.active_claims, 4)
  assert.equal(audit.stale_count, 2)
  assert.equal(audit.low_confidence_count, 1)
  assert.equal(audit.weak_authority_count, 2)
  assert.equal(audit.missing_context_count, 1)
  assert.equal(audit.public_discussion_only_count, 1)
  assert.deepEqual(
    audit.stale.map((item: { id: string }) => item.id).sort(),
    ["mentor_push_discussion", "thu_cs_deadline_old"]
  )
  assert.equal(audit.low_confidence[0]?.id, "mentor_push_discussion")
  assert.deepEqual(
    audit.weak_authority.map((item: { id: string }) => item.id).sort(),
    ["mentor_admission_hint_faculty", "thu_cs_deadline_old"]
  )

  const pkuScopedAudit = await auditEvidence.execute(
    {
      now: "2026-04-11T00:00:00.000Z",
      entity_keywords: ["北京大学"],
      applicable_cycles: ["2026夏令营"],
      topic_types: ["deadline"],
      source_authorities: ["department_official"],
      max_items_per_bucket: 10
    },
    context
  )

  assert.equal(pkuScopedAudit.ok, true)
  assert.equal(pkuScopedAudit.scoped_claims, 1)
  assert.equal(pkuScopedAudit.active_claims, 1)
  assert.equal(pkuScopedAudit.stale_count, 0)
  assert.equal(pkuScopedAudit.low_confidence_count, 0)
  assert.equal(pkuScopedAudit.weak_authority_count, 0)
  assert.equal(pkuScopedAudit.missing_context_count, 0)
  assert.equal(pkuScopedAudit.public_discussion_only_count, 0)
  assert.equal(pkuScopedAudit.filters_applied.entity_keywords[0], "北京大学")
  assert.equal(pkuScopedAudit.filters_applied.source_authorities[0], "department_official")

  const noMatchAudit = await auditEvidence.execute(
    {
      now: "2026-04-11T00:00:00.000Z",
      entity_keywords: ["上海交通大学"],
      topic_types: ["policy"],
      max_items_per_bucket: 10
    },
    context
  )

  assert.equal(noMatchAudit.ok, true)
  assert.equal(noMatchAudit.scoped_claims, 0)
  assert.equal(noMatchAudit.active_claims, 0)
  assert.equal(noMatchAudit.message, "No evidence claims matched the current audit scope.")

  console.log("evidence audit ok")
}

await main()
