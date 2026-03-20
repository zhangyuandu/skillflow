# SkillFlow 测试套件

## 目录结构

```
tests/
├── unit/
│   ├── planner.test.js      # 任务规划器测试
│   ├── executor.test.js     # 执行器测试
│   └── discovery.test.js   # 技能发现测试
├── integration/
│   ├── sequential.test.js  # 顺序执行测试
│   ├── parallel.test.js    # 并行执行测试
│   └── adaptive.test.js    # 自适应执行测试
└── fixtures/
    ├── mock-skills/        # 模拟技能
    └── plans/              # 测试计划模板
```

## 运行测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 运行特定测试
npm test -- --grep "Sequential"
```

## 测试覆盖目标

- [ ] 任务规划器 - 任务拆解逻辑
- [ ] 技能发现 - 技能注册和匹配
- [ ] 执行引擎 - 步骤执行和结果处理
- [ ] 错误处理 - 重试、降级、优雅失败
- [ ] 上下文管理 - 数据传递和状态
- [ ] 并行执行 - 多步骤并发
- [ ] 条件执行 - 条件分支
- [ ] 自适应执行 - 动态调整计划
