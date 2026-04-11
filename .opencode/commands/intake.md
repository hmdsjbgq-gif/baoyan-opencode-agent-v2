---
description: 建立完整保研画像
agent: advisor
model: openai/gpt-4o
---

请进入保研画像采集模式。

要求：
1. 先调用 `load_profile` 和 `load_user_memory` 检查已有画像与本地记忆
2. 若画像不完整，按最高优先级提问缺失项
3. 优先调用 `profile-intake` 和 `student-profile-intake`
4. 对本轮用户原话调用 `ingest_user_message`
5. 使用自动抽取结果更新 `student_profile.json` 与 `user_memory.json`
6. 调用 `background-evaluation` 输出当前竞争力摘要
7. 输出：
   - 学生画像卡
   - 当前竞争力摘要
   - 缺失项
   - 当前阶段判断
   - 下一步建议
