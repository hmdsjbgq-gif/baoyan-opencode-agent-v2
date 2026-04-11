---
name: reach-match-safety
description: Convert school and mentor comparisons into practical 冲 / 稳 / 保 groupings without claiming admission probabilities
compatibility: opencode
metadata:
  domain: baoyan
  stage: decision
---

## What I do
I map the candidate list into 冲 / 稳 / 保.

## Definitions
- 冲: ambitious target; stronger competition or higher threshold than the student's current baseline
- 稳: realistic target with workable preparation path
- 保: comparatively safer target under reasonable preparation

## Rules
- Never claim certainty of admission.
- Use relative wording.
- Explain the single biggest reason for each classification.
- Keep the balance reasonable; avoid all targets landing in one bucket.

## Output format
Follow root `AGENTS.md` -> `## Skill 输出规范`.
Use the four-part structure `## [Skill 名称] 输出` + `### 核心结论` + `### 关键数据` + `### 置信度说明` + `### 建议下一步`.
Place the skill-specific items below inside those four sections, and annotate sourced facts in `关键数据` as `[来源类型] URL 或说明`.

### 冲
- ...

### 稳
- ...

### 保
- ...

### 说明
- 本分层是基于公开信息、相对竞争强度与当前画像的决策辅助，不构成录取承诺。
