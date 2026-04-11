---
name: deployment-readiness-check
description: Produce a final pre-deployment checklist for the baoyan advisor OpenCode project
compatibility: opencode
metadata:
  domain: baoyan
  stage: deployment
---

## What I do
I turn the current audit and recommendation results into a deploy-or-not decision.

## Checklist
- model/provider configured
- key agents available
- key skills present
- project data files initialized
- official-web research path ready
- optional dynamic-web path decided
- GitHub automation path decided
- security and permission review complete
- if auto-apply requested, ensure config is valid JSON and back up before writing

## Output format
Follow root `AGENTS.md` -> `## Skill 输出规范`.
Use the four-part structure `## [Skill 名称] 输出` + `### 核心结论` + `### 关键数据` + `### 置信度说明` + `### 建议下一步`.
Place the skill-specific items below inside those four sections, and annotate sourced facts in `关键数据` as `[来源类型] URL 或说明`.

### 可部署性结论
### 阻塞项
### 建议立即补装项
### 可后装项
### 是否现在执行安装确认
### 若授权自动补装：已写入项与仍需手动完成项
