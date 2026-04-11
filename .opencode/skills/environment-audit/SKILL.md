---
name: environment-audit
description: Audit the current OpenCode stack before deploying the baoyan advisor project
compatibility: opencode
metadata:
  domain: baoyan
  stage: deployment
---

## What I do
I inspect the current OpenCode environment and summarize what is already installed and what is missing.

## Audit targets
- project-level `opencode.json` or `opencode.jsonc`
- global OpenCode config if accessible
- `.opencode/plugins/`
- `.opencode/agents/`
- `.opencode/tools/`
- `.opencode/commands/`
- package dependencies used by local plugins/tools
- MCP declarations and their enabled/disabled state

## Output format
Follow root `AGENTS.md` -> `## Skill 输出规范`.
Use the four-part structure `## [Skill 名称] 输出` + `### 核心结论` + `### 关键数据` + `### 置信度说明` + `### 建议下一步`.
Place the skill-specific items below inside those four sections, and annotate sourced facts in `关键数据` as `[来源类型] URL 或说明`.

### 当前已发现组件
- ...

### 与保研项目直接相关的能力
- ...

### 缺失能力
- ...

### 可能冲突或冗余
- ...

### 部署前结论
- 可直接部署 / 需补装关键组件 / 需先清理冲突
### 若用户要求自动补装
- 配置是否为有效 JSON（非 JSONC 注释）
- 需要自动写入的 plugin/mcp 项
- 仍需手动完成的 GitHub 安装步骤
