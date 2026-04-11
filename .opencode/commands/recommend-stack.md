---
description: 推荐最适合保研项目的插件、MCP、GitHub 组件和本地增强项
agent: advisor
model: openai/gpt-4o
---

请基于当前项目目标，推荐最适合保研项目的 OpenCode 生态组件。

要求：
1. 优先使用内置工具已覆盖的能力，避免重复推荐
2. 对第三方 GitHub 组件，必须说明其接入路径是 plugin / MCP / custom tool / GitHub agent 中的哪一种
3. 对信息搜集增强项，优先考虑动态网页抓取、PDF/Office 通知解析、多页站点 crawling 三类能力
4. 输出：
   - 必装项
   - 强烈建议项
   - 可选项
   - 暂不建议项
   - 一句话安装确认问题
