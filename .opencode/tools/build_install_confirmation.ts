import { z } from "zod"

export default {
  description: "Build a concise install confirmation message for recommended components",
  args: {
    must_have: z.array(z.string()).default([]),
    strongly_recommended: z.array(z.string()).default([]),
    optional: z.array(z.string()).default([])
  },
  async execute(args: { must_have: string[]; strongly_recommended: string[]; optional: string[] }) {
    const lines: string[] = []
    if (args.must_have.length) lines.push(`必装项：${args.must_have.join("、")}`)
    if (args.strongly_recommended.length) lines.push(`强烈建议项：${args.strongly_recommended.join("、")}`)
    if (args.optional.length) lines.push(`可选项：${args.optional.join("、")}`)
    lines.push("是否现在安装最小必要集？也可以只安装必装项，或暂时保持纯净环境。")
    return { message: lines.join("\n") }
  }
}
