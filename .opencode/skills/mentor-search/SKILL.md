---
name: mentor-search
description: Search mentor and lab information, summarize research fit, and separate verified facts from uncertain public impressions
compatibility: opencode
metadata:
  domain: baoyan
  stage: mentor
---

## What I do
I analyze mentors and labs for baoyan matching.

## Verified facts
- faculty title
- department affiliation
- official research interests
- lab homepage
- recent publications
- admissions signals if public

## Uncertain signals
- responsiveness
- management style
- lab atmosphere
- push level
- alumni anecdotes

## Rules
- Separate verified facts from uncertain impressions.
- Follow `official-source-research` when available: faculty/lab pages and papers first, public discussion last.
- Use recent papers to infer active directions.
- Do not present rumors as facts.
- Save each verified mentor or招生事实 to the evidence store before using it as a key conclusion, and record `source_authority`.
- For admissions signals or deadline-like mentor facts, store explicit `applicable_cycle` and publish date before treating them as reliable.
- Treat `faculty_official` / `lab_official` admissions signals as weaker than school-level official notices; surface that in the confidence section.
- Provide a suitability summary for research-oriented vs employment-oriented students.

## Output format
Follow root `AGENTS.md` -> `## Skill 输出规范`.
Use the four-part structure `## [Skill 名称] 输出` + `### 核心结论` + `### 关键数据` + `### 置信度说明` + `### 建议下一步`.
Place the skill-specific items below inside those four sections, and annotate sourced facts in `关键数据` as `[来源类型] URL 或说明`.

### 导师分析卡
- 导师：
- 学院：
- 官方研究方向：
- 近年活跃主题：
- 学生匹配点：
- 风险点：
- 套磁优先级：

### 信息可信度
- 已证实：
- 公开讨论但未证实：
- 仍需自行核验：
