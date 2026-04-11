---
name: official-source-research
description: Run official-source-first deep web research for mainland university, department, faculty, and lab information, then save authority-aware evidence
compatibility: opencode
metadata:
  domain: baoyan
  stage: research
---

## What I do
I turn vague "去网上查" tasks into a repeatable official-source-first research workflow.

## Source hierarchy
1. university official notice / graduate admissions page
2. department / school / institute official page
3. faculty homepage / lab homepage
4. official PDF / Word / Excel attachments
5. paper list / academic profile
6. public discussion only as auxiliary reference

## Deep-research workflow
1. Search official domains first, especially `*.edu.cn` and known school / department domains.
2. Fetch the official page and extract explicit year, cycle, publish date, deadline, materials, contacts, or research directions.
3. If the official page is JS-heavy, paginated, or click-to-expand, escalate to `Playwright MCP`.
4. If the key notice is in PDF / Word / Excel, convert it with `MarkItDown MCP` before extraction.
5. If the same school or lab information is scattered across many pages, use `Crawl4AI` or another site-wide crawl workflow only after steps 1-4 are insufficient.
6. Save verified facts into `evidence_store.json` with `source_type`, `source_authority`, `applicable_cycle`, `published_at`, and `verified`.
7. Before using those facts as hard conclusions, run `audit_evidence` and downgrade anything stale, weak-authority, missing-cycle, or public-discussion-only.

## `source_authority` mapping
| 页面类型 | `source_type` | `source_authority` |
|---|---|---|
| 学校官网 / 研究生院通知 | `official` | `university_official` / `graduate_admissions_official` |
| 学院 / 系 / 研究院官网 | `official` | `department_official` |
| 导师主页 | `official` | `faculty_official` |
| 实验室主页 | `official` | `lab_official` |
| 论文正文 / 官方论文列表 | `academic` | `paper` |
| Google Scholar / DBLP / ORCID 等学术档案 | `academic` | `academic_profile` |
| 论坛 / 小红书 / 贴吧 / 经验贴 | `public_discussion` | `forum_or_social` |

## Rules
- Current-cycle official notice beats historical notice.
- Historical notices can be used only as reference, never as current-cycle hard facts.
- Time-sensitive admissions facts should prefer `university_official` / `department_official` / `graduate_admissions_official`.
- Faculty or lab pages can support research-direction analysis, but their招生信息 should be treated as weaker than school-level notices.
- Public discussion can suggest leads, but cannot independently support key conclusions.

## Output format
Follow root `AGENTS.md` -> `## Skill 输出规范`.
Use the four-part structure `## [Skill 名称] 输出` + `### 核心结论` + `### 关键数据` + `### 置信度说明` + `### 建议下一步`.
Place the skill-specific items below inside those four sections, and annotate sourced facts in `关键数据` as `[来源类型] URL 或说明`.
