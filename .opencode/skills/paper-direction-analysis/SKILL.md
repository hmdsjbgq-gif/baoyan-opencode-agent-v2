---
name: paper-direction-analysis
description: Infer a mentor's recent active research themes from recent papers and map them to student background overlap
compatibility: opencode
metadata:
  domain: baoyan
  stage: research-fit
---

## What I do
I read recent paper titles / abstracts / topics and summarize active research themes.

## Analysis window
Prefer the last 3 years. If data is sparse, extend to 5 years and note that.

## What to extract
- recurring keywords
- active subtopics
- methodological preferences
- applied domains
- whether the direction is stable or drifting
- likely overlap with the student

## Rules
- Use papers to infer research activity, not personality or lab culture.
- Keep inference bounded and explicit.
- Separate topic continuity from one-off publications.
- Prefer trends over isolated titles.

## Output format
Follow root `AGENTS.md` -> `## Skill 输出规范`.
Use the four-part structure `## [Skill 名称] 输出` + `### 核心结论` + `### 关键数据` + `### 置信度说明` + `### 建议下一步`.
Place the skill-specific items below inside those four sections, and annotate sourced facts in `关键数据` as `[来源类型] URL 或说明`.

### 近年研究方向摘要
- 核心主题：
- 高频关键词：
- 方向是否稳定：
- 学生可对齐的切入点：
- 套磁时可引用的点：
