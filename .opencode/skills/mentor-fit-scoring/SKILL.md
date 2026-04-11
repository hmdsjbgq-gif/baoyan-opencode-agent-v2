---
name: mentor-fit-scoring
description: Score mentor fit using research overlap, trajectory, student goals, and public risk signals
compatibility: opencode
metadata:
  domain: baoyan
  stage: scoring
---

## What I do
I make mentor selection more systematic.

## Dimensions and suggested weights
- research_overlap: 30
- direction_continuity: 15
- admissions_stability: 15
- goal_alignment: 15
- productivity_signal: 10
- public_info_completeness: 5
- risk_penalty: 10

## Rules
- Research overlap matters most.
- Penalize unclear or weak public info.
- Do not turn rumors into hard deductions.
- If a student wants employment, call out excessively publication-driven paths.
- If a student wants direct PhD, favor long-term topic continuity.

## Output format
Follow root `AGENTS.md` -> `## Skill 输出规范`.
Use the four-part structure `## [Skill 名称] 输出` + `### 核心结论` + `### 关键数据` + `### 置信度说明` + `### 建议下一步`.
Place the skill-specific items below inside those four sections, and annotate sourced facts in `关键数据` as `[来源类型] URL 或说明`.

| 导师 | 研究方向匹配 | 目标适配 | 风险分 | 总体匹配 | 建议 |
|---|---:|---:|---:|---:|---|
