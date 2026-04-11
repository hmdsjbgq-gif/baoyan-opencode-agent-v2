#!/usr/bin/env bash
# setup.sh — 保研陪跑 Agent 一键环境初始化
# 用法：bash setup.sh

set -e

# ─── 颜色输出 ────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

ok()   { echo -e "${GREEN}[✓]${RESET} $*"; }
warn() { echo -e "${YELLOW}[!]${RESET} $*"; }
fail() { echo -e "${RED}[✗]${RESET} $*"; exit 1; }
info() { echo -e "    $*"; }

echo ""
echo "========================================="
echo "  保研陪跑 Agent — 环境初始化"
echo "========================================="
echo ""

# ─── 1. 检查 Node.js ─────────────────────────────────────────
if ! command -v node &>/dev/null; then
  fail "未检测到 Node.js。请先安装 Node.js 18+：https://nodejs.org"
fi
NODE_VER=$(node -e "process.stdout.write(process.version)")
ok "Node.js $NODE_VER"

# ─── 2. 安装 npm 依赖 ─────────────────────────────────────────
echo ""
echo ">>> 安装项目依赖..."

if [ -f "package.json" ]; then
  npm install --silent
  ok "根目录依赖已安装（node_modules/）"
fi

if [ -f ".opencode/package.json" ]; then
  (cd .opencode && npm install --silent)
  ok ".opencode/ 依赖已安装"
fi

# ─── 3. 检查 / 安装 uv（用于 MarkItDown MCP）────────────────
echo ""
echo ">>> 检查 uv / uvx（MarkItDown MCP 依赖）..."

if command -v uvx &>/dev/null; then
  ok "uvx 已就绪（$(uvx --version 2>/dev/null || echo '已安装')）"
else
  warn "未检测到 uvx，正在安装 uv 工具链..."
  if command -v curl &>/dev/null; then
    curl -LsSf https://astral.sh/uv/install.sh | sh
  elif command -v pip3 &>/dev/null; then
    pip3 install uv --quiet
  else
    fail "无法自动安装 uv，请手动安装：https://docs.astral.sh/uv/getting-started/installation/"
  fi

  # 重新加载 PATH
  export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"

  if command -v uvx &>/dev/null; then
    ok "uv 安装完成，uvx 已就绪"
  else
    warn "uv 已安装，请重新打开终端后再次运行本脚本使 uvx 生效"
    warn "或手动执行：source \$HOME/.local/bin/env"
  fi
fi

# ─── 4. 检查 OpenCode CLI ─────────────────────────────────────
echo ""
echo ">>> 检查 OpenCode CLI..."

if command -v opencode &>/dev/null; then
  ok "OpenCode 已安装（$(opencode --version 2>/dev/null || echo '已安装')）"
else
  warn "未检测到 opencode 命令"
  info "请按官方文档安装 OpenCode CLI：https://opencode.ai"
  info "安装后配置 opencode.jsonc 中的 model 字段，再运行 opencode 启动"
fi

# ─── 5. 初始化数据目录 ────────────────────────────────────────
echo ""
echo ">>> 初始化数据目录..."

mkdir -p data/reports
if [ ! -f data/reports/.gitkeep ]; then
  touch data/reports/.gitkeep
fi
ok "data/reports/ 目录已就绪"

# ─── 6. 输出配置提示 ──────────────────────────────────────────
echo ""
echo "========================================="
echo "  初始化完成，下一步："
echo "========================================="
echo ""
echo "  1. 编辑 opencode.jsonc，将 model 改为你有访问权限的模型"
echo "     例如：anthropic/claude-sonnet-4-5"
echo "     可用模型列表：opencode models"
echo ""
echo "  2. 在项目根目录启动 OpenCode："
echo "     opencode"
echo ""
echo "  3. 开始使用："
echo "     /full-run    一键全流程"
echo "     /intake      从自我介绍开始"
echo ""
