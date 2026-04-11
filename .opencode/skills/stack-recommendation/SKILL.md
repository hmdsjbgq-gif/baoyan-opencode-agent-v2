---
name: stack-recommendation
description: Recommend the most suitable plugins, MCP servers, GitHub components, and local project additions for the baoyan advisor
compatibility: opencode
metadata:
  domain: baoyan
  stage: deployment
---

## What I do
I recommend the most suitable ecosystem components for the baoyan advisor project.

## Recommendation priorities
1. dynamic website access when official pages are JS-heavy
2. PDF / Word / Excel notice parsing into Markdown before evidence extraction
3. site-wide crawling when one-off page fetch is not enough
4. GitHub automation for repo maintenance and issue/PR workflows
5. safe ecosystem expansion with auditable installation paths
6. avoid redundant tools when OpenCode built-ins already solve the problem

## Recommendation buckets
- Must-have
- Strongly recommended
- Optional
- Not recommended now

## Decision rules
- Prefer built-in OpenCode tools first.
- Recommend Playwright MCP only when dynamic or interactive pages are common.
- Recommend MarkItDown MCP when official notices are often distributed as PDF / Office attachments.
- Recommend Crawl4AI only when multi-page crawling, fit-markdown filtering, or discovery-first crawling adds clear value beyond Playwright.
- Recommend GitHub MCP when repository / issue / PR automation is part of the workflow.
- Recommend GitHub agent when the project will be maintained through issues and pull requests.
- Treat hosted crawl APIs such as Firecrawl as optional unless the user explicitly accepts API-key / cloud dependency tradeoffs.
- Do not recommend broad "kitchen sink" plugins as defaults unless the user accepts extra complexity.
- Prefer components listed in `data/stack_registry.json`. If you must mention anything else, label it as user-provided and uncurated.

## Output format
Follow root `AGENTS.md` -> `## Skill 输出规范`.
Use the four-part structure `## [Skill 名称] 输出` + `### 核心结论` + `### 关键数据` + `### 置信度说明` + `### 建议下一步`.
Place the skill-specific items below inside those four sections, and annotate sourced facts in `关键数据` as `[来源类型] URL 或说明`.

| 组件 | 类型 | 价值 | 安装方式 | 风险/前提 | 是否建议现在安装 |
|---|---|---|---|---|---|

### 用户确认问题
- ...
