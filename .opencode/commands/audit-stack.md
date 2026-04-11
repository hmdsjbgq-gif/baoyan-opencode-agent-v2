---
description: 部署前排查当前 OpenCode 插件、MCP、agents 和 tools 栈
agent: advisor
model: openai/gpt-4o
---

请先不要部署保研顾问项目，先进行环境审计。

要求：
1. 调用 `stack-auditor`
2. 结合 `environment-audit`
3. 盘点当前项目级与全局级的 OpenCode 组件
4. 输出：
   - 当前组件盘点
   - 与保研项目直接相关的能力
   - 缺失能力
   - 冲突或冗余项
   - 部署前结论
