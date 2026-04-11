---
description: 生成冲稳保院校池
agent: advisor
model: openai/gpt-4o
---

基于当前学生画像，为目标方向生成首版院校池。

要求：
1. 若画像关键信息缺失，先补问
2. 若用户本轮补充了目标院校、城市或方向，先调用 `ingest_user_message` 写入画像
3. 调用 `school-researcher`
4. 优先使用官方来源
5. 将已核验的项目条件、截止日期、材料要求写入 `evidence_store`，对高时效事实补齐 `topic_type`、`source_authority`、`applicable_cycle`、`published_at`
6. 调用 `audit_evidence` 审计与当前院校池相关的证据；至少传入当前学校名到 `entity_keywords`，必要时传 `applicable_cycles`（如 `2026夏令营` / `2026预推免`）和 `topic_types`
7. 若存在 stale / missing_context / low_confidence / weak_authority 项，不得把对应条件写成硬结论
8. 结合 `school-fit-scoring` 和 `reach-match-safety`
9. 输出：
   - 冲 / 稳 / 保院校列表
   - 每个项目的关键理由
   - 证据审计结论（是否存在过期/待复核项）
   - 当前信息不足点
   - 下一步建议
