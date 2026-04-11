# 插件 / Agent / MCP 排查与推荐机制说明

## 1. 排查目标
部署保研顾问项目前，先判断用户当前 OpenCode 环境是否已经具备以下能力：

- 多 agent 基础能力
- 自定义 skills / commands / tools
- 官方网页检索链路
- 动态网页抓取能力
- GitHub 自动化能力
- 资料库接入能力
- 成本与权限可接受性

---

## 2. 排查范围

### 项目级
- `opencode.json` / `opencode.jsonc`
- `.opencode/plugins/`
- `.opencode/agents/`
- `.opencode/skills/`
- `.opencode/tools/`
- `.opencode/commands/`

### 全局级
- `~/.config/opencode/`
- 全局 plugins
- 全局 agents
- 全局 config 中声明的 MCP / plugin / agent

---

## 3. 输出分类
### A. 已有且可复用
已经存在，且与保研项目高度相关。

### B. 建议安装
当前缺失，但对项目价值高。

### C. 可选补强
有价值，但不是第一阶段必需。

### D. 暂不建议
复杂度高、冲突大、收益不够明确。

---

## 4. 推荐时机判断
### 应该推荐 Playwright MCP
- 学校或实验室页面依赖 JS 渲染
- 静态抓取拿不到关键内容
- 需要浏览器交互

### 应该推荐 GitHub agent
- 项目准备放 GitHub 长期维护
- 需要 issues / PR 驱动迭代
- 想要自动化仓库任务

### 应该推荐 GitHub MCP
- 想让 agent 直接读 repo / issue / PR / workflow 状态
- 不满足于只在本地目录里工作

### 不该优先推荐大型插件包
- 当前仍在做第一阶段产品落地
- 更需要稳定、可解释、可控，而不是能力大杂烩

---

## 4.1 已核验组件清单（2026-04-11）
- OpenCode GitHub agent：官方 GitHub 集成，安装命令 `opencode github install`，会引导安装 GitHub App 并创建工作流。
- GitHub MCP server：官方仓库 `github/github-mcp-server`，远程 URL `https://api.githubcopilot.com/mcp/`，支持 toolsets 最小权限配置。
- Playwright MCP：官方仓库 `microsoft/playwright-mcp`，常见接入方式为 `npx -y @playwright/mcp@latest` 的本地 MCP。
- MarkItDown MCP：官方仓库 `microsoft/markitdown` 下的 `packages/markitdown-mcp`，适合把 PDF / Word / Excel 通知转成 Markdown 后再抽取。
- Crawl4AI：社区仓库 `unclecode/crawl4ai`，适合多页 crawling、fit-markdown 过滤和两阶段 URL 发现，建议以 custom tool 或独立服务接入。
- Firecrawl：社区仓库 `firecrawl/firecrawl`，适合 hosted 的 map / scrape / agent 工作流，但默认带来 API key、成本和云依赖。
- @daytona/opencode：Daytona OpenCode 插件，`plugin` 数组加入 `@daytona/opencode`，需要 Daytona API key。
- opencode-openai-codex-auth：社区插件，`npx -y opencode-openai-codex-auth@latest`，明确标注为个人订阅使用，不适合生产/多用户。
- oh-my-openagent（legacy: oh-my-opencode）：社区大型插件包，默认不建议首期安装。

---

## 5. 推荐输出模板
| 组件 | 类型 | 当前状态 | 价值 | 前提 | 风险 | 是否建议 |
|---|---|---|---|---|---|---|

---

## 6. 安装前确认问题模板
建议统一由 agent 在推荐末尾发出：

- 你要不要现在安装最小必要集？
- 你更倾向于：
  1. 只安装必装项  
  2. 安装必装 + 强烈建议项  
  3. 暂时保持纯净环境，先用内置能力跑通  
- 如果安装 GitHub 或 MCP 组件，你是否接受额外权限配置？
- 如果你同意自动补装，我可以直接写入 `opencode.json(c)` 的 `plugin` 和 `mcp` 配置，GitHub Agent 仍需你手动完成 App 安装与工作流配置。

---

## 7. GitHub 组件准入规则
只有满足下列之一，才允许进入候选区：
- OpenCode plugin
- MCP server
- custom tool
- GitHub agent / workflow

否则：
- 只能作为“参考资源”
- 不能作为“默认可调用能力”

---

## 8. 建议的最终默认口径
“我已经排查了你当前的 OpenCode 环境。对于这个保研项目，最小必要集建议保持轻量：先用内置工具跑通主链；如果遇到动态网页抓取不足，再加 Playwright MCP；如果准备长期放 GitHub 维护，再加 GitHub agent 和 GitHub MCP。你要现在安装最小必要集吗？”
