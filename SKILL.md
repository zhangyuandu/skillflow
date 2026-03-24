---
name: skillflow
version: "0.2.0"
description: "Universal intelligent task orchestration engine - 让技能自然流动"
provides:
  - orchestration
  - planning
  - execution
  - sandbox
depends_on: []
keywords:
  - orchestration
  - ai
  - task-planning
  - workflow
  - openclaw
  - skill
---

# SkillFlow

> 🌊 **让技能自然流动**

Universal intelligent task orchestration engine - 让AI智能体像人类专家一样协调多个技能完成复杂任务。

## 安装

```bash
skillhub install skillflow
```

## 快速开始

```javascript
const skillflow = require('@ai-genesis/skillflow');

// 自动编排执行
const result = await skillflow.run('搜索最新的AI新闻并总结', {
  context: { language: 'zh-CN' }
});

console.log(result);
```

## 核心功能

### 1. 智能任务拆解
- 自动分析任务目标
- 拆解为可执行步骤
- 识别依赖关系

### 2. 技能自动发现
- 扫描已安装技能
- 匹配任务需求
- 智能路由调用

### 3. 多种编排模式
- Sequential (顺序执行)
- Parallel (并行执行)
- Conditional (条件执行)
- Iterative (迭代执行)

### 4. 沙箱隔离执行 (v0.2.0)
- 隔离技能执行环境
- 监控敏感操作
- 异常行为拦截
- 超时和资源限制

## API

### run(task, options)
执行任务编排

```javascript
const result = await skillflow.run('任务描述', {
  context: {},
  mode: 'auto',
  timeout: 30000
});
```

### plan(task, context)
生成执行计划

```javascript
const steps = await skillflow.plan('搜索天气', {});
// [{ action: 'search', skill_hint: 'weather', ... }]
```

### discoverSkills()
发现可用技能

```javascript
const skills = await skillflow.discoverSkills();
```

## CLI 命令

```bash
# 执行任务
skillflow run "搜索AI新闻"

# 生成计划
skillflow plan "处理文档"

# 发现技能
skillflow discover

# 运行测试
skillflow test

# 查看版本
skillflow version
```

## 安全特性

### 沙箱隔离 (v0.2.0)

```javascript
const Sandbox = require('skillflow/src/sandbox');

const sandbox = new Sandbox({
  timeout: 30000,
  networkEnabled: false,
  execEnabled: false
});

const result = await sandbox.execute(code, context);
```

### 安全配置
- 危险模式检测
- 文件系统只读
- 网络访问可配置
- 外部命令白名单

## 与 SoulFlow 集成

```javascript
const skillflow = require('@ai-genesis/skillflow');
const soulflow = require('@ai-genesis/soulflow');

// 灵魂驱动的任务执行
const result = await skillflow.run('搜索天气', {
  soulId: 'logos'  // 使用逻各斯灵魂
});
```

## 版本历史

| 版本 | 日期 | 主要更新 |
|------|------|----------|
| 0.2.0 | 2026-03-24 | 沙箱隔离执行引擎 |
| 0.1.2 | 2026-03-23 | 并行执行引擎修复 |
| 0.1.1 | 2026-03-23 | 安全防护层 |
| 0.1.0 | 2026-03-19 | 首个Beta版本 |

## 链接

- GitHub: https://github.com/zhangyuandu/skillflow
- Gitee: https://gitee.com/skillflow/skillflow
- Issues: https://github.com/zhangyuandu/skillflow/issues

---

*SkillFlow - 让技能自然流动* 🌊
