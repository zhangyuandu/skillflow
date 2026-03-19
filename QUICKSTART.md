# 快速开始

5分钟上手 SkillFlow

---

## 安装（1分钟）

```bash
# 方式1: 通过 skillhub 安装
skillhub install skillflow

# 方式2: 手动下载安装
curl -L https://github.com/yourname/skillflow/releases/latest/download/skillflow.skill -o skillflow.skill
openclaw skill install skillflow.skill
```

验证安装：
```bash
ls ~/.openclaw/skills/skillflow/
# 应该看到: SKILL.md  README.md  references/  scripts/
```

---

## 第一个任务（2分钟）

### 场景：搜索信息并总结

**安装必要技能：**
```bash
skillhub install tavily-search
skillhub install summarize
```

**执行任务：**

直接对AI说：
```
搜索"2024年AI领域十大突破"，总结成3个要点
```

**SkillFlow 会：**
1. 发现 `tavily-search` 技能 → 执行搜索
2. 发现 `summarize` 技能 → 总结内容
3. 自动编排执行顺序
4. 返回结果给你

**预期输出：**
```
根据搜索结果，2024年AI领域十大突破总结如下：

1. **GPT-5发布** - 多模态能力大幅提升...
2. **AI Agent爆发** - 自主执行复杂任务...
3. **端侧AI普及** - 手机本地运行大模型...
```

---

## 进阶任务（2分钟）

### 场景：文档处理流水线

**安装文档技能：**
```bash
skillhub install feishu-doc  # 或 tencent-docs
```

**执行任务：**

```
搜索最新的AI安全研究报告，总结关键发现，保存到飞书文档
```

**SkillFlow 编排流程：**
```
[Search]  →  [Filter]  →  [Summarize]  →  [Write Doc]
     ↓            ↓            ↓              ↓
搜索报告    选择Top3     总结要点      创建文档
```

**完成！** 你会得到一个包含完整报告的文档链接。

---

## 查看执行过程

**启用详细日志：**

```bash
export ORCHESTRATOR_DEBUG=true
```

**查看技能发现：**

```bash
bash ~/.openclaw/skills/skillflow/scripts/discovery.sh --force
```

---

## 常见问题

### Q: 找不到合适的技能？
**A:** 先去 skillhub 搜索安装：
```bash
skillhub search "关键词"
```

### Q: 执行失败了怎么办？
**A:** 检查：
1. 必要技能是否安装
2. API Key 是否配置（如 Tavily）
3. 网络连接是否正常

### Q: 如何添加自定义技能？
**A:** 参考 [Skill Creator 指南](https://github.com/openclaw/skill-creator)

---

## 下一步

- 📖 阅读完整 [文档](README.md)
- 🔧 探索 [API 接口](API.md)
- 💡 查看更多 [实战案例](EXAMPLES.md)
- 🤝 参与 [社区贡献](CONTRIBUTING.md)

---

**遇到问题？** 提交 [Issue](https://github.com/yourname/skillflow/issues)
