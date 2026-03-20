# SkillFlow 测试套件

## 目录结构

```
tests/
├── unit/
│   ├── planner.test.js      # 任务规划器测试 ✅
│   └── executor.test.js     # 执行器测试 ✅
├── integration/
│   └── orchestration.test.js # 完整编排测试 ✅
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
```

## 测试覆盖

### 单元测试 ✅
- [x] 任务规划器 - 任务拆解、意图识别、计划生成
- [x] 执行器 - 步骤执行、结果处理、错误处理

### 集成测试 ✅
- [x] 顺序执行 - 多步骤顺序执行
- [x] 错误处理 - 步骤失败处理
- [x] 数据传递 - 跨步骤数据传递
- [x] 依赖链 - 复杂依赖关系

### 待添加
- [ ] 并行执行测试
- [ ] 条件执行测试
- [ ] 自适应执行测试
- [ ] 性能基准测试
