#!/usr/bin/env node

/**
 * SkillFlow Feedback System (简化版)
 * - 任务完成后轻量反馈
 * - 错误自动上报
 * - 版本升级检查
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 配置
const CONFIG = {
  storagePath: path.join(process.env.HOME, '.openclaw', 'feedback.json'),
  versionCheckUrl: 'https://api.github.com/repos/skillflow/releases/latest',
  currentVersion: '0.1.1',
  feedbackTimeout: 10000 // 10秒超时
};

// 反馈存储结构
function loadFeedback() {
  try {
    if (fs.existsSync(CONFIG.storagePath)) {
      return JSON.parse(fs.readFileSync(CONFIG.storagePath, 'utf-8'));
    }
  } catch (e) {
    // 忽略
  }
  return { feedbacks: [], errors: [], lastVersionCheck: null };
}

function saveFeedback(data) {
  const dir = path.dirname(CONFIG.storagePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG.storagePath, JSON.stringify(data, null, 2));
}

/**
 * 提交轻量反馈
 * @param {Object} feedback - 反馈内容
 */
function submitFeedback(feedback) {
  const data = loadFeedback();
  
  const entry = {
    id: `fb-${Date.now()}`,
    type: 'task',
    rating: feedback.rating, // 1-5 星
    comment: feedback.comment || '',
    taskId: feedback.taskId,
    taskTitle: feedback.taskTitle,
    timestamp: new Date().toISOString(),
    version: CONFIG.currentVersion
  };
  
  data.feedbacks.push(entry);
  
  // 只保留最近100条
  if (data.feedbacks.length > 100) {
    data.feedbacks = data.feedbacks.slice(-100);
  }
  
  saveFeedback(data);
  
  return entry;
}

/**
 * 提交错误报告
 * @param {Object} error - 错误信息
 */
function reportError(error) {
  const data = loadFeedback();
  
  const entry = {
    id: `err-${Date.now()}`,
    type: 'error',
    message: error.message || String(error),
    stack: error.stack || '',
    context: error.context || {},
    timestamp: new Date().toISOString(),
    version: CONFIG.currentVersion,
    resolved: false
  };
  
  data.errors.push(entry);
  
  // 只保留最近50条
  if (data.errors.length > 50) {
    data.errors = data.errors.slice(-50);
  }
  
  saveFeedback(data);
  
  return entry;
}

/**
 * 检查新版本
 * @returns {Promise<Object>} 版本信息
 */
function checkVersion() {
  return new Promise((resolve) => {
    const data = loadFeedback();
    
    const options = {
      hostname: 'api.github.com',
      path: '/repos/skillflow/releases/latest',
      method: 'GET',
      headers: {
        'User-Agent': 'SkillFlow-Feedback/1.0'
      },
      timeout: CONFIG.feedbackTimeout
    };
    
    const req = https.get(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const release = JSON.parse(body);
          const latestVersion = release.tag_name?.replace('v', '') || '0.0.0';
          const hasUpdate = compareVersion(latestVersion, CONFIG.currentVersion) > 0;
          
          data.lastVersionCheck = new Date().toISOString();
          saveFeedback(data);
          
          resolve({
            current: CONFIG.currentVersion,
            latest: latestVersion,
            hasUpdate,
            url: release.html_url,
            body: release.body
          });
        } catch (e) {
          resolve({
            current: CONFIG.currentVersion,
            latest: CONFIG.currentVersion,
            hasUpdate: false,
            error: e.message
          });
        }
      });
    });
    
    req.on('error', (e) => {
      resolve({
        current: CONFIG.currentVersion,
        latest: CONFIG.currentVersion,
        hasUpdate: false,
        error: e.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        current: CONFIG.currentVersion,
        latest: CONFIG.currentVersion,
        hasUpdate: false,
        error: 'Timeout'
      });
    });
  });
}

/**
 * 比较版本号
 * @returns {number} 1: a > b, 0: a = b, -1: a < b
 */
function compareVersion(a, b) {
  const pa = a.split('.').map(n => parseInt(n) || 0);
  const pb = b.split('.').map(n => parseInt(n) || 0);
  
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

/**
 * 生成升级提示
 */
function formatUpgradeMessage(versionInfo) {
  if (!versionInfo.hasUpdate) {
    return null;
  }
  
  let msg = `\n🔔 新版本可用!\n`;
  msg += `━━━━━━━━━━━━━━━━━━\n`;
  msg += `当前版本: v${versionInfo.current}\n`;
  msg += `最新版本: v${versionInfo.latest}\n`;
  msg += `\n发布说明:\n${versionInfo.body?.substring(0, 200) || '暂无'}\n`;
  msg += `\n查看详情: ${versionInfo.url}\n`;
  
  return msg;
}

/**
 * 获取反馈统计
 */
function getStats() {
  const data = loadFeedback();
  
  const ratings = data.feedbacks
    .filter(f => f.rating)
    .map(f => f.rating);
  
  const avgRating = ratings.length > 0
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : null;
  
  return {
    totalFeedback: data.feedbacks.length,
    totalErrors: data.errors.length,
    unresolvedErrors: data.errors.filter(e => !e.resolved).length,
    averageRating: avgRating,
    lastVersionCheck: data.lastVersionCheck,
    currentVersion: CONFIG.currentVersion
  };
}

/**
 * 获取错误列表
 */
function getErrors(limit = 10) {
  const data = loadFeedback();
  return data.errors.slice(-limit).reverse();
}

/**
 * 标记错误已解决
 */
function resolveError(errorId) {
  const data = loadFeedback();
  const error = data.errors.find(e => e.id === errorId);
  if (error) {
    error.resolved = true;
    error.resolvedAt = new Date().toISOString();
    saveFeedback(data);
    return true;
  }
  return false;
}

// CLI 入口
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'rate':
      // 评分: feedback rate <1-5> [comment]
      const rating = parseInt(args[1]);
      if (!rating || rating < 1 || rating > 5) {
        console.log('用法: feedback rate <1-5> [评论]');
        process.exit(1);
      }
      const comment = args.slice(2).join(' ');
      submitFeedback({ rating, comment });
      console.log(`\n✅ 感谢您的反馈! ⭐`.repeat(rating));
      break;
      
    case 'error':
      // 上报错误: feedback error <message>
      const message = args.slice(1).join(' ');
      reportError({ message });
      console.log('\n✅ 错误已记录，我们会尽快处理');
      break;
      
    case 'version':
    case 'check':
      console.log(`\n🔍 检查新版本...`);
      checkVersion().then(info => {
        if (info.error) {
          console.log(`检查失败: ${info.error}`);
        } else if (info.hasUpdate) {
          console.log(formatUpgradeMessage(info));
        } else {
          console.log(`\n✅ 当前已是最新版本 v${info.current}`);
        }
      });
      break;
      
    case 'stats':
      const stats = getStats();
      console.log('\n📊 反馈统计');
      console.log('━━━━━━━━━━━━━━━━━━');
      console.log(`  当前版本: v${stats.currentVersion}`);
      console.log(`  总反馈: ${stats.totalFeedback}`);
      console.log(`  平均评分: ${stats.averageRating ? '⭐' + stats.averageRating : 'N/A'}`);
      console.log(`  错误报告: ${stats.totalErrors} (未解决: ${stats.unresolvedErrors})`);
      console.log(`  最后版本检查: ${stats.lastVersionCheck || '从未'}`);
      break;
      
    case 'errors':
      const errors = getErrors();
      console.log('\n🚨 最近错误');
      console.log('━━━━━━━━━━━━━━━━━━');
      errors.forEach(e => {
        const status = e.resolved ? '✅' : '❌';
        console.log(`  ${status} [${e.id}] ${e.message}`);
        console.log(`      ${e.timestamp}`);
      });
      break;
      
    case 'resolve':
      const errorId = args[1];
      if (resolveError(errorId)) {
        console.log(`\n✅ 错误 ${errorId} 已标记为已解决`);
      } else {
        console.log(`\n❌ 找不到错误: ${errorId}`);
      }
      break;
      
    default:
      console.log(`
📮 SkillFlow Feedback (简化版)

用法:
  feedback rate <1-5> [评论]    任务评分
  feedback error <消息>         上报错误
  feedback version              检查新版本
  feedback stats                反馈统计
  feedback errors               查看错误列表
  feedback resolve <id>          标记错误已解决
`);
  }
}

module.exports = {
  submitFeedback,
  reportError,
  checkVersion,
  formatUpgradeMessage,
  getStats,
  getErrors,
  resolveError,
  CONFIG
};
