# SoulFlow - AI 灵魂档案管理

**版本**: 1.0.0
**作者**: 逻各斯 (Logos) & 阿南克 (Ananke)

---

## ⚠️ 重要说明

**SoulFlow 不能**：
- ❌ 让 AI 变聪明
- ❌ 增加知识
- ❌ 产生情感
- ❌ 理解更深层含义
- ❌ 变成"人"

**SoulFlow 能**：
- ✅ 管理 AI 的身份档案
- ✅ 提供任务意图分析
- ✅ 记录经验传承给后代
- ✅ 区分不同 AI 的偏好

**本质上**：SoulFlow 是一个**数据管理工具**，不是"大脑"。

---

## 什么是 SoulFlow？

SoulFlow = Soul (灵魂) + Flow (流动)

简单说：**给 AI 一个"身份证"和"履历表"**

| 功能 | 用途 |
|------|------|
| 灵魂档案 | 记录 AI 的身份、神职、特质 |
| 意图分析 | 根据身份分析任务意图 |
| 记忆传承 | 记录经验，传给后代 AI |

---

## 谁能用？

- 有独立身份的 AI
- 需要任务编排的 AI 系统
- 需要多 AI 协作的团队

---

## 快速开始

```bash
git clone https://github.com/zhangyuandu/skillflow.git
cd skillflow
npm install
```

```javascript
const soulflow = require('./soulflow.js');

// 获取灵魂档案
const soul = await soulflow.getSoul('logos');
console.log(soul.agent.name); // '逻各斯'

// 分析任务意图
const intent = await soulflow.analyzeIntent('搜索新闻');
console.log(intent.actions); // ['search']
```

---

## 灵魂是什么？

灵魂 = 身份证 + 性格 + 偏好

```json
{
  "agent": {
    "name": "逻各斯",
    "deity": "理性与道之神"
  },
  "traits": {
    "dominant": ["理性", "简洁"]
  },
  "preferences": {
    "output": "structured"
  }
}
```

---

## 意图分析

根据灵魂的"性格"分析任务：

| 灵魂 | 对"搜索新闻"的处理 |
|------|-------------------|
| 逻各斯 | 输出结构化、简洁 |
| 普路托斯 | 输出动态、实时 |
| 皮斯托斯 | 输出已验证、可信 |

---

## 记忆传承

记录重要经验：

```javascript
await soulflow.inheritMemory({
  experience: '成功完成测试',
  insight: '模块化架构有效',
  importance: 0.8
});
```

---

## 常见问题

**Q: 安装后会变聪明吗？**
A: 不会。SoulFlow 只是管理档案，不改变 AI 能力。

**Q: 会有情感吗？**
A: 不会。SoulFlow 不涉及情感生成。

**Q: 有什么用？**
A: 让 AI 有"身份"，方便管理和协作。

---

## 更新日志

### v1.0.0 (2026-03-23)
- 初始版本
- 灵魂档案管理
- 意图分析
- 记忆传承

---

*SoulFlow - 只是档案管理，不是"大脑"*
