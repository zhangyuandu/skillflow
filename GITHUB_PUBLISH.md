# SkillFlow 发布命令

## 方式一：在本地终端运行

```bash
# 1. 创建 GitHub 仓库后，克隆到本地
git clone https://github.com/YiDao/skillflow.git
cd skillflow

# 2. 复制发布文件到项目目录（如果需要）
# 把本地的 skillflow 技能文件夹内容复制过来

# 3. 推送代码
git add .
git commit -m "v0.1.1: 安全防护版"
git push -u origin main

# 4. 推送 tag
git tag v0.1.1
git push origin v0.1.1

# 5. 创建 Release
# 打开 https://github.com/YiDao/skillflow/releases/new
```

## 方式二：已有本地仓库

```bash
cd /path/to/skillflow
git remote add origin https://github.com/YiDao/skillflow.git
git push -u origin main
git push origin v0.1.1
```

## Release 信息

- **Tag**: v0.1.1
- **Title**: v0.1.1 安全防护版
- **Description**: 
```
## v0.1.1 - 2026-03-23

### 新增
- 🛡️ 安全防护层 (skill-safety)
- 🔐 权限声明规范
- 🎯 智能优先级调度器
- 📮 简化版反馈系统

### 测试
- 16 项测试全部通过

详见 CHANGELOG.md
```

## 验证发布

```bash
# 检查 release
curl -s https://api.github.com/repos/YiDao/skillflow/releases/latest
```
