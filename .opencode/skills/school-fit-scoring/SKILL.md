---
name: school-fit-scoring
description: Score school and program fit using profile fit, direction fit, preferences, and execution feasibility
compatibility: opencode
metadata:
  domain: baoyan
  stage: scoring
---

## What I do
I turn school matching into a consistent scoring process.

## Dimensions and suggested weights
- academic_fit: 25
- direction_fit: 20
- tier_fit: 15
- city_fit: 10
- resource_fit: 10
- outcome_fit: 10
- execution_fit: 10

## Rules
- Use weights consistently across compared options.
- Do not hide low execution feasibility.
- Explain why a lower-tier program can still be a strong fit.
- If core profile data is missing, reduce confidence.

## Output format
Follow root `AGENTS.md` -> `## Skill 输出规范`.
Use the four-part structure `## [Skill 名称] 输出` + `### 核心结论` + `### 关键数据` + `### 置信度说明` + `### 建议下一步`.
Place the skill-specific items below inside those four sections, and annotate sourced facts in `关键数据` as `[来源类型] URL 或说明`.

| 学校 | 学院/项目 | 匹配分 | 核心优势 | 主要短板 | 结论 |
|---|---|---:|---|---|---|
