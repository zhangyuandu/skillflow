# 更新日志

本项目的所有重要更改都会记录在这个文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [0.3.0] - 2026-03-29

### 新增

#### 🤝 SoulFlow 深度集成
- ✨ `src/soulflow-deep-integration.js` - 深度集成模块
  - 意图系统对接 (Intention)
  - 情感系统对接 (Emotion)
  - 决策深化 (Decision Deepening)
  - 经验学习系统 (Experience Learning)
- 🔗 通信接口
  - God Messenger 实时通信
  - 共享目录异步数据
  - 决策模式配置 (soulflow_first / skillflow_first / hybrid)
- 🧠 核心改进
  - 任务执行前：SoulFlow 意图分析 + 情感注入
  - 任务执行后：经验记录 + 反馈学习
  - 决策深化：基因-意识综合决策

#### API
```javascript
const DeepIntegration = require('./src/soulflow-deep-integration');
const integration = new DeepIntegration();

const result = await integration.deepDecide(task, context);
// {
//   task,
//   intention: { intent, risk, matchedGenes, geneInfluence },
//   emotion: { mood, energy, confidence },
//   decision: { strategy, priority, confidence, reason }
// }
```

#### 集成测试结果
- SoulFlow 初始化: ✅
- SoulFlow 决策: ✅
- SoulFlow 记忆: ✅
- SoulFlow 情感: ✅
- SoulFlow 意图: ✅
- SkillFlow 规划: ✅
- SkillFlow 执行: ✅
- 集成执行: ✅ (2ms)

---

## [未发布]

### 计划中
- 可视化编排编辑器
- 性能监控仪表板
- 更多编排模式
- 数字签名验证
- 企业版功能

---

## [0.2.0] - 2026-03-24

### 新增

#### 🛡️ 沙箱隔离执行引擎
- ✨ `src/sandbox.js` - 轻量级沙箱隔离模块
  - 隔离技能执行环境
  - 监控敏感操作（文件、网络、进程）
  - 异常行为实时拦截
  - 超时和资源限制
- 🔐 安全特性
  - 受限的文件系统访问（只读模式）
  - 网络访问可配置
  - 外部命令执行白名单
  - 危险命令黑名单（rm, dd, format 等）
- 📊 审计功能
  - 完整执行日志
  - 可疑行为检测
  - 文件访问追踪
  - 超时预警

#### API
```javascript
const Sandbox = require('./src/sandbox');
const sandbox = new Sandbox({
  timeout: 30000,
  networkEnabled: false,
  execEnabled: false
});

const result = await sandbox.execute(code, context);
```

#### 配置选项
- `timeout` - 执行超时（默认 30s）
- `maxMemory` - 内存限制（默认 128MB）
- `allowedPaths` - 允许访问的路径
- `blockedCommands` - 禁止执行的命令
- `networkEnabled` - 是否允许网络
- `execEnabled` - 是否允许外部命令

---

## [0.1.2] - 2026-03-23

### 新增

#### 并行执行引擎修复
- ✨ 修复 ParallelExecutor 核心 bug
  - `_findStep()` 现在正确从 steps 数组查找
  - `_findSkill()` 优先使用 skill_hint，其次 action
  - 失败传播机制完善
- 🔧 新增 `runParallel()` API
- 🔧 自动注册 skillRegistry

#### 技能发现增强 (v2)
- ✨ 扫描 21 个技能
- 📋 新增字段：version, permissions, keywords, usage, security, lastUpdated
- 🔐 集成 skill-safety 安全扫描
- 🌐 扩展能力关键词库（30+ 类别）

#### CLI 增强
- ✨ `skillflow test --parallel` 运行并行测试
- ✨ `skillflow version` 显示版本
- ✨ `skillflow config [set]` 配置管理
- 💾 配置持久化到 `~/.openclaw/skillflow-config.json`

#### AI 团队协作
- ✨ 发布队列机制（publish/ 目录）
- ⏱️ 定时检测脚本（每 15 分钟）
- 📮 简化版反馈系统

### 修复
- ParallelExecutor 步骤传递问题
- 技能匹配逻辑
- 依赖图构建
- 缓存格式问题

---

## [0.1.1] - 2026-03-23

---

## [0.1.1] - 2026-03-23

### 新增

#### 🛡️ 安全防护层
- ✨ skill-safety 技能安全扫描模块
  - 静态分析 SKILL.md 和脚本文件
  - 风险等级评估（SAFE/LOW/MEDIUM/HIGH/CRITICAL）
  - 来源验证（官方/社区/本地/未知）
  - 权限声明检测与比对
- 🔐 权限声明规范 (PERMISSION_SPEC.md)
  - 12 种标准权限类型
  - 5 级风险等级
  - YAML/注释格式支持
- 📋 安全配置管理
  - 白名单/黑名单功能
  - 权限级别配置
  - 信任来源管理
  - 预安装检查集成

#### 🎯 智能优先级调度器
- ✨ priority-scheduler.js 核心引擎
  - 四维优先级评估（紧急度/重要性/依赖/上下文）
  - 动态队列排序
  - 自动依赖处理
  - 拓扑排序支持
- 📊 任务队列 CLI (task)
  - 添加/完成/删除任务
  - 优先级自动计算
  - 上下文感知

#### 📮 简化版反馈系统
- ✨ feedback.js 反馈收集模块
  - 轻量反馈：任务完成后 ⭐ 评分
  - 版本升级检查：GitHub Release API
  - 错误上报机制
  - 反馈数据统计

### 改进
- 📖 更新 SKILL.md 文档
- 🧪 完善测试用例

---

## [0.1.0] - 2026-03-19

### 新增
- ✨ 核心编排引擎
  - Planner: 任务自动拆解
  - Dispatcher: 技能自动发现与路由
  - Executor: 步骤执行引擎
  - Context Manager: 上下文管理
- 📚 编排模式支持
  - Sequential (顺序执行)
  - Parallel (并行执行)
  - Conditional (条件执行)
  - Iterative (迭代执行)
  - Adaptive (自适应)
- 🔧 标准接口定义
  - `plan(task, context) → steps[]`
  - `execute_step(step) → result`
- 📖 完整文档
  - README.md
  - QUICKSTART.md
  - CONTRIBUTING.md
  - 架构设计文档
  - 编排模式文档
  - 配置说明
- 🛠️ 辅助脚本
  - 技能发现脚本
  - 技能注册表构建

### 文档
- 📝 项目介绍和使用指南
- 📝 快速开始教程
- 📝 贡献指南
- 📝 API 参考文档
- 📝 实战案例集

---

## 版本对比

| 版本 | 发布日期 | 主要特性 |
|------|----------|----------|
| 0.1.1 | 2026-03-23 | 安全防护层 + 智能调度 + 反馈系统 |
| 0.1.0 | 2026-03-19 | 首个Beta版本，核心功能 |

---

## 升级指南

### 从 0.1.0 → 0.1.1

```bash
skillhub update skillflow
```

新增功能：
- 安全扫描：自动检测技能风险
- 优先级调度：智能任务排序
- 反馈系统：任务完成后可评分

### 从未安装 → 0.1.1

```bash
skillhub install skillflow
```

---

## 路线图

| 版本 | 目标 | 状态 |
|------|------|------|
| 0.1.0 | 核心引擎 | ✅ 已发布 |
| 0.1.1 | 安全防护层 | ✅ 已发布 |
| 0.2.0 | 沙箱隔离 + 行为监控 | 🚧 开发中 |
| 0.3.0 | 可视化编辑器 | 📋 计划中 |

---

[未发布]: https://github.com/skillflow-ai/skillflow/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/skillflow-ai/skillflow/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/skillflow-ai/skillflow/releases/tag/v0.1.0
