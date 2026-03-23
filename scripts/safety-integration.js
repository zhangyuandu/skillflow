/**
 * SkillFlow Safety Integration
 * 在技能安装前自动进行安全检查
 */

const path = require('path');
const fs = require('fs');

// 尝试加载 skill-safety 扫描器
let safetyScanner = null;
try {
  const scannerPath = path.join(__dirname, '../../skill-safety/scripts/scan.js');
  if (fs.existsSync(scannerPath)) {
    safetyScanner = require(scannerPath);
  }
} catch (e) {
  console.log('[SkillFlow Safety] Scanner not available, skipping checks');
}

// 安全配置
const SAFETY_CONFIG = {
  // 自动阻止的风险等级
  autoBlock: ['CRITICAL'],
  // 需要用户确认的风险等级
  requireConfirm: ['HIGH', 'MEDIUM'],
  // 跳过检查的技能白名单
  whitelist: ['skill-safety', 'skillflow'],
  // 是否启用安全检查
  enabled: true
};

/**
 * 检查技能是否需要安装
 * @param {string} skillName - 技能名称
 * @returns {Promise<{needed: boolean, reason?: string}>}
 */
async function checkSkillNeeded(skillName) {
  const skillsDir = '/root/.openclaw/workspace/skills';
  const skillPath = path.join(skillsDir, skillName);
  
  // 白名单跳过检查
  if (SAFETY_CONFIG.whitelist.includes(skillName)) {
    return { needed: true, reason: 'whitelisted' };
  }
  
  // 已安装
  if (fs.existsSync(skillPath)) {
    return { needed: false, reason: 'already_installed' };
  }
  
  return { needed: true, reason: 'not_installed' };
}

/**
 * 安装前安全检查
 * @param {string} skillName - 技能名称
 * @param {string} skillPath - 技能路径（如果已下载）
 * @returns {Promise<{allowed: boolean, level: string, report?: object, message: string}>}
 */
async function preInstallCheck(skillName, skillPath = null) {
  if (!SAFETY_CONFIG.enabled) {
    return { allowed: true, level: 'SAFE', message: 'Safety check disabled' };
  }
  
  // 白名单跳过
  if (SAFETY_CONFIG.whitelist.includes(skillName)) {
    return { allowed: true, level: 'SAFE', message: 'Whitelisted skill' };
  }
  
  // 没有扫描器，跳过检查
  if (!safetyScanner) {
    return { allowed: true, level: 'UNKNOWN', message: 'Scanner not available' };
  }
  
  // 需要检查的技能路径
  const targetPath = skillPath || path.join('/root/.openclaw/workspace/skills', skillName);
  
  // 技能不存在，跳过（可能是从远程安装）
  if (!fs.existsSync(targetPath)) {
    return { 
      allowed: false, 
      level: 'MEDIUM', 
      message: 'Skill not found locally. Download from trusted source first.' 
    };
  }
  
  try {
    const report = safetyScanner.scan(targetPath);
    
    // 自动阻止
    if (SAFETY_CONFIG.autoBlock.includes(report.level)) {
      return {
        allowed: false,
        level: report.level,
        report,
        message: `⛔ 自动阻止安装: ${report.level} 风险等级`
      };
    }
    
    // 需要确认
    if (SAFETY_CONFIG.requireConfirm.includes(report.level)) {
      return {
        allowed: 'confirm',
        level: report.level,
        report,
        message: `⚠️ 需要确认: ${report.level} 风险等级\n${safetyScanner.formatReport(report)}`
      };
    }
    
    // 低风险，允许
    return {
      allowed: true,
      level: report.level,
      report,
      message: `✅ 安全检查通过: ${report.level}`
    };
    
  } catch (e) {
    return {
      allowed: true,
      level: 'UNKNOWN',
      message: `Safety check error: ${e.message}`
    };
  }
}

/**
 * SkillFlow 集成点
 * 在发现需要安装新技能时调用此函数
 */
async function beforeSkillInstall(skillName, installSource = 'unknown') {
  console.log(`[SkillFlow Safety] Checking skill: ${skillName} (source: ${installSource})`);
  
  // 检查是否需要安装
  const check = await checkSkillNeeded(skillName);
  if (!check.needed) {
    return { action: 'skip', reason: check.reason };
  }
  
  // 安全检查
  const safety = await preInstallCheck(skillName);
  
  if (safety.allowed === true) {
    return { action: 'install', level: safety.level };
  } else if (safety.allowed === 'confirm') {
    // 返回需要用户确认的信息
    return { 
      action: 'confirm', 
      level: safety.level,
      message: safety.message,
      report: safety.report
    };
  } else {
    return { action: 'block', level: safety.level, reason: safety.message };
  }
}

module.exports = {
  preInstallCheck,
  beforeSkillInstall,
  checkSkillNeeded,
  SAFETY_CONFIG
};
