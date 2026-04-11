---
description: 对多个 offer 做结构化比较
agent: advisor
model: openai/gpt-4o
---

请基于当前提供的多个 offer 做结构化比较。

要求：
1. 若 offer 信息不完整，先补问关键差异项
2. 调用 `offer-comparison`
3. 输出：
   - offer 对比表
   - 最适合当前画像的选项
   - 若更看重读博的建议
   - 若更看重就业的建议
   - 最大后悔点
