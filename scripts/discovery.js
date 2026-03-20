#!/usr/bin/env node
/**
 * Skill Discovery Script (Node.js 版本)
 * 
 * 更可靠的技能发现实现
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
 * 提取技能元数据
 */
function extractSkillMetadata(skillMdPath) {
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

  // 提取能力
  const capabilities = [];
  const capKeywords = ['search', 'write', 'read', 'create', 'edit', 'delete', 
                       'upload', 'download', 'summarize', 'translate', 'execute',
                       'analyze', 'fetch', 'send', 'notify', 'browse', 'plan'];
  
  const lowerDesc = description.toLowerCase();
  capKeywords.forEach(cap => {
    if (lowerDesc.includes(cap)) {
      capabilities.push(cap);
    }
  });

  return {
    name,
    description: description.substring(0, 200),
    capabilities,
    path: path.dirname(skillMdPath)
  };
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
    
    console.log(`[INFO] 扫描: ${dir}`);
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach(entry => {
      if (!entry.isDirectory()) {
        return;
      }
      
      const skillMdPath = path.join(dir, entry.name, 'SKILL.md');
      const metadata = extractSkillMetadata(skillMdPath);
      
      if (metadata) {
        skills.push(metadata);
        console.log(`[INFO]   发现: ${metadata.name}`);
      }
    });
  });
  
  return skills;
}

/**
 * 构建能力索引
 */
function buildCapabilityIndex(skills) {
  const index = {};
  
  skills.forEach(skill => {
    skill.capabilities.forEach(cap => {
      if (!index[cap]) {
        index[cap] = [];
      }
      index[cap].push(skill.name);
    });
  });
  
  return index;
}

/**
 * 主函数
 */
function main() {
  console.log('[INFO] SkillFlow 技能发现');
  console.log('--------------------------------');
  
  // 扫描技能
  const skills = scanSkills();
  console.log(`[INFO] 共发现 ${skills.length} 个技能`);
  
  // 构建能力索引
  console.log('[INFO] 构建能力索引...');
  const capabilitiesIndex = buildCapabilityIndex(skills);
  
  // 创建注册表
  const registry = {
    skills: skills.reduce((acc, skill) => {
      acc[skill.name] = skill;
      return acc;
    }, {}),
    capabilities_index: capabilitiesIndex,
    last_updated: new Date().toISOString()
  };
  
  // 保存缓存
  const cacheDir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  fs.writeFileSync(CACHE_FILE, JSON.stringify(registry, null, 2));
  
  console.log(`[INFO] 注册表已保存: ${CACHE_FILE}`);
  
  // 输出
  console.log('\n' + JSON.stringify(registry, null, 2));
}

main();
