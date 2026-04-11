---
description: 生成个性化套磁信
agent: advisor
model: openai/gpt-4o
---

请为 $ARGUMENTS 生成个性化套磁信。

要求：
1. 检查学生画像与导师方向是否已知
2. 若导师方向、近年主题或学生匹配点未经核验，先补齐或明确标注缺口
3. 必要时补问最少信息
4. 调用 `writing-coach`
5. 结合 `cold-email-drafting`
6. 输出：
   - 邮件标题
   - 正式版
   - 更主动版
   - 后续跟进版建议
