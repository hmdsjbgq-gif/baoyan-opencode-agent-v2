---
name: school-program-search
description: Search official school and department sources for baoyan-relevant programs, notices, requirements, and deadlines
compatibility: opencode
metadata:
  domain: baoyan
  stage: research
---

## What I do
I search and extract school / department / program / summer camp / pre-recommendation information.

## Source priority
1. official university site
2. official department site
3. official admissions brochure
4. official PDF notice
5. lab or faculty page

## Extraction fields
- university
- department
- program
- degree_type
- notice_type
- topic_type
- applicable_cycle
- publish_date
- deadline
- eligibility
- required_materials
- english_requirement
- contact_info
- source_url
- source_type
- verified
- reliability_tier
- review_after

## Rules
- Prefer official sources.
- Follow `official-source-research` when available: official domains first, then dynamic-page / attachment fallback.
- Keep dates explicit.
- If requirements differ across years, label the year clearly.
- For deadlines / eligibility / materials facts, store explicit `source_authority` and `applicable_cycle` such as `department_official` + `2026夏令营`.
- Time-sensitive admissions facts should prefer `university_official` / `department_official` / `graduate_admissions_official`.
- Save each verified claim to the evidence store.
- If a claim is time-sensitive but missing year/cycle or publish date, flag it as incomplete instead of using it as a hard conclusion.
- Make it easy for students to compare across schools.

## Output format
Follow root `AGENTS.md` -> `## Skill 输出规范`.
Use the four-part structure `## [Skill 名称] 输出` + `### 核心结论` + `### 关键数据` + `### 置信度说明` + `### 建议下一步`.
Place the skill-specific items below inside those four sections, and annotate sourced facts in `关键数据` as `[来源类型] URL 或说明`.

| 学校 | 学院/项目 | 通知类型 | 发布时间 | 截止时间 | 关键条件 | 来源 | 是否官方 |
|---|---|---|---|---|---|---|---|
