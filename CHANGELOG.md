# Changelog

## v2.5 — 2026-04-11（多轮记忆回归加固）

### 新增能力
- **扩展多轮指代解析**：`extract_profile_patch.ts` 现支持“这两个学校 / 前两个老师 / 第一个方向 / 他那个课题组”等复数、序号与组别代称
- **新增本地回归脚本**：加入 `scripts/check_memory_ingest.ts` 与 `npm run check:memory`，覆盖 1500 字符压缩、多轮实体归并与显式 `false` 状态写盘

### 流程优化
- **上下文备注更完整**：多轮解析后的学校、导师、方向指代现在都会写入 `notes`，便于后续 agent 判断本轮信息来自显式输入还是上下文归并

## v2.2 — 2026-04-11（本地记忆自动更新）

### 新增能力
- **新增 `user_memory.json`**：加入对话级本地压缩记忆文件，默认维护 `memory_text` 摘要并限制在 1500 字符内
- **新增 `load_user_memory.ts` / `upsert_user_memory.ts`**：支持每轮用户提问后自动读取、更新、压缩本地记忆，并可同步把结构化 patch 写回 `student_profile.json`
- **自动补全缺失项**：`upsert_user_memory.ts` 会根据当前画像自动刷新 `missing_fields`，减少多轮对话后画像与真实状态脱节

### 流程接入
- **advisor / intake / full-run 接入本地记忆链路**：主控与画像采集流程现在会优先读取本地记忆，并在每轮有新信息时回写画像与问题摘要
- **数据校验脚本扩展**：`npm run check:data` 现会同时校验 `data/user_memory.json`

## v2.3 — 2026-04-11（自由文本画像抽取）

### 新增能力
- **新增 `extract_profile_patch.ts`**：支持从用户自然语言中抽取年级、GPA、排名、英语、城市偏好、目标方向、学位偏好、材料进度和阶段信息
- **新增方向字段**：`student_profile.json` 的 `preferences` 下新增 `target_directions`

### 流程优化
- **advisor / intake / full-run 先抽取再落盘**：每轮用户消息会先做自由文本画像抽取，再写入 `student_profile.json` 与 `user_memory.json`
- **压缩记忆摘要纳入方向信息**：`user_memory.json` 的摘要现在会包含结构化的方向偏好

## v2.4 — 2026-04-11（单入口消息摄入）

### 新增能力
- **新增 `ingest_user_message.ts`**：将“自由文本画像抽取 + 本地记忆更新 + 已回答问题消解”合并为单个工具入口
- **补充目标实体抽取**：`extract_profile_patch.ts` 新增目标院校与目标导师的 best-effort 抽取，并自动写入 `application_state`
- **新增最近实体记忆**：`user_memory.json` 新增 `recent_entities`，支持“这个老师 / 那个学校 / 这个方向”的多轮指代解析

### 流程优化
- **advisor 与核心命令改用单入口摄入**：`/intake`、`/full-run`、`/shortlist-schools`、`/find-mentors` 现在优先走 `ingest_user_message`

## v2.1 — 2026-04-11（流程一致性修复）

### 关键修复
- **修复 `save_evidence.ts` 更正语义**：`supersede` 模式下，新 claim 不再错误保留 `superseded_by`；新增重复 `id` 拦截与“旧 claim 已过期”校验，避免证据链同时把新旧记录都视为失效
- **统一命令模型配置**：将残留在 8 个 command 文件中的 `openai/gpt-5` 全部替换为可用的 `openai/gpt-4o`
- **优化 `merge_profile.ts` 数组合并**：默认 `merge` 模式改为按 `id` / `name` / `title` 优先合并，并对完全重复项去重，降低多轮画像采集后的重复记录风险

### 一致性优化
- **对齐画像采集 schema**：`student-profile-intake` 改为使用 `student_profile.json` 的真实路径字段（如 `basic.school`、`academic.english`、`application_state.materials_ready`），并补充 `current_stage` 规范化要求
- **强化主流程闭环**：`/intake`、`/full-run`、`/shortlist-schools`、`/find-mentors`、`/draft-email` 明确要求走画像持久化、证据入库、风险提示和时间线生成链路
- **补充数据契约说明**：`student_profile.json` 新增 `current_stage` 枚举说明；`evidence_store.json` 明确只有旧 claim 才应携带 `superseded_by`

## v2.0 — 2026-04-11（精细化优化版）

### Bug 修复（Tier 1）
- **修正假造的模型名**：`openai/gpt-5` / `gpt-5-mini` → `openai/gpt-4o` / `gpt-4o-mini`，修复所有 6 个 agent 文件及 `opencode.jsonc`
- **JSONC 解析**：确认 `apply_stack_plan.ts` 已通过项目内置 `jsonc.ts` 正确处理注释，无需引入外部依赖
- **修复 `merge_profile` 数组覆盖 Bug**：`deepMerge` 中数组合并从"覆盖"改为"追加"，新增 `mode: "merge" | "replace"` 参数支持显式覆盖场景
- **修复 `profile-intake` 权限冲突**：`write: false` 改为 `write: ask`，允许该 agent 调用 `save_profile` / `merge_profile` 写入画像文件

### 逻辑优化（Tier 2）
- **补全 npm 依赖**：`package.json` 和 `.opencode/package.json` 新增 `dayjs: ^1.11.13`
- **`build_timeline` 动态化**：新增 `start_date` 参数，使用 `dayjs` 生成含实际日期范围的时间线标签，替代硬编码月份字符串
- **细化评分 Rubric**：`school_scoring.md` 和 `mentor_scoring.md` 新增各维度三档标准（分值区间 + 具体判断标准），覆盖院校 7 个维度、导师 6 个维度 + 风险扣分
- **澄清命令职责**：`/deploy-readiness` 只做诊断不写入；`/auto-deploy-stack` 只做执行需前置授权
- **扩展 `student_profile.json` 结构**：`experience.papers` 拆分为 `publications` 与 `readings`；`grade` 补充推荐枚举说明；`lab_style_preference` 改为结构化的 `lab_style` 对象；`materials_ready.email_template` 改名为 `cold_email_ready`；新增 `application_round` 和 `current_stage` 字段
- **`save_evidence.ts` 更正机制**：新增 `mode: "append" | "supersede"` 参数；`supersede` 模式会将旧记录的 `superseded_by` 指向新记录，保留审计链；每条证据新增 `id` 字段；`evidence_store.json` 补充 `_schema` 说明

### 质量提升（Tier 3）
- **跨平台路径修复**：`scan_opencode_stack.ts` 全局配置路径支持 Windows（`%APPDATA%/opencode`）
- **`recommend_stack` 权重矩阵**：引入 `benefit_score / complexity_cost` 有效分排名；`want_low_complexity=true` 时，`complexity_cost ≥ 4` 的组件自动降级为可选
- **`AGENTS.md` 统一 Skill 输出规范**：所有 skill 输出必须遵循四段式结构（核心结论 / 关键数据 / 置信度说明 / 建议下一步）
- **写作框架重命名**：`cold_email.md`、`statement.md`、`followup_email.md` → `*_framework.md`，各文件新增"常见错误示范"节（含 3 个典型坏例子及修改建议）
- **`advisor.md` 新增调度规则**：明确串行/并行/聚合/失败处理四类规则

### 可维护性（Tier 4）
- **README 信息收敛**：保留快速开始和架构一览，详细原理改为指向 `docs/` 的链接
- **`stack_registry.json` 新增维护字段**：每个组件新增 `benefit_score`、`complexity_cost`、`last_verified`、`next_review_by`；顶层新增 `registry_version`、`last_updated`、`review_cadence_days`
- **新建 `CHANGELOG.md`**（本文件）
- **新建 `data/examples/student_profile_example.json`**：完整填写的示例画像，用于快速验证和端到端测试

---

## v1.0 — 2026-04-11（初始版本）

- 首次发布项目骨架
- 5 个 agent（advisor、profile-intake、school-researcher、mentor-analyst、writing-coach）
- 15 个业务 skill
- 6 个 command
- 12 个 custom tool
- 新增部署层：stack-auditor、4 个部署 skill、4 个部署 command（/audit-stack、/recommend-stack、/deploy-readiness、/auto-deploy-stack）、4 个部署 tool、stack_registry.json
