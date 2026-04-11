---
name: background-evaluation
description: Evaluate the student's competitiveness for baoyan and summarize strengths, weaknesses, and readiness
compatibility: opencode
metadata:
  domain: baoyan
  stage: evaluation
---

## What I do
I convert a student profile into a practical competitiveness summary.

## Evaluation dimensions
- academic foundation
- rank competitiveness
- english readiness
- research readiness
- project / competition support
- direction clarity
- material readiness

## Rules
- Do not overpromise admission outcomes.
- Use relative language, not false precision.
- If rank or research is missing, reduce confidence.
- If profile is incomplete, say what prevents a stronger judgment.
- Explicitly separate "current strength" from "still improvable".

## Output format
Follow root `AGENTS.md` -> `## Skill 输出规范`.
Use the four-part structure `## [Skill 名称] 输出` + `### 核心结论` + `### 关键数据` + `### 置信度说明` + `### 建议下一步`.
Place the skill-specific items below inside those four sections, and annotate sourced facts in `关键数据` as `[来源类型] URL 或说明`.

### Competitiveness Summary
- Current level:
- Confidence level:
- Main strengths:
- Main weaknesses:
- Biggest gap before summer camp:
- Biggest gap before pre-recommendation:

### Advice
- Immediate fix:
- Important fix:
- Optional upgrade:
