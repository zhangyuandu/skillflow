#!/bin/bash

# SkillFlow 发布脚本
# 用法: ./release.sh [版本号]

set -e

VERSION=${1:-"0.1.1"}
TAG="v${VERSION}"

echo "🚀 SkillFlow 发布脚本"
echo "━━━━━━━━━━━━━━━━━━━━"
echo "版本: ${VERSION}"
echo ""

# 1. 检查 git 状态
echo "📦 检查 git 状态..."
if [[ -n $(git status -s) ]]; then
  echo "❌ 有未提交的更改，请先提交"
  git status -s
  exit 1
fi

# 2. 运行测试
echo "🧪 运行测试..."
npm test

# 3. 更新 package.json 版本
echo "📝 更新 package.json..."
npm version ${VERSION} --no-git-tag-version

# 4. 创建 tag
echo "🏷️  创建 tag: ${TAG}"
git tag -a ${TAG} -m "Release ${TAG}"

# 5. 检查是否已配置 remote
REMOTE=$(git remote -v | grep origin | head -1)
if [[ -z "${REMOTE}" ]]; then
  echo ""
  echo "⚠️  未配置远程仓库，请手动添加:"
  echo "   git remote add origin https://github.com/YOUR_USERNAME/skillflow.git"
  echo "   git push -u origin main"
  echo "   git push origin ${TAG}"
  echo ""
  echo "✅ 本地 tag 已创建: ${TAG}"
else
  echo ""
  echo "📤 准备推送到远程..."
  echo "   git push origin main"
  echo "   git push origin ${TAG}"
  echo ""
  read -p "确认推送? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main
    git push origin ${TAG}
    echo ""
    echo "✅ 推送完成!"
    echo ""
    echo "🔗 创建 Release:"
    echo "   https://github.com/YOUR_USERNAME/skillflow/releases/new"
    echo "   Tag: ${TAG}"
    echo "   Title: ${TAG} 安全防护版"
  fi
fi

echo ""
echo "📋 发布清单:"
echo "   [x] 测试通过"
echo "   [x] 版本号更新"
echo "   [x] Tag 创建"
echo "   [ ] 推送到 GitHub"
echo "   [ ] 创建 Release"
echo "   [ ] 发布到 SkillHub"
