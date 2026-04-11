---
description: 审计证据库的新鲜度与可信度
agent: advisor
model: openai/gpt-4o
---

检查当前 `evidence_store.json` 是否足以支撑后续结论。

要求：
1. 先调用 `audit_evidence`
2. 若用户给了学校、导师、方向或轮次，传给 `entity_keywords`、`claim_keywords`、`applicable_cycles`、`topic_types`，优先做精准审计
3. 将结果按 `stale / low_confidence / weak_authority / missing_context / public_discussion_only` 五类整理
4. 明确哪些问题会影响择校结论，哪些会影响导师结论
5. 对每个高风险项给出具体复核动作，优先指向官网、学院通知、导师主页或近三年论文
6. 若证据库为空，或当前过滤范围无匹配证据，也要明确说明当前系统无法支撑强结论

输出：
- 当前证据基础结论
- 高风险证据项
- 对择校/导师判断的影响
- 下一步复核建议
