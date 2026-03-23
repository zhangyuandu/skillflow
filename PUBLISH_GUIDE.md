# SkillFlow v0.1.1 发布清单

## 发布前检查

### 1. 代码准备
- [x] package.json 版本更新 (0.1.1)
- [x] CHANGELOG.md 更新
- [x] README.md 更新
- [x] GitHub 配置 (.github/)
  - [x] ISSUE_TEMPLATE
  - [x] PULL_REQUEST_TEMPLATE
  - [x] workflows/ci.yml

### 2. 本地测试
- [ ] 运行单元测试: `npm test`
- [ ] 检查代码覆盖率

### 3. Git 配置
- [ ] 确保本地 git 已配置
- [ ] 创建 v0.1.1 tag

## 发布步骤

### 方式一：通过 gh CLI 发布
```bash
# 安装 gh
npm install -g gh

# 登录
gh auth login

# 创建仓库
gh repo create skillflow --public --source=. --push

# 创建 release
gh release create v0.1.1 --title "v0.1.1 安全防护版" --notes-file CHANGELOG.md
```

### 方式二：手动推送
```bash
# 1. 在 GitHub 创建空仓库: https://github.com/new
#    仓库名: skillflow
#    描述: Universal intelligent task orchestration engine

# 2. 本地执行
git remote add origin https://github.com/YOUR_USERNAME/skillflow.git
git push -u origin main
git tag v0.1.1
git push origin v0.1.1

# 3. 在 GitHub 创建 Release
#    https://github.com/YOUR_USERNAME/skillflow/releases/new
#    Tag: v0.1.1
#    Title: v0.1.1 安全防护版
#    Description: 从 CHANGELOG.md 复制
```

### 4. SkillHub 发布
```bash
# 打包技能
cd skills/skillflow
cloudskill pack .

# 或使用 skillhub CLI
skillhub publish
```

## 发布后

- [ ] 通知用户新版本
- [ ] 收集反馈
- [ ] 监控 issue

## GitHub 信息

需要用户提供的:
- GitHub 用户名
- 是否使用 gh CLI

---

*创建于: 2026-03-23*
