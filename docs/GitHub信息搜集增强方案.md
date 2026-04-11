# GitHub 信息搜集增强方案

面向当前保研顾问项目，信息搜集能力最值得补的不是“更多模型”，而是三类 GitHub 上已经成熟的方法：

1. 动态网页访问
2. 官方 PDF / Office 通知转 Markdown
3. 多页站点 crawling 与两阶段发现

## 推荐分层

| 分层 | 组件 | 接入路径 | 适合解决的问题 | 主要风险 |
|---|---|---|---|---|
| 强烈建议 | Playwright MCP | MCP | 学院官网、实验室主页、分页/点击加载页面 | 浏览器依赖，调试成本高于内置 webfetch |
| 强烈建议 | MarkItDown MCP | MCP | 招生简章 PDF、学院通知附件、Excel/Word 表格公告 | 本地 trusted-agent 场景更安全，暴露 HTTP 时需严格限本机 |
| 可选 | Crawl4AI | custom tool / MCP service | 多页站点批量抓取、fit-markdown 过滤、先发现 URL 再定向抓取 | 部署更重，维护成本高于 Playwright |
| 可选 | GitHub MCP server | MCP | 后续把抓取任务、证据刷新、审计结果接进 GitHub issue / workflow | 需要 PAT / OAuth 和最小权限配置 |
| 暂不建议默认安装 | Firecrawl | MCP / hosted API | 需要 hosted map / scrape / agent 工作流时能快速起量 | API key、成本、云依赖、自托管复杂度 |

## 项目内建议顺序

### 第一阶段
- 保持当前内置 `websearch` / `webfetch`
- 加 `Playwright MCP`
- 加 `MarkItDown MCP`（优先用 `uvx --from markitdown-mcp markitdown-mcp` 作为本地命令）

### 第二阶段
- 如果学校/学院站点需要多页 crawling，再引入 `Crawl4AI`
- 如果准备长期 GitHub 化维护证据刷新，再补 `GitHub MCP server` 或 GitHub agent

### 第三阶段
- 只有在明确接受云依赖和 API 成本时，再评估 `Firecrawl`

## 为什么是这组

- `microsoft/playwright-mcp`：适合 JS-heavy 页面和真实浏览器交互。
- `microsoft/markitdown` / `markitdown-mcp`：适合把 PDF / Word / Excel 通知变成 Markdown，和你现有 `evidence_store` 最契合。
- `unclecode/crawl4ai`：适合学校站点这种“入口页 + 多级栏目 + 大量详情页”的批量收集。
- `github/github-mcp-server`：不是直接抓网页，但适合把后续采集、复核、告警流程纳入 GitHub 自动化。
- `firecrawl/firecrawl`：能力强，但默认会把项目带向 hosted crawl API 依赖，不适合作为第一阶段默认方案。

## 参考来源

- Playwright MCP: https://github.com/microsoft/playwright-mcp
- MarkItDown: https://github.com/microsoft/markitdown
- MarkItDown MCP: https://github.com/microsoft/markitdown/tree/main/packages/markitdown-mcp
- Crawl4AI: https://github.com/unclecode/crawl4ai
- GitHub MCP Server: https://github.com/github/github-mcp-server
- Firecrawl: https://github.com/firecrawl/firecrawl
