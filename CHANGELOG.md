# 更新日志

本项目的所有重要更改都会记录在这个文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [未发布]

### 计划中
- 可视化编排编辑器
- 性能监控仪表板
- 更多编排模式
- 企业版功能

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
| 0.1.0 | 2026-03-19 | 首个Beta版本，核心功能 |

---

## 升级指南

### 从未安装 → 0.1.0

```bash
skillhub install skillflow
```

---

[未发布]: https://github.com/yourname/skillflow/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourname/skillflow/releases/tag/v0.1.0
