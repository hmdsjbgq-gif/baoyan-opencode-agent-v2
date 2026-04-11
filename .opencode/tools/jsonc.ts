function stripJsonComments(raw: string) {
  let result = ""
  let inString = false
  let inLineComment = false
  let inBlockComment = false
  let escaped = false

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i]
    const next = raw[i + 1]

    if (inLineComment) {
      if (char === "\n" || char === "\r") {
        inLineComment = false
        result += char
      }
      continue
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false
        i += 1
        continue
      }
      if (char === "\n" || char === "\r") result += char
      continue
    }

    if (inString) {
      result += char
      if (escaped) {
        escaped = false
      } else if (char === "\\") {
        escaped = true
      } else if (char === "\"") {
        inString = false
      }
      continue
    }

    if (char === "\"") {
      inString = true
      result += char
      continue
    }

    if (char === "/" && next === "/") {
      inLineComment = true
      i += 1
      continue
    }

    if (char === "/" && next === "*") {
      inBlockComment = true
      i += 1
      continue
    }

    result += char
  }

  return result
}

function stripTrailingCommas(raw: string) {
  let result = ""
  let inString = false
  let escaped = false

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i]

    if (inString) {
      result += char
      if (escaped) {
        escaped = false
      } else if (char === "\\") {
        escaped = true
      } else if (char === "\"") {
        inString = false
      }
      continue
    }

    if (char === "\"") {
      inString = true
      result += char
      continue
    }

    if (char === ",") {
      let cursor = i + 1
      while (cursor < raw.length && /\s/.test(raw[cursor])) cursor += 1
      if (raw[cursor] === "}" || raw[cursor] === "]") continue
    }

    result += char
  }

  return result
}

export function parseJsoncObject(raw: string) {
  const normalized = raw.replace(/^\uFEFF/, "")
  const parsed = JSON.parse(stripTrailingCommas(stripJsonComments(normalized)))

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected config root to be a JSON object")
  }

  return parsed as Record<string, unknown>
}

export function stringifyJsoncObject(value: Record<string, unknown>) {
  return `${JSON.stringify(value, null, 2)}\n`
}
