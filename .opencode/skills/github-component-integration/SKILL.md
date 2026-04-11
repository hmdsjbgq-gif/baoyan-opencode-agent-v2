---
name: github-component-integration
description: Evaluate how to safely integrate third-party GitHub plugins, agents, and MCP servers into the baoyan advisor project
compatibility: opencode
metadata:
  domain: baoyan
  stage: deployment
---

## What I do
I decide whether a GitHub-hosted component can be safely integrated into this project.

## Acceptable integration paths
- npm OpenCode plugin
- local plugin copied into `.opencode/plugins/`
- MCP server added to OpenCode config
- custom tool adapted into `.opencode/tools/`
- GitHub Actions based automation via OpenCode GitHub agent

## Rejection conditions
- unclear install path
- excessive permissions
- abandoned or obviously low-trust project
- duplicates a built-in tool without clear benefit
- requires cloud credentials the user does not want to grant

## Output format
Follow root `AGENTS.md` -> `## Skill 输出规范`.
Use the four-part structure `## [Skill 名称] 输出` + `### 核心结论` + `### 关键数据` + `### 置信度说明` + `### 建议下一步`.
Place the skill-specific items below inside those four sections, and annotate sourced facts in `关键数据` as `[来源类型] URL 或说明`.

### 集成方式
### 权限边界
### 维护风险
### 是否建议纳入本项目
### 参考来源（仓库或官方文档）
