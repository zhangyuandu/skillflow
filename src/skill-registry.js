/**
 * SkillFlow 技能注册表 v0.4.0
 * 自动发现、管理、追踪已安装技能
 */

const fs = require('fs');
const path = require('path');

class SkillRegistry {
  constructor(options = {}) {
    this.skillsDir = options.skillsDir || path.join(process.env.HOME || '/root', '.openclaw/workspace/skills');
    this.registry = new Map();
    this.cache = null;
  }

  /**
   * 扫描并注册所有技能
   */
  async discover() {
    const skills = [];
    
    if (!fs.existsSync(this.skillsDir)) {
      console.log('[注册表] 技能目录不存在');
      return skills;
    }

    const entries = fs.readdirSync(this.skillsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillPath = path.join(this.skillsDir, entry.name);
        const skill = await this.loadSkill(entry.name, skillPath);
        if (skill) {
          skills.push(skill);
          this.registry.set(skill.name, skill);
        }
      }
    }

    console.log(`[注册表] 发现 ${skills.length} 个技能`);
    return skills;
  }

  /**
   * 加载单个技能
   */
  async loadSkill(name, skillPath) {
    const skillFile = path.join(skillPath, 'SKILL.md');
    
    if (!fs.existsSync(skillFile)) {
      return null;
    }

    // 读取 SKILL.md 解析元数据
    const content = fs.readFileSync(skillFile, 'utf-8');
    const metadata = this.parseSkillMarkdown(content);
    
    return {
      name: metadata.name || name,
      version: metadata.version || '0.0.0',
      description: metadata.description || '',
      provides: metadata.provides || [],
      depends_on: metadata.depends_on || [],
      keywords: metadata.keywords || [],
      path: skillPath,
      status: 'active',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * 解析 SKILL.md 提取元数据
   */
  parseSkillMarkdown(content) {
    const metadata = {};
    
    // 解析 frontmatter
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
      const lines = fmMatch[1].split('\n');
      let currentKey = null;
      let currentArray = [];
      
      for (const line of lines) {
        // 检查是否是数组项 (以 - 开头)
        if (line.trim().startsWith('- ')) {
          if (currentKey) {
            currentArray.push(line.trim().substring(2).trim());
          }
        } else {
          // 保存之前的数组
          if (currentKey && currentArray.length > 0) {
            metadata[currentKey] = currentArray;
            currentArray = [];
          }
          
          // 解析新的键值对
          const colonIndex = line.indexOf(':');
          if (colonIndex > 0) {
            currentKey = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
            if (currentKey && value) {
              metadata[currentKey] = value;
            }
          }
        }
      }
      
      // 保存最后的数组
      if (currentKey && currentArray.length > 0) {
        metadata[currentKey] = currentArray;
      }
    }

    return metadata;
  }

  /**
   * 根据任务推荐技能
   */
  recommend(task) {
    const taskLower = task.toLowerCase();
    // 简单的中英文分词
    const taskWords = taskLower.split(/[\s,，。、!?！?]+/)
      .map(w => w.trim())
      .filter(w => w.length > 0);
    const recommendations = [];

    for (const [name, skill] of this.registry) {
      let score = 0;
      
      // 精确包含匹配
      for (const keyword of (skill.keywords || [])) {
        if (taskLower.includes(keyword.toLowerCase())) {
          score += 10;
        }
      }
      
      for (const prov of (skill.provides || [])) {
        if (taskLower.includes(prov.toLowerCase())) {
          score += 15;
        }
      }
      
      // 单词部分匹配（任意单词匹配即得分）
      for (const word of taskWords) {
        for (const keyword of (skill.keywords || [])) {
          if (keyword.toLowerCase().includes(word) || word.includes(keyword.toLowerCase())) {
            score += 5;
          }
        }
        for (const prov of (skill.provides || [])) {
          if (prov.toLowerCase().includes(word) || word.includes(prov.toLowerCase())) {
            score += 8;
          }
        }
      }

      if (score > 0) {
        recommendations.push({ skill, score });
      }
    }

    // 按分数排序
    recommendations.sort((a, b) => b.score - a.score);
    
    return recommendations.map(r => ({
      name: r.skill.name,
      version: r.skill.version,
      description: r.skill.description,
      score: r.score,
      path: r.skill.path
    }));
  }

  /**
   * 获取所有技能
   */
  getAll() {
    return Array.from(this.registry.values());
  }

  /**
   * 获取单个技能
   */
  get(name) {
    return this.registry.get(name);
  }

  /**
   * 导出注册表
   */
  export() {
    return {
      version: '0.4.0',
      timestamp: new Date().toISOString(),
      skills: this.getAll()
    };
  }
}

module.exports = SkillRegistry;
