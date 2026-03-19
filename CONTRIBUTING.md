# 贡献指南

感谢你对 SkillFlow 的兴趣！欢迎各种形式的贡献。

---

## 贡献方式

### 🐛 报告 Bug

发现 bug？请提交 [Issue](https://github.com/yourname/skillflow/issues)，包含：

1. **环境信息**
   - OpenClaw 版本
   - Node.js 版本
   - 操作系统

2. **复现步骤**
   - 详细描述如何触发 bug
   - 提供最小化复现案例

3. **预期 vs 实际**
   - 你期望发生什么
   - 实际发生了什么

4. **日志/截图**
   - 错误信息
   - 相关日志

### 💡 提出新功能

有想法？欢迎讨论：

1. 先在 [Discussions](https://github.com/yourname/skillflow/discussions) 发起讨论
2. 描述使用场景和价值
3. 讨论实现方案
4. 确认后再提交 PR

### 📝 改进文档

文档改进是最容易也最重要的贡献：

- 修复错别字
- 补充缺失内容
- 改进表达清晰度
- 添加更多示例
- 翻译成其他语言

### 🔧 提交代码

#### 开发环境设置

```bash
# 1. Fork 并克隆仓库
git clone https://github.com/YOUR_USERNAME/skillflow.git
cd skillflow

# 2. 安装依赖（如果有）
npm install

# 3. 创建功能分支
git checkout -b feature/your-feature-name

# 4. 开发和测试
# 编写代码...
# 测试...

# 5. 提交
git add .
git commit -m "feat: your feature description"

# 6. 推送并创建 PR
git push origin feature/your-feature-name
```

#### 代码规范

- **Markdown**: 保持简洁清晰
- **JavaScript**: 使用 ES6+ 语法
- **Shell**: POSIX 兼容，添加注释
- **提交信息**: 遵循 [Conventional Commits](https://www.conventionalcommits.org/)

#### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type):**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档改进
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具

**示例:**
```
feat(patterns): add retry pattern with exponential backoff

- Add retry pattern implementation
- Support configurable backoff strategies
- Add unit tests

Closes #42
```

---

## 开发指南

### 项目结构

```
skillflow/
├── SKILL.md              # 技能定义（核心）
├── README.md             # 项目介绍
├── QUICKSTART.md         # 快速开始
├── CONTRIBUTING.md       # 本文件
├── ROADMAP.md            # 开发路线
├── LICENSE               # 许可证
├── references/           # 详细文档
│   ├── architecture.md   # 架构设计
│   ├── patterns.md       # 编排模式
│   ├── config.md         # 配置说明
│   └── examples.md       # 使用示例
└── scripts/              # 辅助脚本
    └── discovery.sh      # 技能发现
```

### 核心设计原则

1. **简洁至上**
   - 上下文是公共资源，不要浪费
   - 每句话都要有价值

2. **渐进式加载**
   - SKILL.md 只放核心内容
   - 详细内容放 references/
   - 按需加载，不预加载

3. **技能自治**
   - Orchestrator 只编排，不实现
   - 具体能力由各技能提供
   - 保持单一职责

4. **标准化接口**
   - `plan(task, context) → steps[]`
   - `execute_step(step) → result`
   - 统一接口，便于集成

### 添加新的编排模式

编辑 `references/patterns.md`:

```markdown
## 你的模式名称

**描述:** 简短描述模式用途

**结构:**
```javascript
const plan = [
  // 示例代码
];
```

**使用场景:** 何时使用这个模式

**示例:** 具体案例
```

### 添加新的实战案例

编辑 `references/examples.md`:

```markdown
## 案例: 你的案例名称

**场景:** 用户想做什么

**Orchestrator 编排:**
```
步骤拆解
```

**完整执行:**
```
详细命令和输出
```
```

---

## 测试

### 手动测试

```bash
# 1. 安装到本地 OpenClaw
bash scripts/test-install.sh

# 2. 运行测试任务
openclaw test skillflow

# 3. 检查日志
tail -f ~/.openclaw/logs/orchestrator.log
```

### 测试检查清单

- [ ] 新功能有对应文档
- [ ] 文档中的示例可执行
- [ ] 错误信息清晰有用
- [ ] 没有破坏现有功能

---

## 发布流程

### 版本号规范

遵循 [语义化版本](https://semver.org/):

- `MAJOR.MINOR.PATCH`
- `1.0.0` → 首个正式版
- `0.x.x` → Beta 版本

### 发布步骤

1. 更新版本号
2. 更新 CHANGELOG.md
3. 打包: `python3 scripts/package_skill.py`
4. 创建 GitHub Release
5. 发布到 skillhub

---

## 社区准则

### 行为准则

- 尊重所有贡献者
- 欢迎不同观点
- 专注建设性讨论
- 不容忍骚扰/歧视

### 沟通渠道

- **GitHub Issues**: Bug 报告、功能请求
- **GitHub Discussions**: 问答、讨论
- **Discord**: 即时交流（链接待添加）

---

## 认可贡献

所有贡献者都会在 README.md 中列出。

感谢你让 SkillFlow 变得更好！ 🎉

---

## 需要帮助？

- 💬 在 [Discussions](https://github.com/yourname/skillflow/discussions) 提问
- 📧 邮件: your.email@example.com
- 🐦 Twitter: @yourhandle

---

**记住：没有贡献是微小的。修复一个错别字也是重要的贡献！**
