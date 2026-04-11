import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import ingestUserMessage from "../.opencode/tools/ingest_user_message.ts"
import upsertUserMemory from "../.opencode/tools/upsert_user_memory.ts"

const ROOT = process.cwd()

async function makeTempWorktree() {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "baoyan-memory-check-"))
  const dataDir = path.join(tmp, "data")
  await fs.mkdir(dataDir, { recursive: true })

  for (const file of ["student_profile.json", "evidence_store.json", "user_memory.json"]) {
    await fs.copyFile(path.join(ROOT, "data", file), path.join(dataDir, file))
  }

  return tmp
}

async function readJson<T>(file: string) {
  return JSON.parse(await fs.readFile(file, "utf8")) as T
}

async function runPluralReferenceCase() {
  const tmp = await makeTempWorktree()
  const context = { worktree: tmp }

  await ingestUserMessage.execute(
    {
      message: "我想冲清华大学，稳浙江大学，准备联系王晓明老师和李雷老师，方向偏机器学习和CV。",
      infer_open_questions: true,
      profile_mode: "merge",
      extra_notes: [],
      extra_open_questions: [],
      extra_resolved_open_questions: [],
      memory_limit_chars: 1500
    },
    context
  )

  const secondTurn = await ingestUserMessage.execute(
    {
      message: "这两个学校都先放保底，前两个老师都继续联系，他那个课题组我还想再看看。",
      infer_open_questions: true,
      profile_mode: "merge",
      extra_notes: [],
      extra_open_questions: [],
      extra_resolved_open_questions: [],
      memory_limit_chars: 1500
    },
    context
  )

  const profile = await readJson<Record<string, any>>(path.join(tmp, "data", "student_profile.json"))
  const memory = await readJson<Record<string, any>>(path.join(tmp, "data", "user_memory.json"))
  const schools = profile.application_state?.target_schools || []
  const mentors = profile.application_state?.target_mentors || []

  assert.deepEqual(
    schools.map((item: any) => ({ name: item.name, tier: item.tier })),
    [
      { name: "清华大学", tier: "保" },
      { name: "浙江大学", tier: "保" }
    ]
  )
  assert.deepEqual(
    mentors.map((item: any) => ({ name: item.name, status: item.status })),
    [
      { name: "王晓明老师", status: "已套磁" },
      { name: "李雷老师", status: "已套磁" }
    ]
  )
  assert.deepEqual(memory.recent_entities?.recent_target_schools, ["清华大学", "浙江大学"])
  assert.deepEqual(memory.recent_entities?.recent_target_mentors, ["王晓明老师", "李雷老师"])
  assert.equal(memory.recent_entities?.last_target_mentor, "李雷老师")
  assert.ok(
    (memory.notes || []).some((item: string) => item.includes("导师组/实验室指代：李雷老师"))
  )
  assert.deepEqual(
    secondTurn.extracted.extracted_entities?.target_mentors?.map((item: any) => item.name),
    ["王晓明老师", "李雷老师"]
  )
}

async function runMemoryLimitCase() {
  const tmp = await makeTempWorktree()
  const context = { worktree: tmp }
  const longNote = "用户补充了很多细节".repeat(200)

  await upsertUserMemory.execute(
    {
      latest_user_message: "我最近一直在比较很多学校和导师。",
      profile_patch: {},
      profile_mode: "merge",
      notes: [longNote],
      open_questions: [],
      resolved_open_questions: [],
      recent_entities_patch: {},
      memory_limit_chars: 1500
    },
    context
  )

  const memory = await readJson<Record<string, any>>(path.join(tmp, "data", "user_memory.json"))
  assert.ok(typeof memory.memory_text === "string")
  assert.ok(memory.memory_text.length <= 1500)
}

async function runExplicitFalseCase() {
  const tmp = await makeTempWorktree()
  const context = { worktree: tmp }

  await ingestUserMessage.execute(
    {
      message: "简历已经准备好了，但套磁信还没准备，成绩单也还没弄。",
      infer_open_questions: true,
      profile_mode: "merge",
      extra_notes: [],
      extra_open_questions: [],
      extra_resolved_open_questions: [],
      memory_limit_chars: 1500
    },
    context
  )

  const profile = await readJson<Record<string, any>>(path.join(tmp, "data", "student_profile.json"))
  assert.equal(profile.application_state?.materials_ready?.cv, true)
  assert.equal(profile.application_state?.materials_ready?.cold_email_ready, false)
  assert.equal(profile.application_state?.materials_ready?.transcript, false)
}

async function main() {
  await runPluralReferenceCase()
  await runMemoryLimitCase()
  await runExplicitFalseCase()
  console.log("memory ingest ok")
}

await main()
