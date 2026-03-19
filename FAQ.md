# 常见问题 (FAQ)

## 安装相关

### Q: 如何安装 SkillFlow？

**A:**
```bash
# 方式1: 通过 skillhub 安装 (推荐)
skillhub install skillflow

# 方式2: 从 GitHub 下载
wget https://github.com/zhangyuandu/skillflow/releases/latest/download/skillflow.skill
openclaw skill install skillflow.skill
```

### Q: 安装后如何验证？

**A:**
```bash
# 检查技能是否安装
ls ~/.openclaw/skills/skillflow/

# 应该看到: SKILL.md  README.md  references/  scripts/
```

### Q: 支持哪些平台？

**A:**
- ✅ OpenClaw (主要支持)
- 🔄 其他平台 (理论兼容，欢迎测试)

---

## 使用相关

### Q: 如何使用 SkillFlow？

**A:** 安装后直接对AI说复杂任务即可：

```
"搜索最新AI论文，总结前3篇，保存到飞书文档"
```

SkillFlow 会自动：
1. 发现可用技能
2. 拆解任务
3. 编排执行
4. 交付结果

### Q: 需要手动配置技能吗？

**A:** 不需要。SkillFlow 会自动扫描已安装技能并理解其能力。

但需要：
1. 安装必要的技能 (如 tavily-search, summarize 等)
2. 配置必要的 API Key (如 TAVILY_API_KEY)

### Q: 支持哪些编排模式？

**A:**
- **Sequential**: 顺序执行
- **Parallel**: 并行执行
- **Conditional**: 条件执行
- **Iterative**: 迭代执行
- **Adaptive**: 自适应调整

### Q: 如何处理执行失败？

**A:** SkillFlow 有三层错误处理：
1. **重试机制**: 自动重试失败步骤
2. **降级方案**: 使用备用技能
3. **优雅失败**: 跳过或询问用户

---

## 技能相关

### Q: 如何让我的技能兼容 SkillFlow？

**A:** 在 SKILL.md 中：
1. 清晰的 frontmatter description
2. 描述技能的能力关键词
3. 标准化的输入输出

**示例:**
```yaml
---
name: my-skill
description: "My skill for X. Capabilities: [analyze, process, transform]"
---
```

### Q: SkillFlow 如何发现技能？

**A:**
1. 扫描 `~/.openclaw/skills/*/SKILL.md`
2. 提取 description 中的能力关键词
3. 构建 skill-registry.json

### Q: 可以指定使用某个技能吗？

**A:** 可以，在步骤中使用 `skill_hint`:
```javascript
{
  id: "search",
  action: "搜索AI论文",
  skill_hint: "tavily-search",  // 指定技能
  inputs: { query: "AI papers" }
}
```

---

## 配置相关

### Q: 配置文件在哪里？

**A:** `~/.openclaw/config/skillflow.json`

### Q: 可配置哪些选项？

**A:**
```json
{
  "planning": {
    "model": "default",      // 规划模型
    "max_steps": 20          // 最大步骤数
  },
  "execution": {
    "default_timeout": 30000, // 默认超时(ms)
    "max_parallel": 5        // 最大并行数
  },
  "discovery": {
    "scan_on_startup": true  // 启动时扫描技能
  }
}
```

### Q: 如何调整规划模型？

**A:**
修改配置文件中的 `planning.model`，或使用：
```bash
export SKILLFLOW_MODEL=your-model-name
```

---

## 性能相关

### Q: SkillFlow 会占用多少上下文？

**A:**
- **元数据**: ~100 tokens (始终可用)
- **激活时**: ~3KB (~750 tokens)
- **详细文档**: 按需加载

相比其他方案，上下文占用极小。

### Q: 执行速度如何？

**A:**
- 规划: ~1-2秒
- 执行: 取决于具体技能
- 并行执行可提升整体速度

### Q: 有性能监控吗？

**A:** 目前通过日志记录，未来会提供：
- 执行时间追踪
- 步骤成功率统计
- 性能仪表板

---

## 故障排查

### Q: 找不到技能怎么办？

**A:** 
1. 确认技能已安装: `skillhub list --installed`
2. 手动扫描: `bash scripts/discovery.sh --force`
3. 检查 SKILL.md 格式

### Q: 执行失败怎么办？

**A:**
1. 检查日志: `tail -f ~/.openclaw/logs/skillflow.log`
2. 确认 API Key 配置
3. 验证网络连接
4. 提交 Issue: https://github.com/zhangyuandu/skillflow/issues

### Q: 如何获取调试信息？

**A:**
```bash
export SKILLFLOW_DEBUG=true
export SKILLFLOW_LOG_LEVEL=debug
```

---

## 贡献相关

### Q: 如何贡献代码？

**A:**
1. Fork 仓库
2. 创建功能分支
3. 提交 PR

详见 [CONTRIBUTING.md](CONTRIBUTING.md)

### Q: 如何报告 Bug？

**A:**
1. 访问 https://github.com/zhangyuandu/skillflow/issues
2. 点击 "New Issue"
3. 填写模板信息

### Q: 如何提出新功能？

**A:**
1. 先在 Discussions 讨论
2. 确认方案后提交 Issue
3. 或直接提交 PR

---

## 对比相关

### Q: SkillFlow vs LangChain?

**A:**
| 特性 | SkillFlow | LangChain |
|------|-----------|-----------|
| 设计理念 | 技能编排 | 应用框架 |
| 上下文占用 | ~3KB | 较大 |
| 学习曲线 | 平缓 | 陡峭 |
| 平台依赖 | OpenClaw | 通用 |

**适合场景:**
- SkillFlow: OpenClaw用户、轻量编排
- LangChain: 构建完整应用

### Q: SkillFlow vs AutoGPT?

**A:**
| 特性 | SkillFlow | AutoGPT |
|------|-----------|---------|
| 自主性 | 需要明确任务 | 完全自主 |
| 可控性 | 高 | 低 |
| 执行模式 | 编排执行 | 迭代规划 |
| 适用场景 | 明确任务 | 探索性任务 |

---

## 其他

### Q: 开源协议？

**A:** MIT License - 自由使用、修改、分发

### Q: 商业使用？

**A:** 允许，MIT 协议无限制

### Q: 如何支持项目？

**A:**
- ⭐ GitHub Star
- 🔄 分享给更多人
- 🐛 报告Bug
- 💡 提出新功能
- 📝 改进文档
- 💰 GitHub Sponsors 捐赠

### Q: 有社区吗？

**A:**
- GitHub Discussions: https://github.com/zhangyuandu/skillflow/discussions
- Issues: https://github.com/zhangyuandu/skillflow/issues

---

## 没找到答案？

- 📖 查看 [README.md](README.md)
- 🚀 查看 [QUICKSTART.md](QUICKSTART.md)
- 💬 在 [Discussions](https://github.com/zhangyuandu/skillflow/discussions) 提问
- 🐛 提交 [Issue](https://github.com/zhangyuandu/skillflow/issues)

---

**最后更新:** 2026-03-19
