# 保研陪跑 Agent — 内测部署教程

本文档供受邀内测用户使用，请妥善保管访问令牌，不要转发给他人。

---

## 前置要求

在开始之前，请确认你的电脑已安装以下工具：

| 工具 | 最低版本 | 安装地址 |
|------|----------|----------|
| Git | 任意版本 | https://git-scm.com |
| Node.js | 18+ | https://nodejs.org |
| OpenCode CLI | 任意版本 | https://opencode.ai |

> **提示**：安装完成后，打开终端运行 `git --version`、`node --version`、`opencode --version` 确认正常。

---

## 第一步：克隆项目

将下面命令中的 `<访问令牌>` 替换为收到的令牌后，在终端执行：

```bash
git clone https://oauth2:<访问令牌>@github.com/hmdsjbgq-gif/baoyan-opencode-agent-v2.git
cd baoyan-opencode-agent-v2
```

> 示例（令牌为 `github_pat_abc123` 时）：
> ```bash
> git clone https://oauth2:github_pat_abc123@github.com/hmdsjbgq-gif/baoyan-opencode-agent-v2.git
> ```

---

## 第二步：初始化环境

进入项目目录后，运行一键初始化脚本：

```bash
bash setup.sh
```

脚本会自动完成：
- 安装项目依赖（npm）
- 检测并安装 `uv` / `uvx`（用于文档处理能力）
- 验证 OpenCode CLI 是否就绪
- 初始化本地数据目录

---

## 第三步：配置模型

打开项目根目录的 `opencode.jsonc` 文件，将 `model` 和 `small_model` 改为你有访问权限的模型：

```jsonc
{
  "model": "openai/gpt-4o",        // ← 改为你的模型，如 anthropic/claude-sonnet-4-5
  "small_model": "openai/gpt-4o-mini"  // ← 改为对应的轻量模型
}
```

查看本地可用模型：

```bash
opencode models
```

---

## 第四步：启动

在项目根目录运行：

```bash
opencode
```

启动后直接输入你的情况，或使用以下命令：

```
/full-run            一键全流程（推荐第一次使用）
/intake              从自我介绍开始建立画像
/shortlist-schools   生成院校候选池
/find-mentors        搜索导师
/draft-email         生成套磁信
/compare-offers      比较 offer
```

---

## 常见问题

**Q：运行 `bash setup.sh` 报错"Node.js 未找到"**
A：请先安装 Node.js 18+，安装后重新运行脚本。

**Q：`opencode models` 没有我想用的模型**
A：需要在 OpenCode 中配置对应的 provider 和 API Key，参考：https://opencode.ai/docs

**Q：克隆时提示"认证失败"**
A：检查令牌是否完整复制，或联系项目方确认令牌是否有效。

**Q：能否把这个令牌分享给朋友？**
A：不可以，令牌与你的内测资格绑定，转发将导致令牌失效。

---

## 反馈

使用过程中遇到任何问题，请直接联系项目方。
