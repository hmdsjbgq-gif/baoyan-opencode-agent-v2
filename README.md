# 保研陪跑 Agent（OpenCode 多 Agent 骨架）

面向中国大陆 **理工科本科生保研** 场景的 OpenCode 多 agent 项目。

目标：把学生从"大三上保研小白"带到"有完整画像、院校池、导师池、套磁材料和行动计划"的状态。

## 快速开始

### 1. 安装 OpenCode

按 [OpenCode 官方文档](https://opencode.ai) 完成安装，并配置好 provider。

### 2. 安装依赖

```bash
npm install
```

### 3. 配置模型

项目默认配置为：
- 主力模型：`openai/gpt-4o`（可替换为你有权限访问的任意 provider/model，如 `anthropic/claude-sonnet-4-5`）
- 轻量模型：`openai/gpt-4o-mini`（用于画像采集、信息检索等轻量任务）

先查看本地可用模型：

```bash
opencode models
```

然后在 `opencode.jsonc` 中按实际模型名修改 `model` 和 `small_model` 字段。

### 4. 启动

在项目根目录运行 OpenCode，然后使用命令：

```bash
/intake              # 采集学生画像
/shortlist-schools   # 生成院校候选池
/find-mentors 机器学习  # 检索指定方向导师
/draft-email 某导师     # 生成套磁信
/full-run            # 全流程一键运行
```

### 5. 快速验证（推荐）

使用示例画像跑通全流程，验证系统是否正常：

```bash
# 复制示例画像作为初始数据（可选）
cp data/examples/student_profile_example.json data/student_profile.json
# 启动并运行
opencode
/full-run
```

---

## 架构一览

```
advisor（主控）
├── profile-intake       画像采集与背景评估
├── school-researcher    院校/项目/通知检索
├── mentor-analyst       导师/实验室/论文分析
├── writing-coach        套磁信/简历/自述/面试准备
└── stack-auditor        部署前生态栈排查与推荐

data/
├── student_profile.json   学生画像（持久化状态）
├── evidence_store.json    证据库（可核验来源 + 适用轮次 + 复核时间）
├── user_memory.json       本地压缩记忆（默认 1500 字符）
└── stack_registry.json    生态组件推荐清单
```

**Commands**：`/intake`、`/shortlist-schools`、`/find-mentors`、`/draft-email`、`/compare-offers`、`/full-run`、`/audit-evidence`、`/audit-stack`、`/recommend-stack`、`/deploy-readiness`、`/auto-deploy-stack`

**Skills**（20 个）：画像采集、背景评估、官方深搜、择校、导师、套磁、简历、自述、面试、offer 比较、部署审计等。详见 [`.opencode/skills/`](.opencode/skills/)

---

## 设计原则

1. 先画像，后判断
2. 官网优先，经验贴辅助
3. 不输出量化录取概率，只输出"冲 / 稳 / 保"
4. 导师风格、组氛围等高风险信息必须标注不确定性
5. 所有关键结论尽量绑定来源与证据
6. 每次用户提问后自动更新本地画像与压缩记忆
7. 时效性强的证据必须显式记录适用年份/轮次，并保留复核时间
8. 联网研究走“学校/研究生院/学院官网 -> 导师/实验室主页 -> 论文 -> 公开讨论”的分层链路

## 官方来源优先的深度联网研究链

1. 先搜学校官网、研究生院、学院/系/研究院官网。
2. 若官方页面为 JS 动态站，升级到 `Playwright MCP`。
3. 若关键信息在 PDF / Word / Excel 通知附件，升级到 `MarkItDown MCP`。
4. 若同一学校或实验室信息分散在多页栏目，再考虑 `Crawl4AI` 做站点级 crawling。
5. 所有关键事实落到 `evidence_store.json` 时补齐 `source_type`、`source_authority`、`applicable_cycle`、`published_at`。
6. 汇总结论前先跑 `audit_evidence`，把 `stale`、`low_confidence`、`weak_authority`、`missing_context` 项降级为风险或待核验。

---

## 进一步阅读

- [细致版增强优化方案](docs/细致版增强优化方案.md)——部署层设计原理、生态栈排查逻辑
- [插件 Agent 排查与推荐机制](docs/插件Agent排查与推荐机制.md)——GitHub 组件准入规则与推荐分层
- [GitHub 信息搜集增强方案](docs/GitHub信息搜集增强方案.md)——面向动态网页、PDF 通知、多页站点的现成方法接入建议
- [行为规则与决策约定](AGENTS.md)——agent 行为边界、输出规范、风险政策

---

## 适用场景

- 大三上开始准备保研，需要系统建立个人画像
- 基于官方信息筛选院校与导师
- 生成个性化套磁信、简历、自述
- 结构化比较多个 offer

## 重要提醒

- 本项目面向**中国大陆理工科保研**，以**官网、学院官网、导师主页、正式通知**为高优先级信息源
- 不建议把匿名经验贴直接当事实
- `evidence_store.json` 建议为每条关键证据补齐 `topic_type`、`source_authority`、`applicable_cycle`、`published_at`、`review_after`、`reliability_tier`
- 对招生条件、截止时间、材料要求这类高时效事实，优先使用 `university_official`、`department_official`、`graduate_admissions_official`
- 导师主页与实验室主页可支撑方向分析，但其招生表述默认弱于学院或研究生院正式通知
- 对截止时间、报名条件、材料要求这类高时效信息，缺少明确年份/轮次时不要直接用于结论
- 套磁信必须个性化，见 [`prompts/templates/cold_email_framework.md`](prompts/templates/cold_email_framework.md)
- 用户对话记忆默认压缩到 `data/user_memory.json` 的 `memory_text` 字段，超过 1500 字符会自动提炼
- 用户自由文本会优先经过 `ingest_user_message`，自动完成“画像抽取 + 本地记忆更新 + 待确认问题消解”
- `data/user_memory.json` 还会维护 `recent_entities`，用于解析“这个老师 / 那个学校 / 这个方向”这类多轮指代
- 可运行 `npm run check:memory` 做本地回归，验证 1500 字符压缩、多轮学校/导师指代和显式 `false` 材料状态不会回退
- 可运行 `npm run check:stack` 验证信息搜集相关栈推荐没有回退
- 可运行 `node --input-type=module --experimental-strip-types -e \"import auditEvidence from './.opencode/tools/audit_evidence.ts'; console.log(JSON.stringify(await auditEvidence.execute({ entity_keywords: ['清华大学'], applicable_cycles: ['2026夏令营'] }, { worktree: process.cwd() }), null, 2))\"` 对当前学校/轮次做精准证据审计

## License

建议自行补充开源协议。
