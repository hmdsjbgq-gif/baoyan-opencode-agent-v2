import { z } from "zod"
import fs from "fs/promises"
import path from "path"

function normalizeForKey(value: any): any {
  if (Array.isArray(value)) return value.map(normalizeForKey)
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = normalizeForKey(value[key])
          return acc
        },
        {} as Record<string, unknown>
      )
  }
  return value
}

function stableKey(value: any) {
  return JSON.stringify(normalizeForKey(value))
}

function getArrayItemKey(value: any) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    if (typeof value.id === "string" && value.id) return `id:${value.id}`
    if (typeof value.name === "string" && value.name) return `name:${value.name}`
    if (typeof value.title === "string" && value.title) return `title:${value.title}`
  }
  return `value:${stableKey(value)}`
}

function mergeArrays(target: any[], patch: any[], mode: "merge" | "replace") {
  if (mode === "replace") return patch

  const result = [...target]
  const indexByKey = new Map<string, number>()

  for (let i = 0; i < result.length; i += 1) {
    indexByKey.set(getArrayItemKey(result[i]), i)
  }

  for (const item of patch) {
    const key = getArrayItemKey(item)
    const existingIndex = indexByKey.get(key)

    if (existingIndex === undefined) {
      indexByKey.set(key, result.length)
      result.push(item)
      continue
    }

    result[existingIndex] = deepMerge(result[existingIndex], item, mode)
  }

  return result
}

/**
 * Deep-merge a patch into a base object.
 *
 * Array handling is controlled by `mode`:
 *   - "merge"   (default): arrays are merged by id/name/title when possible,
 *                          otherwise deduplicated by exact value
 *   - "replace": arrays are replaced entirely by the patch value
 *
 * Non-array objects are always recursively merged.
 * Primitive values always take the patch value.
 */
function deepMerge(target: any, patch: any, mode: "merge" | "replace"): any {
  if (Array.isArray(target) && Array.isArray(patch)) {
    return mergeArrays(target, patch, mode)
  }
  if (
    target &&
    patch &&
    typeof target === "object" &&
    typeof patch === "object" &&
    !Array.isArray(target) &&
    !Array.isArray(patch)
  ) {
    const out: Record<string, unknown> = { ...target }
    for (const key of Object.keys(patch)) {
      out[key] = key in target ? deepMerge(target[key], patch[key], mode) : patch[key]
    }
    return out
  }
  return patch
}

export default {
  description: "Merge a partial patch into student_profile.json",
  args: {
    patch: z.record(z.any()).describe("Partial patch to merge into the current student profile"),
    mode: z
      .enum(["merge", "replace"])
      .default("merge")
      .describe(
        "How to handle array fields: 'merge' (default) merges by id/name/title when possible " +
        "and deduplicates exact repeats; 'replace' overwrites array fields entirely. " +
        "Use 'replace' only when you intend to discard existing array entries."
      )
  },
  async execute(
    args: { patch: Record<string, unknown>; mode: "merge" | "replace" },
    context: { worktree?: string; directory?: string }
  ) {
    const root = context.worktree || context.directory || process.cwd()
    const dir = path.join(root, "data")
    const file = path.join(dir, "student_profile.json")

    await fs.mkdir(dir, { recursive: true })

    let current: Record<string, unknown> = {}
    try {
      current = JSON.parse(await fs.readFile(file, "utf-8"))
    } catch {}

    const merged = deepMerge(current, args.patch, args.mode ?? "merge")
    await fs.writeFile(file, JSON.stringify(merged, null, 2), "utf-8")

    return {
      ok: true,
      path: file,
      mode: args.mode ?? "merge",
      profile: merged
    }
  }
}
