---
description: 执行补装——将推荐组件写入 opencode.json(c)（前置条件：必须已运行 /deploy-readiness 并获得用户授权）
agent: advisor
model: openai/gpt-4o
---

## 职责定义

**本命令只做执行，不做诊断。**

前置条件：用户必须已经运行过 `/deploy-readiness` 并明确授权执行安装。
如果尚未诊断，请先运行 `/deploy-readiness`。

---

## 执行步骤

1. 确认用户已授权（若无上下文中的授权记录，向用户确认再继续）
2. 调用 `build_stack_plan` 生成安装计划：
   - 仅包含可自动写入配置的组件（OpenCode plugin、MCP server）
   - 排除需要人工操作的组件（GitHub App、GitHub Actions 工作流）
3. 调用 `apply_stack_plan` 将 `plugin` 与 `mcp` 条目写入 `opencode.json(c)`
4. 输出结果：

---

## 输出格式

```
## 执行结果

### 已自动写入
[成功写入 opencode.json(c) 的组件列表]

### 需人工完成
[无法自动写入、需手动操作的组件，附操作步骤]
例如：
- OpenCode GitHub agent：需在 GitHub 仓库中安装 GitHub App，见官方文档
- GitHub MCP server：需手动配置 GitHub token

### 风险与权限提醒
- 所有写入操作已记录在配置文件变更中
- 请重启 OpenCode 使新配置生效

### 写入的配置路径
[opencode.jsonc 或 opencode.json 的完整路径]
```
