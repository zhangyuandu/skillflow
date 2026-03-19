# 发布检查清单

在发布前需要完成以下准备：

---

## ✅ 已完成

- [x] 核心功能开发
- [x] 文档完善（README、QUICKSTART、CONTRIBUTING等）
- [x] 打包skill文件
- [x] 发布脚本准备
- [x] .gitignore配置

---

## 🔑 需要用户提供的信息

### 1. ClawHub发布（必需）

**获取方式：**
1. 访问 https://clawhub.com
2. 注册/登录账号
3. 进入个人设置获取API Token

**提供信息：**
```
ClawHub API Token: __________________
```

### 2. GitHub发布（可选，推荐）

**需要提供：**
```
GitHub用户名: __________________
GitHub邮箱: __________________
GitHub仓库URL: https://github.com/[用户名]/skillflow
```

**如果还没有GitHub账号：**
- 访问 https://github.com 注册
- 创建新仓库：skillflow

### 3. 项目元信息

**建议填写：**
```
项目名称: skillflow（当前）
         或 skillflow / 其他？
         
作者名称: __________________
作者邮箱: __________________
项目主页: https://github.com/[用户名]/skillflow
```

---

## 🚀 发布步骤

### 方式1: 自动发布（推荐）

提供上述信息后，运行：
```bash
bash /root/.openclaw/workspace/skills/skillflow/scripts/publish.sh
```

### 方式2: 手动发布

**步骤1: 发布到ClawHub**
```bash
clawhub login --token YOUR_TOKEN
cd /root/.openclaw/workspace/skills/skillflow
clawhub publish .
```

**步骤2: 发布到GitHub**
```bash
cd /root/.openclaw/workspace/skills/skillflow
git init
git add .
git commit -m "feat: initial release v0.1.0"
git remote add origin https://github.com/USERNAME/skillflow.git
git push -u origin main
git tag v0.1.0
git push --tags
```

**步骤3: 创建GitHub Release**
1. 访问仓库的 Releases 页面
2. 点击 "Create a new release"
3. 选择标签 v0.1.0
4. 上传 `.skill` 文件
5. 发布

---

## 📋 发布后验证

- [ ] ClawHub搜索能找到: `skillhub search skillflow`
- [ ] GitHub仓库可访问
- [ ] 安装测试通过: `skillhub install skillflow`
- [ ] 文档链接正常

---

## 🎯 发布渠道

| 渠道 | 状态 | 备注 |
|------|------|------|
| ClawHub | ⏳ 等待Token | 需要API Token |
| GitHub | ⏳ 等待配置 | 需要用户名/邮箱 |
| OpenClaw Discord | ⏳ 发布后推广 | 分享链接 |

---

**提供上述信息后，我会立即执行发布流程！**
