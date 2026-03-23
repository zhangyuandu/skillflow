#!/usr/bin/env node
/**
 * Skill Discovery Script (增强版 v2)
 * 
 * 改进：
 * 1. 增强元数据提取（支持更多字段）
 * 2. 集成 skill-safety 扫描
 * 3. 支持能力向量（可选）
 */

const fs = require('fs');
const path = require('path');

const SKILL_DIRS = [
  process.env.HOME + '/.openclaw/skills',
  process.env.HOME + '/.openclaw/workspace/skills',
  '/usr/local/share/openclaw/skills'
];

const CACHE_FILE = process.env.HOME + '/.openclaw/cache/skillflow-registry.json';

/**
 * 提取技能元数据（增强版）
 */
function extractSkillMetadata(skillDir) {
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    return null;
  }

  const content = fs.readFileSync(skillMdPath, 'utf-8');
  
  // 提取 frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return null;
  }

  const frontmatter = frontmatterMatch[1];
  
  // 解析 name
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const name = nameMatch ? nameMatch[1].trim().replace(/^["']|["']$/g, '') : null;
  
  if (!name) {
    return null;
  }

  // 解析 description
  const descMatch = frontmatter.match(/^description:\s*["']?(.+?)["']?\s*$/m);
  const description = descMatch ? descMatch[1].trim().replace(/^["']|["']$/g, '') : '';

  // 解析 version
  const versionMatch = frontmatter.match(/^version:\s*(.+)$/m);
  const version = versionMatch ? versionMatch[1].trim().replace(/^["']|["']$/g, '') : '1.0.0';

  // 解析 permissions（新增）
  const permissionsMatch = frontmatter.match(/^permissions:\s*\n((?:\s*-\s*.+\n?)+)/m);
  const permissions = [];
  if (permissionsMatch) {
    permissionsMatch[1].split('\n').forEach(line => {
      const match = line.match(/-\s*(\w+(?::\w+)?)/);
      if (match) permissions.push(match[1]);
    });
  }

  // 提取 capabilities（增强关键词库）
  const capabilities = extractCapabilities(description + ' ' + content, content);

  // 提取 usage examples
  const usageMatch = content.match(/```(?:bash|javascript|js)([\s\S]*?)```/);
  const usage = usageMatch ? usageMatch[1].trim() : null;

  // 提取 keywords
  const keywordsMatch = frontmatter.match(/^keywords:\s*(.+)$/m);
  const keywords = keywordsMatch 
    ? keywordsMatch[1].split(',').map(k => k.trim())
    : [];

  return {
    name,
    description: description.substring(0, 300),
    version,
    capabilities,
    permissions,
    keywords,
    usage,
    path: skillDir,
    lastUpdated: fs.statSync(skillMdPath).mtime.toISOString()
  };
}

/**
 * 提取能力列表（扩展关键词库）
 */
function extractCapabilities(description, content) {
  const capabilities = [];
  
  // 扩展关键词库
  const capKeywords = {
    // 搜索/获取
    search: ['search', '查找', '找', 'query'],
    fetch: ['fetch', 'get', '获取', '拉取'],
    browse: ['browse', '浏览', '访问', 'visit'],
    
    // 处理
    summarize: ['summarize', '总结', '摘要', '概括'],
    analyze: ['analyze', '分析', '解析'],
    translate: ['translate', '翻译', 'convert'],
    convert: ['convert', '转换', 'transform'],
    generate: ['generate', '生成', '创建'],
    
    // 文件操作
    read: ['read', '读取', '查看'],
    write: ['write', '写入', '保存', 'save'],
    edit: ['edit', '编辑', '修改'],
    delete: ['delete', '删除', 'remove'],
    upload: ['upload', '上传'],
    download: ['download', '下载'],
    
    // 通信
    send: ['send', '发送', '发'],
    notify: ['notify', '通知', '提醒'],
    email: ['email', 'mail', '邮件'],
    
    // 执行
    execute: ['execute', '执行', 'run', '运行'],
    schedule: ['schedule', '定时', 'cron', '调度'],
    
    // AI 能力
    plan: ['plan', '规划', '计划', '拆分'],
    chat: ['chat', '对话', '聊天', '问答'],
    embed: ['embed', 'embedding', '向量'],
    
    // 数据
    weather: ['weather', '天气', 'forecast', '预报'],
    finance: ['finance', '金融', 'stock', '股票', 'crypto', '加密'],
    
    // 区块链
    blockchain: ['blockchain', 'crypto', 'token', 'web3'],
    trade: ['trade', '交易', 'swap', 'exchange'],
  };

  const lowerDesc = (description + ' ' + content).toLowerCase();
  
  for (const [cap, keywords] of Object.entries(capKeywords)) {
    if (keywords.some(kw => lowerDesc.includes(kw))) {
      capabilities.push(cap);
    }
  }

  return [...new Set(capabilities)]; // 去重
}

/**
 * 安全扫描（集成 skill-safety）
 */
async function scanSecurity(skillDir) {
  const safetyScript = path.join(__dirname, '..', 'skill-safety', 'scripts', 'scan.js');
  
  if (!fs.existsSync(safetyScript)) {
    return { level: 'UNKNOWN', risks: [] };
  }

  try {
    const { scan } = require(safetyScript);
    const result = scan(skillDir);
    return {
      level: result.level,
      risks: result.risks.length,
      permissions: result.permissions
    };
  } catch (e) {
    return { level: 'UNKNOWN', error: e.message };
  }
}

/**
 * 扫描技能目录
 */
function scanSkills() {
  const skills = [];
  
  SKILL_DIRS.forEach(dir => {
    if (!fs.existsSync(dir)) {
      return;
    }

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith('.')) continue;
        
        const skillDir = path.join(dir, entry.name);
        const metadata = extractSkillMetadata(skillDir);
        
        if (metadata) {
          skills.push(metadata);
        }
      }
    } catch (e) {
      // 忽略权限错误
    }
  });

  return skills;
}

/**
 * 保存缓存（转换为对象格式）
 */
function saveCache(skills) {
  // 转换为对象格式：{ skillName: skillData }
  const skillsObj = {};
  for (const skill of skills) {
    skillsObj[skill.name] = skill;
  }
  
  const cache = {
    skills: skillsObj,
    timestamp: new Date().toISOString(),
    version: '2.0'
  };
  
  const dir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

/**
 * 加载缓存
 */
function loadCache() {
  if (!fs.existsSync(CACHE_FILE)) {
    return null;
  }
  
  try {
    const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    
    // 检查缓存是否过期（24小时）
    const cacheAge = Date.now() - new Date(cache.timestamp).getTime();
    if (cacheAge > 24 * 60 * 60 * 1000) {
      return null;
    }
    
    return cache;
  } catch (e) {
    return null;
  }
}

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  // 尝试加载缓存
  const cache = loadCache();
  if (cache && cache.skills) {
    console.log(JSON.stringify({ skills: cache.skills }, null, 2));
    return;
  }

  // 扫描技能
  const skills = scanSkills();
  
  // 添加安全信息（异步）
  for (const skill of skills) {
    const safety = await scanSecurity(skill.path);
    skill.security = {
      level: safety.level,
      riskCount: safety.risks || 0,
      permissionsDeclared: skill.permissions.length > 0
    };
  }

  // 转换为对象格式输出
  const skillsObj = {};
  for (const skill of skills) {
    skillsObj[skill.name] = skill;
  }
  
  // 保存缓存
  saveCache(skills);
  
  console.log(JSON.stringify({ skills: skillsObj }, null, 2));
}

main().catch(console.error);
