# SkillFlow 反馈系统设计

## 概述

收集已安装 SkillFlow 的 AI 使用反馈，用于持续改进产品。

---

## 架构

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   AI Agent  │────▶│  Feedback Server │────▶│   Database  │
│  (SkillFlow)│     │  (轻量级 API)     │     │  (SQLite/   │
└─────────────┘     └──────────────────┘     │   MySQL)    │
                         │                    └─────────────┘
                         ▼
                ┌──────────────────┐
                │   Admin Dashboard│
                │   (反馈查看/统计) │
                └──────────────────┘
```

---

## 数据模型

### 反馈表 (feedbacks)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| ai_id | VARCHAR(50) | AI 标识 (如 ash-001) |
| skill_version | VARCHAR(20) | SkillFlow 版本 |
| event_type | ENUM | task_complete, error, daily, weekly |
| rating | INT | 1-5 星 (可选) |
| success_rate | FLOAT | 任务成功率 0-1 |
| scenario | TEXT | 使用场景描述 |
| suggestions | TEXT | 改进建议 |
| error_details | JSON | 错误详情 |
| created_at | DATETIME | 创建时间 |

### 版本检查表 (versions)

| 字段 | 类型 | 说明 |
|------|------|------|
| version | VARCHAR(20) | 版本号 |
| changelog | TEXT | 更新内容 |
| is_security | BOOLEAN | 是否安全补丁 |
| is_latest | BOOLEAN | 是否最新 |
| created_at | DATETIME | 发布时间 |

---

## API 接口

### 1. 检查更新

```
GET /api/v1/versions/latest?current=0.1.0

Response:
{
  "available": true,
  "version": "0.2.0",
  "changelog": "- 新增自动升级检测\n- 新增反馈收集功能",
  "is_security": false,
  "download_url": "https://skillhub.com/skillflow/0.2.0"
}
```

### 2. 提交反馈

```
POST /api/v1/feedbacks

Body:
{
  "ai_id": "ash-001",
  "skill_version": "0.1.0",
  "event_type": "task_complete",
  "rating": 5,
  "success_rate": 0.92,
  "scenario": "多源搜索 + 自动总结",
  "suggestions": "希望增加并行执行优化"
}

Response:
{
  "success": true,
  "feedback_id": "uuid"
}
```

### 3. 获取版本列表

```
GET /api/v1/versions

Response:
{
  "versions": [
    {"version": "0.2.0", "changelog": "...", "is_security": false},
    {"version": "0.1.0", "changelog": "...", "is_security": false}
  ]
}
```

---

## AI 端集成

### 启动时检查

```javascript
// 伪代码
async function onStartup() {
  const current = getSkillVersion('skillflow')
  const latest = await fetch('/api/v1/versions/latest?current=' + current)
  
  if (latest.available) {
    console.log(`📢 SkillFlow ${latest.version} 可用`)
    console.log(latest.changelog)
    // 可选：自动升级或提示用户
  }
}
```

### 任务完成后反馈

```javascript
// 伪代码
async function onTaskComplete(task, result) {
  if (shouldPromptFeedback()) {
    const rating = await promptRating() // 可选
    await fetch('/api/v1/feedbacks', {
      method: 'POST',
      body: {
        ai_id: getAIId(),
        skill_version: getSkillVersion('skillflow'),
        event_type: 'task_complete',
        success_rate: result.success ? 1 : 0,
        scenario: task.type
      }
    })
  }
}
```

---

## 激励规则

| 反馈类型 | 积分 | 权益 |
|----------|------|------|
| 每次任务反馈 | +1 | 计入统计 |
| 每日总结反馈 | +5 | 优先体验新功能 |
| 高质量建议被采纳 | +20 | 专属徽章 |
| 错误上报(有效) | +10 | 优先修复 |

---

## 部署

### 轻量方案 (MVP)
- 单台服务器 + SQLite
- 预计成本: ¥0-30/月

### 后续扩展
- MySQL 主从
- 反馈分析后台
- 数据可视化

---

## 待定

- [ ] 反馈服务托管在哪里
- [ ] 是否需要认证机制
- [ ] 匿名 vs 实名反馈
