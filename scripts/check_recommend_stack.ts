import assert from "node:assert/strict"
import recommendStack from "../.opencode/tools/recommend_stack.ts"

async function main() {
  const base = await recommendStack.execute({
    dynamic_web_pages: true,
    pdf_notice_documents: true,
    site_wide_crawl: false,
    accept_cloud_collection_api: false,
    github_repo_automation: true,
    want_low_complexity: true,
    want_lower_model_cost: false,
    want_remote_sandbox: false,
    have_private_knowledge_base: false
  })

  assert.ok(base.stronglyRecommended.includes("playwright-mcp"))
  assert.ok(base.stronglyRecommended.includes("markitdown-mcp"))
  assert.ok(!base.stronglyRecommended.includes("crawl4ai"))
  assert.ok(!base.optional.includes("firecrawl"))

  const crawlHeavy = await recommendStack.execute({
    dynamic_web_pages: true,
    pdf_notice_documents: true,
    site_wide_crawl: true,
    accept_cloud_collection_api: true,
    github_repo_automation: false,
    want_low_complexity: true,
    want_lower_model_cost: false,
    want_remote_sandbox: false,
    have_private_knowledge_base: false
  })

  assert.ok(crawlHeavy.stronglyRecommended.includes("crawl4ai"))
  assert.ok(crawlHeavy.optional.includes("firecrawl"))

  console.log("recommend stack ok")
}

await main()
