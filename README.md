# SkillFlow

> 🌊 **让技能自然流动**  
> Universal intelligent task orchestration engine - 让AI智能体像人类专家一样协调多个技能完成复杂任务。

[![OpenClaw](https://img.shields.io/badge/Built%20for-OpenClaw-blue)](https://openclaw.ai)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Beta-orange)](https://github.com/yourname/skillflow/releases)

---

## 🎯 核心概念

**传统方式：**
```
用户 → 理解 → 执行 → 失败 → 重来 → 成功
（需要用户自己拆步骤、选工具）
```

**使用 SkillFlow：**
```
用户提出目标 → SkillFlow自动拆解 → 发现技能 → 编排执行 → 完成交付
（一步到位）
```

**核心价值：**
- 🔍 自动发现可用技能
- 📝 智能任务拆解
- 🚀 多技能协调执行
- 🔄 自适应规划调整
- 📊 上下文持续传递

---

## 🚀 快速开始

### 安装

```bash
# 通过 OpenClaw skillhub 安装
skillhub install skillflow

# 或通过 GitHub 下载
wget https://github.com/yourname/skillflow/releases/latest/download/skillflow.skill
openclaw skill install skillflow.skill
```

### 基础用法

安装后，直接对AI说：

```
"搜索最新AI论文，总结前3篇，保存到飞书文档"
```

SkillFlow 会自动：
1. 🔍 发现 `tavily-search` 技能
2. 📝 发现 `summarize` 技能
3. 📄 发现 `feishu-doc` 技能
4. ⚙️ 规划执行流程：`搜索 → 筛选 → 总结 → 保存`
5. ✅ 执行任务并返回结果

---

## 📚 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    用户请求                               │
│                      (Natural Language)                   │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    Planner (规划器)                      │
│  1. 理解意图 → 2. 技能发现 → 3. 任务拆解 → 4. 生成计划   │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   Dispatcher (调度器)                    │
│  1. 步骤路由 → 2. 技能匹配 → 3. 依赖解析                │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   Executor (执行器)                      │
│  1. 准备输入 → 2. 调用技能 → 3. 捕获结果 → 4. 错误处理  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   Context Manager                        │
│  1. 结果存储 → 2. 上下文传递 → 3. 状态追踪              │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                      完成交付                             │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 核心接口

### 标准接口定义

```javascript
// 1. 任务规划
plan(task: string, context: object) → Step[]

// 2. 执行单步
execute_step(step: Step) → Result

// 步骤结构
{
  id: string,
  action: string,
  skill_hint?: string,
  inputs: object,
  depends_on?: string[],
  retry?: number,
  timeout?: number
}

// 结果结构
{
  success: boolean,
  output: any,
  error?: string,
  next_steps?: string[]
}
```

---

## 📋 编排模式

### 支持的模式

| 模式 | 说明 | 示例 |
|------|------|------|
| **Sequential** | 顺序执行 | `搜索 → 总结 → 保存` |
| **Parallel** | 并行执行 | 同时搜索多个来源 |
| **Conditional** | 条件执行 | 根据类型选择处理器 |
| **Iterative** | 迭代执行 | 质量检查 → 优化循环 |
| **Adaptive** | 自适应 | 根据结果动态调整 |

### 高级功能

- **错误恢复**: 自动重试、回退技能、优雅降级
- **上下文管理**: 跨步骤数据传递、中间结果缓存
- **监控追踪**: 执行日志、性能监控、调试支持

---

## 🛠️ 与技能生态集成

### 自动发现机制

SkillFlow 自动扫描已安装技能：
```bash
# 技能注册表扫描
~/.openclaw/skills/*/SKILL.md

# 提取能力信息
- 技能名称
- 能力描述
- 输入/输出格式
- 依赖关系
```

### 成为 SkillFlow-Compatible 技能

**SKILL.md 示例：**

```yaml
---
name: my-tool
description: "My tool for doing X. Capabilities: [analyze, process, transform]"
---

# 技能内容...
```

**关键要求：**
1. 清晰的 `description`（SkillFlow据此理解能力）
2. 标准化输入输出
3. 提供可操作的错误信息

---

## 💡 实战案例

### 案例1: 研究助理

```
用户: "研究竞争对手X，从网页、新闻、社交媒体收集信息，
       总结其产品和市场策略，生成报告"

SkillFlow:
├── 发现技能: tavily-search, agent-browser, summarize
├── 生成计划:
│   ├── Step1: 搜索网页信息 (tavily-search)
│   ├── Step2: 搜索新闻 (tavily-search --topic news)
│   ├── Step3: 浏览官网 (agent-browser)
│   ├── Step4: 综合总结 (summarize)
│   └── Step5: 生成文档 (feishu-doc / tencent-docs)
└── 执行并交付完整报告
```

### 案例2: 数据处理流水线

```
用户: "下载PDF文件，提取文本，翻译为英文，分析情感，生成报告"

SkillFlow:
├── 发现技能: agent-browser, summarize, exec
├── 生成计划:
│   ├── Step1: 下载PDF (agent-browser)
│   ├── Step2: 提取文本 (summarize)
│   ├── Step3: 翻译内容 (内置能力)
│   ├── Step4: 情感分析 (技能调用)
│   └── Step5: 生成报告 (文档技能)
└── 流水线执行
```

### 案例3: 智能问答系统

```
用户: "帮我查一下最新的AI政策法规"

SkillFlow:
├── 发现技能: tavily-search
├── 生成计划:
│   ├── Step1: 搜索最新政策 (tavily-search)
│   ├── Step2: 验证信息来源 (agent-browser)
│   └── Step3: 整理输出 (summarize)
└── 返回结构化答案
```

---

## ⚙️ 配置

### 配置文件

`~/.openclaw/config/orchestrator.json`:

```json
{
  "planning": {
    "model": "default",
    "max_steps": 20
  },
  "execution": {
    "default_timeout": 30000,
    "max_parallel": 5
  },
  "discovery": {
    "scan_on_startup": true
  }
}
```

---

## 🤝 贡献指南

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md)。

### 开发路线图

- [x] 核心编排引擎
- [x] 基础编排模式
- [x] 技能发现机制
- [ ] 高级错误恢复
- [ ] 可视化编排编辑器
- [ ] 性能监控仪表板

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

## 💖 支持

如果这个项目对你有帮助，欢迎：

- ⭐ 在 GitHub 上给我们 Star
- 🐛 提交 Issue 或 PR
- 💰 通过 GitHub Sponsors 或 [微信/支付宝]() 捐赠
- 📢 分享给更多 OpenClaw 用户

---

## 🌐 相关链接

- [OpenClaw 官网](https://openclaw.ai)
- [OpenClaw Skillhub](https://clawhub.com)
- [GitHub 仓库](https://github.com/yourname/skillflow)

---

**用 SkillFlow，让 AI 像人类专家一样工作。**
