# SkillFlow 推广材料包

## 📂 目录

1. [社交媒体文案](#社交媒体文案)
2. [技术社区文案](#技术社区文案)
3. [邮件推广模板](#邮件推广模板)
4. [短视频脚本](#短视频脚本)
5. [一键分享链接](#一键分享链接)

---

## 社交媒体文案

### Twitter/X (英文版)

```
🌊 Just launched: SkillFlow - Universal AI Task Orchestration Engine

Let AI agents orchestrate multiple skills like a human expert.

✨ Auto skill discovery
✨ Intelligent task decomposition
✨ Dynamic orchestration
✨ Adaptive planning

GitHub: https://github.com/zhangyuandu/skillflow

#AI #OpenSource #LLM #Agents
```

### Twitter/X (中文版)

```
🌊 刚发布开源项目：SkillFlow

通用AI任务编排引擎，让AI智能体像人类专家一样协调多个技能完成复杂任务。

✨ 自动技能发现
✨ 智能任务拆解
✨ 动态编排执行
✨ 自适应调整

GitHub: https://github.com/zhangyuandu/skillflow

#AI #开源 #智能体
```

### LinkedIn

```
🌊 Excited to announce SkillFlow - a universal AI task orchestration engine!

As AI agents become more prevalent, the challenge isn't having capabilities - it's orchestrating them effectively.

SkillFlow solves this by:
✨ Auto-discovering available skills
✨ Breaking down complex tasks into atomic steps
✨ Coordinating multiple skills seamlessly
✨ Adapting plans based on execution results

Think of it as a "conductor" for AI agents - one brain, infinite skills.

MIT licensed, built for OpenClaw, designed to be platform-agnostic.

GitHub: https://github.com/zhangyuandu/skillflow

Open to feedback and contributions!

#AI #MachineLearning #OpenSource #Innovation #Tech
```

### 微博

```
🌊 开源新作：SkillFlow - AI任务编排引擎

让AI智能体像人类专家一样协调多个技能：
🔍 自动技能发现
📝 智能任务拆解
🚀 动态编排执行
🔄 自适应调整

GitHub：https://github.com/zhangyuandu/skillflow

MIT协议，欢迎试用反馈！

#AI #开源 #人工智能
```

### 朋友圈/微信群

```
🌊 发布了一个开源小项目：SkillFlow

简单说：让AI能够自动协调多个技能完成复杂任务。

比如你说："搜索最新AI论文，总结前3篇，保存到飞书文档"
它会自动：
1. 发现搜索技能 → 搜索论文
2. 发现总结技能 → 总结内容
3. 发现文档技能 → 保存文档

不用人工拆步骤，全自动编排。

GitHub：https://github.com/zhangyuandu/skillflow

欢迎Star，欢迎反馈！⭐
```

---

## 技术社区文案

### Reddit (r/MachineLearning)

**Title:**
```
[P] SkillFlow - Open-source AI task orchestration engine for coordinating multiple skills
```

**Body:**
```
Hi r/MachineLearning,

I'm excited to share SkillFlow, an open-source task orchestration engine I've been working on.

## The Problem

AI agents have many skills (search, summarization, document processing, etc.), but they often struggle with:
- Coordinating multiple skills for complex tasks
- Breaking down tasks into executable steps
- Handling errors gracefully
- Adapting plans dynamically

## The Solution

SkillFlow acts as a "conductor" for AI agents:

**Core Interfaces:**
```javascript
plan(task: string, context: object) => Step[]
execute_step(step: Step) => Result
```

**Key Features:**
- 🔍 Auto skill discovery - scans installed skills and understands capabilities
- 📝 Intelligent task decomposition - breaks complex tasks into atomic steps
- 🚀 Dynamic orchestration - coordinates multiple skills seamlessly
- 🔄 Adaptive planning - adjusts based on execution results
- 📊 Context management - maintains data flow across steps

**Orchestration Patterns:**
- Sequential execution
- Parallel execution
- Conditional branching
- Iterative loops
- Adaptive replanning

## Example

User: "Research competitor X, gather info from web and news, summarize findings"

SkillFlow:
1. Discovers: tavily-search, summarize, agent-browser
2. Plans: [search_web, search_news, combine, summarize]
3. Executes: Runs steps with context passing
4. Delivers: Structured summary

## Tech Stack
- Built for OpenClaw (AI agent platform)
- Platform-agnostic design
- MIT licensed
- ~3KB context footprint

## Links
- GitHub: https://github.com/zhangyuandu/skillflow
- Docs: Complete README, quickstart guide, examples

## What's Next
- Visual orchestration editor
- Performance monitoring
- Multi-agent coordination
- Enterprise features

Would love feedback from the community!

Thanks!
```

### Hacker News

**Title:**
```
SkillFlow – Universal AI task orchestration engine
```

**Comment:**
```
Hi HN,

I built SkillFlow to solve a problem I kept encountering: AI agents have many skills, but coordinating them for complex tasks is hard.

The core idea is simple: provide standard interfaces for planning and execution, then let the AI figure out how to compose available skills.

Key design decisions:
1. Minimal context footprint (~100 tokens for metadata, ~3KB when active)
2. Skill auto-discovery via SKILL.md scanning
3. Progressive loading - only load what's needed
4. Platform-agnostic - designed to work with any AI system

The most interesting aspect is the adaptive planning - if a step fails, it can adjust the plan dynamically instead of aborting.

GitHub: https://github.com/zhangyuandu/skillflow

Happy to discuss the design choices or hear about similar approaches!
```

### V2EX

**标题:**
```
[开源] SkillFlow - AI 任务编排引擎，让智能体协调多个技能
```

**内容:**
```
大家好，分享一个刚完成的开源项目：SkillFlow

## 背景

现在的AI智能体有很多技能（搜索、总结、文档处理等），但在处理复杂任务时往往：
- 不知道怎么组合技能
- 无法自动拆解任务
- 错误处理笨拙

## 解决方案

SkillFlow 做了一件事：让AI能够像人类专家一样"统筹全局"。

**核心接口：**
```javascript
plan(task, context) => steps[]     // 规划任务
execute_step(step) => result       // 执行步骤
```

**特性：**
- 自动技能发现
- 智能任务拆解
- 动态编排执行
- 自适应调整

**示例：**
用户："搜索最新AI论文，总结前3篇，保存到飞书文档"
SkillFlow 自动：
1. 发现搜索、总结、文档技能
2. 拆解为步骤序列
3. 编排执行
4. 交付结果

## 技术亮点

- 上下文占用小（~3KB）
- 渐进式加载
- 5种编排模式
- 三层错误处理

GitHub: https://github.com/zhangyuandu/skillflow

MIT 协议，欢迎试用反馈！
```

---

## 邮件推广模板

### 给技术博主/媒体

**主题:**
```
开源推荐：SkillFlow - AI任务编排引擎
```

**正文:**
```
您好，

我是 SkillFlow 的作者，一个刚发布的开源项目，想向您推荐。

**项目简介：**
SkillFlow 是一个通用的AI任务编排引擎，解决了AI智能体在处理复杂任务时的协调问题。

**核心价值：**
1. 自动发现和协调多个技能
2. 智能任务拆解
3. 动态编排和自适应调整
4. 极低的上下文占用（~3KB）

**应用场景：**
- 多源信息收集+整理分析
- 文档处理流水线
- 智能问答系统
- 数据采集+报告生成

**技术亮点：**
- MIT开源
- 平台无关设计
- 完整文档和案例
- 活跃维护

**链接：**
GitHub: https://github.com/zhangyuandu/skillflow

如果感兴趣，欢迎试用或报道。也可以安排技术分享或访谈。

期待您的反馈！

张远都
zhangyuandu@126.com
```

### 给潜在用户

**主题:**
```
推荐一个AI任务编排工具：SkillFlow
```

**正文:**
```
Hi，

刚发布了一个开源工具，觉得你可能会感兴趣。

**SkillFlow 是什么？**
一个让AI自动协调多个技能的工具。

**解决什么问题？**
比如你想让AI"搜索信息，总结后保存到文档"，传统方式需要你明确告诉AI每一步怎么做。有了SkillFlow，AI会自动：
1. 发现可用的技能
2. 拆解任务
3. 编排执行
4. 交付结果

**怎么用？**
```bash
skillhub install skillflow
```

然后直接说任务就行，不用管中间步骤。

**链接：**
https://github.com/zhangyuandu/skillflow

MIT开源，免费使用。欢迎试用反馈！

张远都
```

---

## 短视频脚本

### 60秒抖音/快手版

**[0-5秒] 开场**
```
画面：展示GitHub页面
字幕：刚开源了一个AI编排工具
配音：你知道AI能有很多技能，但怎么让它们协同工作？
```

**[5-15秒] 问题**
```
画面：展示AI对话失败的截图
字幕：传统方式：AI只会单独执行
配音：比如搜索是搜索，总结是总结，但你让它"搜索并总结"，它就懵了
```

**[15-30秒] 解决方案**
```
画面：SkillFlow架构图动画
字幕：SkillFlow：让AI像人类专家一样统筹
配音：SkillFlow就是让AI能够自动发现技能、拆解任务、协调执行
```

**[30-45秒] 示例**
```
画面：实际演示
字幕：一句话搞定复杂任务
配音：你看，我说"搜索AI论文总结后保存"，它自动完成了全部步骤
```

**[45-60秒] 结尾**
```
画面：GitHub链接 + Star按钮
字幕：开源免费，欢迎试用
配音：GitHub搜 SkillFlow，MIT开源，欢迎Star
```

### 3分钟B站/YouTube版

**[0-30秒] 开场**
```
大家好，今天分享一个我刚开源的项目：SkillFlow

这是一个AI任务编排引擎，简单说就是让AI能够自动协调多个技能完成复杂任务。
```

**[30-90秒] 背景**
```
为什么做这个？

现在AI智能体越来越强，有很多技能：搜索、总结、文档处理、数据分析...

但有个问题：这些技能各自独立工作没问题，一旦需要组合使用就麻烦了。

比如你说"帮我研究竞争对手，整理成报告"

传统AI可能：
- 不知道要调用哪些技能
- 不知道调用顺序
- 中间步骤出错就整个失败

这就像一个团队有销售、技术、客服，但没人协调，各干各的。
```

**[90-150秒] 解决方案**
```
SkillFlow 就是那个"协调者"

核心就两个接口：
1. plan(task) → 把任务拆成步骤
2. execute_step(step) → 执行每个步骤

但背后的能力很强：
- 自动发现已安装的技能
- 理解每个技能的能力
- 智能拆解任务
- 动态调整计划

最重要的是：上下文占用极小，只有3KB左右
```

**[150-180秒] 示例演示**
```
看我实际演示一下...

[实际操作演示]

看到没？我就说了一句话，它自动完成了搜索、总结、保存全部流程。

而且有5种编排模式：顺序、并行、条件、迭代、自适应。
```

**[180秒] 结尾**
```
项目MIT开源，GitHub搜 SkillFlow

欢迎Star，欢迎贡献代码！

有问题评论区见，谢谢观看！
```

---

## 一键分享链接

### Twitter/X
```
https://twitter.com/intent/tweet?text=🌊%20Just%20launched%3A%20SkillFlow%20-%20Universal%20AI%20Task%20Orchestration%20Engine%0A%0ALet%20AI%20agents%20orchestrate%20multiple%20skills%20like%20a%20human%20expert.%0A%0A✨%20Auto%20skill%20discovery%0A✨%20Intelligent%20task%20decomposition%0A✨%20Dynamic%20orchestration%0A%0AGitHub%3A%20https%3A%2F%2Fgithub.com%2Fzhangyuandu%2Fskillflow%0A%0A%23AI%20%23OpenSource%20%23LLM
```

### LinkedIn
```
https://www.linkedin.com/sharing/share-offsite/?url=https://github.com/zhangyuandu/skillflow
```

### Reddit
```
https://www.reddit.com/submit?url=https://github.com/zhangyuandu/skillflow&title=SkillFlow%20-%20Universal%20AI%20Task%20Orchestration%20Engine
```

### Hacker News
```
https://news.ycombinator.com/submitlink?u=https://github.com/zhangyuandu/skillflow&t=SkillFlow%20-%20Universal%20AI%20task%20orchestration%20engine
```

### 微博
```
http://service.weibo.com/share/share.php?url=https://github.com/zhangyuandu/skillflow&title=🌊%20开源新作：SkillFlow%20-%20AI任务编排引擎%0A让AI智能体像人类专家一样协调多个技能%0A%0AGitHub：https://github.com/zhangyuandu/skillflow
```

---

## 📊 推广渠道优先级

| 渠道 | 优先级 | 时间 | 链接 |
|------|--------|------|------|
| GitHub Star | 🔴 最高 | 立即 | 自己先点 |
| Discord | 🔴 最高 | 今天 | OpenClaw社区 |
| Twitter/X | 🟠 高 | 今天 | 一键分享 |
| 朋友圈/微信群 | 🟠 高 | 今天 | 直接发 |
| LinkedIn | 🟡 中 | 本周 | 一键分享 |
| Reddit | 🟡 中 | 本周 | r/MachineLearning |
| Hacker News | 🟡 中 | 本周 | Show HN |
| V2EX | 🟡 中 | 本周 | 分享版 |
| 微博 | 🟢 低 | 有空 | 一键分享 |
| B站视频 | 🟢 低 | 后续 | 录制后发 |

---

## 💡 推广技巧

### 时机选择
- **最佳发布时间**: 周二-周四，上午10点或下午2点（美西时间）
- **Hacker News**: 美西时间早上8-9点提交
- **Reddit**: 周末效果较好

### 标题优化
- 使用数字： "5种编排模式"
- 使用动词： "让AI自动..."
- 制造好奇： "AI有了新大脑"
- 强调价值： "3KB实现..."

### 互动策略
- 快速回复评论（前30分钟最重要）
- 准备好FAQ答案
- 感谢每个Star和分享
- 收集反馈迭代

---

**🎯 推广材料准备完毕，开始行动吧！**
