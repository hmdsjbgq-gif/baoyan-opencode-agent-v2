import { z } from "zod"

/**
 * Component registry with benefit/cost scores for ranked recommendations.
 *
 * benefit_score (1–5): how much this component adds to the baoyan use case
 * complexity_cost (1–5): installation complexity + ongoing maintenance burden
 *
 * Effective score = benefit_score / complexity_cost
 * When want_low_complexity=true, components with complexity_cost >= 4 are
 * automatically downgraded to "optional" regardless of benefit.
 */
const COMPONENTS = [
  {
    id: "opencode-github-agent",
    benefit_score: 4,
    complexity_cost: 3,
    triggers: ["github_repo_automation"],
    base_tier: "mustHave"
  },
  {
    id: "playwright-mcp",
    benefit_score: 4,
    complexity_cost: 2,
    triggers: ["dynamic_web_pages"],
    base_tier: "stronglyRecommended"
  },
  {
    id: "markitdown-mcp",
    benefit_score: 4,
    complexity_cost: 2,
    triggers: ["pdf_notice_documents"],
    base_tier: "stronglyRecommended"
  },
  {
    id: "crawl4ai",
    benefit_score: 4,
    complexity_cost: 3,
    triggers: ["site_wide_crawl"],
    base_tier: "stronglyRecommended"
  },
  {
    id: "github-mcp-server",
    benefit_score: 3,
    complexity_cost: 2,
    triggers: ["github_repo_automation"],
    base_tier: "stronglyRecommended"
  },
  {
    id: "firecrawl",
    benefit_score: 3,
    complexity_cost: 4,
    triggers: ["accept_cloud_collection_api"],
    base_tier: "optional"
  },
  {
    id: "custom-private-knowledge-mcp",
    benefit_score: 3,
    complexity_cost: 3,
    triggers: ["have_private_knowledge_base"],
    base_tier: "optional"
  },
  {
    id: "opencode-openai-codex-auth",
    benefit_score: 2,
    complexity_cost: 2,
    triggers: ["want_lower_model_cost"],
    base_tier: "optional"
  },
  {
    id: "opencode-daytona",
    benefit_score: 2,
    complexity_cost: 4,
    triggers: ["want_remote_sandbox"],
    base_tier: "optional"
  },
  {
    id: "oh-my-opencode",
    benefit_score: 2,
    complexity_cost: 4,
    triggers: [],
    base_tier: "notNow"
  }
] as const

type ComponentId = typeof COMPONENTS[number]["id"]
type Tier = "mustHave" | "stronglyRecommended" | "optional" | "notNow"

const NeedSchema = z.object({
  dynamic_web_pages: z.boolean().default(true),
  pdf_notice_documents: z.boolean().default(true),
  site_wide_crawl: z.boolean().default(false),
  accept_cloud_collection_api: z.boolean().default(false),
  github_repo_automation: z.boolean().default(true),
  want_low_complexity: z.boolean().default(true),
  want_lower_model_cost: z.boolean().default(false),
  want_remote_sandbox: z.boolean().default(false),
  have_private_knowledge_base: z.boolean().default(false)
})

export default {
  description:
    "Produce a prioritized recommendation set for plugins/MCP/GitHub components. " +
    "Components are ranked by benefit/complexity ratio and adjusted by the want_low_complexity preference. " +
    "Includes info-collection enhancements for PDF notices, multi-page crawling, and hosted crawl APIs.",
  args: {
    dynamic_web_pages: NeedSchema.shape.dynamic_web_pages,
    pdf_notice_documents: NeedSchema.shape.pdf_notice_documents,
    site_wide_crawl: NeedSchema.shape.site_wide_crawl,
    accept_cloud_collection_api: NeedSchema.shape.accept_cloud_collection_api,
    github_repo_automation: NeedSchema.shape.github_repo_automation,
    want_low_complexity: NeedSchema.shape.want_low_complexity,
    want_lower_model_cost: NeedSchema.shape.want_lower_model_cost,
    want_remote_sandbox: NeedSchema.shape.want_remote_sandbox,
    have_private_knowledge_base: NeedSchema.shape.have_private_knowledge_base
  },
  async execute(args: z.infer<typeof NeedSchema>) {
    const needs = args
    const result: Record<Tier, { id: ComponentId; score: number; reason?: string }[]> = {
      mustHave: [],
      stronglyRecommended: [],
      optional: [],
      notNow: []
    }

    // Flag map for trigger matching
    const flagMap: Record<string, boolean> = {
      dynamic_web_pages: needs.dynamic_web_pages,
      pdf_notice_documents: needs.pdf_notice_documents,
      site_wide_crawl: needs.site_wide_crawl,
      accept_cloud_collection_api: needs.accept_cloud_collection_api,
      github_repo_automation: needs.github_repo_automation,
      want_lower_model_cost: needs.want_lower_model_cost,
      want_remote_sandbox: needs.want_remote_sandbox,
      have_private_knowledge_base: needs.have_private_knowledge_base
    }

    for (const comp of COMPONENTS) {
      // Check if any trigger is active (empty triggers = always evaluated)
      const triggered =
        comp.triggers.length === 0 || comp.triggers.some(t => flagMap[t])

      if (!triggered) continue

      const effectiveScore = comp.benefit_score / comp.complexity_cost
      let tier: Tier = comp.base_tier as Tier
      let reason: string | undefined

      // Downgrade high-complexity components when user wants simplicity
      if (needs.want_low_complexity && comp.complexity_cost >= 4 && tier !== "notNow") {
        reason = `complexity_cost=${comp.complexity_cost} ≥ 4，与 want_low_complexity 冲突，降级为可选`
        tier = "optional"
      }

      result[tier].push({ id: comp.id, score: Math.round(effectiveScore * 100) / 100, reason })
    }

    // Sort each tier by descending effective score
    for (const tier of Object.keys(result) as Tier[]) {
      result[tier].sort((a, b) => b.score - a.score)
    }

    return {
      mustHave: result.mustHave.map(c => c.id),
      stronglyRecommended: result.stronglyRecommended.map(c => c.id),
      optional: result.optional.map(c => c.id),
      notNow: result.notNow.map(c => c.id),
      details: {
        mustHave: result.mustHave,
        stronglyRecommended: result.stronglyRecommended,
        optional: result.optional,
        notNow: result.notNow
      },
      note:
        needs.want_low_complexity
          ? "已启用低复杂度模式：complexity_cost ≥ 4 的组件已自动降级为可选。"
          : "未启用低复杂度模式：所有组件按原始优先级排列。"
    }
  }
}
