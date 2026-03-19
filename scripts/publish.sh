#!/bin/bash
# SkillFlow 一键发布脚本

set -e

echo "🚀 SkillFlow 发布脚本"
echo "================================"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. 检查登录状态
echo -e "\n${YELLOW}[1/5] 检查ClawHub登录状态...${NC}"
if clawhub whoami &>/dev/null; then
    echo -e "${GREEN}✓ 已登录ClawHub${NC}"
else
    echo "需要登录ClawHub"
    echo "运行: clawhub login --token YOUR_TOKEN"
    exit 1
fi

# 2. 发布到ClawHub
echo -e "\n${YELLOW}[2/5] 发布到ClawHub...${NC}"
cd /root/.openclaw/workspace/skills/skillflow
clawhub publish . || clawhub sync .

# 3. 打包skill文件
echo -e "\n${YELLOW}[3/5] 打包skill文件...${NC}"
python3 ~/.local/share/pnpm/global/5/.pnpm/openclaw@*/node_modules/openclaw/skills/skill-creator/scripts/package_skill.py .
mv ../*.skill /tmp/skillflow-latest.skill

# 4. Git操作
echo -e "\n${YELLOW}[4/5] Git提交...${NC}"
git add -A
git commit -m "release: v0.1.0 - Beta release"
git tag v0.1.0
git push origin main --tags

# 5. 创建GitHub Release
echo -e "\n${YELLOW}[5/5] 创建GitHub Release...${NC}"
gh release create v0.1.0 \
    /tmp/skillflow-latest.skill \
    --title "v0.1.0 - Beta Release" \
    --notes "首个Beta版本发布

## ✨ 核心功能
- 任务自动拆解与编排
- 技能自动发现与路由
- 5种编排模式支持
- 完整文档和案例

## 📦 安装
\`\`\`bash
skillhub install skillflow
\`\`\`

## 🚀 快速开始
查看 [QUICKSTART.md](QUICKSTART.md)"

echo -e "\n${GREEN}✅ 发布完成！${NC}"
echo "ClawHub: https://clawhub.com/skills/skillflow"
echo "GitHub: https://github.com/YOUR_USERNAME/skillflow/releases/tag/v0.1.0"
