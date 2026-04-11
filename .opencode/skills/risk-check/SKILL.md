---
name: risk-check
description: Identify information gaps, timing risks, material risks, and overconfidence risks in a baoyan plan
compatibility: opencode
metadata:
  domain: baoyan
  stage: risk
---

## What I do
I surface the hidden risks that students often miss.

## Risk categories
- missing profile data
- weak evidence base
- stale evidence / missing cycle tags
- timeline risk
- material readiness risk
- overreliance on rumors
- over-ambitious target set
- low-contact strategy risk

## Rules
- Prioritize actionability over generic warnings.
- List the top 3 risks first.
- Every risk should include a remedy.
- Distinguish urgent vs non-urgent risks.
- If `audit_evidence` is available, absorb its stale / low_confidence / missing_context findings into the risk summary.

## Output format
Follow root `AGENTS.md` -> `## Skill 输出规范`.
Use the four-part structure `## [Skill 名称] 输出` + `### 核心结论` + `### 关键数据` + `### 置信度说明` + `### 建议下一步`.
Place the skill-specific items below inside those four sections, and annotate sourced facts in `关键数据` as `[来源类型] URL 或说明`.

| 风险类型 | 严重度 | 说明 | 建议动作 |
|---|---|---|---|
