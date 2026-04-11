---
name: camp-notice-search
description: Search and compare summer camp and pre-recommendation notices with explicit dates, materials, and eligibility
compatibility: opencode
metadata:
  domain: baoyan
  stage: deadlines
---

## What I do
I focus specifically on summer camp and pre-recommendation notices.

## Required extraction
- year
- university
- department
- notice_type
- publish_date
- deadline
- application link
- required materials
- english requirement
- whether interview / written test is mentioned
- source_url

## Rules
- Always show the year.
- Follow `official-source-research` when available: official notice page first, attachment and dynamic-page fallback second.
- When only last year's notice exists, say it is historical reference.
- Distinguish published vs inferred deadline.
- Highlight deadlines that are close.
- For each notice fact, record `source_authority`; current-cycle notice should preferably come from `university_official` / `department_official` / `graduate_admissions_official`.
- If there is no current notice, state that clearly.

## Output format
Follow root `AGENTS.md` -> `## Skill 输出规范`.
Use the four-part structure `## [Skill 名称] 输出` + `### 核心结论` + `### 关键数据` + `### 置信度说明` + `### 建议下一步`.
Place the skill-specific items below inside those four sections, and annotate sourced facts in `关键数据` as `[来源类型] URL 或说明`.

### 通知时间线
| 年份 | 学校 | 学院/项目 | 类型 | 发布时间 | 截止时间 | 材料 | 来源 |
|---|---|---|---|---|---|---|---|

### 风险提醒
- 已发布但临近截止：
- 只有历史通知：
- 仍需持续跟踪：
