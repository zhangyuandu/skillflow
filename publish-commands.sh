#!/bin/bash
# SkillFlow 一键发布命令
# 在本地终端运行此脚本

echo "🚀 SkillFlow 一键发布"
echo "========================"
echo ""

# 1. 克隆或进入项目目录
echo "📂 检查项目目录..."
if [ -d "/Users/YiDao/Projects/skillflow" ]; then
  cd /Users/YiDao/Projects/skillflow
elif [ -d "$HOME/skillflow" ]; then
  cd $HOME/skillflow
else
  echo "请指定项目路径，或手动运行以下命令："
  echo "  git clone https://github.com/YiDao/skillflow.git"
  echo "  cd skillflow"
  exit 1
fi

# 2. 检查 git 状态
echo "📦 检查 git 状态..."
if [ -n "$(git status -s)" ]; then
  echo "❌ 有未提交的更改"
  git status -s
  exit 1
fi

# 3. 推送代码
echo "📤 推送到 GitHub..."
git push -u origin main

# 4. 推送 tag
echo "🏷️  推送 tag..."
git push origin v0.1.1

echo ""
echo "✅ 代码推送完成!"
echo ""
echo "🔗 访问 https://github.com/YiDao/skillflow/releases/new"
echo "   Tag: v0.1.1"
echo "   Title: v0.1.1 安全防护版"
echo ""
