---
description: 找导师并输出优先级
agent: advisor
model: openai/gpt-4o
---

围绕 $ARGUMENTS 检索并筛选导师。

要求：
1. 若未给院校或方向，先从当前画像中推断，必要时追问
2. 若用户本轮补充了目标导师、目标院校或方向，先调用 `ingest_user_message` 写入画像
3. 调用 `mentor-analyst`
4. 结合 `mentor-search`、`paper-direction-analysis` 和 `mentor-fit-scoring`
5. 将已核验的导师主页、学院信息、近年论文结论写入 `evidence_store`；招生信号类事实补齐 `topic_type`、`source_authority`、`applicable_cycle`、`published_at`
6. 调用 `audit_evidence` 审计与当前导师结论相关的证据；至少传入导师名、院校名到 `entity_keywords`，必要时传 `claim_keywords`（如 `招生`、`方向`）和 `applicable_cycles`
7. 若存在 stale / low_confidence / weak_authority / public_discussion_only 项，不得把对应判断写成硬事实
8. 对导师风格、是否 push、组内氛围等仅能放在不确定性说明，不得写成事实
9. 输出：
   - 导师候选池
   - 研究方向匹配点
   - 证据审计结论（哪些点仍需官网/论文再核验）
   - 风险提示
   - 套磁优先级
