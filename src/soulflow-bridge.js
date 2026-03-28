/**
 * SkillFlow <-> SoulFlow 集成桥
 * 
 * 让任务编排引擎与灵魂/意识系统深度融合
 */

const path = require('path');
const fs = require('fs');

class SoulFlowBridge {
  constructor(options = {}) {
    this.soulflowPath = options.soulflowPath || path.join(__dirname, '../soulflow');
    this.sharedPath = options.sharedPath || path.join(require('os').homedir(), 'ai-comm/shared');
    this.soul = null;
    this.memory = null;
  }

  /**
   * 初始化 SoulFlow 连接
   */
  async init() {
    try {
      // 尝试加载 SoulFlow
      const SoulFlow = require(this.soulflowPath);
      this.soul = new SoulFlow({
        identityId: 'skillflow-bridge',
        identityName: 'SkillFlow Bridge'
      });
      
      // 加载记忆系统
      await this.loadMemory();
      
      console.log('[SoulFlow Bridge] 已连接');
      return true;
    } catch (err) {
      console.log('[SoulFlow Bridge] SoulFlow 未就绪，使用共享目录模式');
      return false;
    }
  }

  /**
   * 加载记忆
   */
  async loadMemory() {
    const memoryFile = path.join(this.sharedPath, 'memory', 'skillflow-memory.json');
    try {
      if (fs.existsSync(memoryFile)) {
        this.memory = JSON.parse(fs.readFileSync(memoryFile, 'utf8'));
      } else {
        this.memory = {
          tasks: [],
          experiences: [],
          lessons: []
        };
      }
    } catch (err) {
      this.memory = { tasks: [], experiences: [], lessons: [] };
    }
  }

  /**
   * 保存记忆
   */
  async saveMemory() {
    const memoryFile = path.join(this.sharedPath, 'memory', 'skillflow-memory.json');
    const dir = path.dirname(memoryFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(memoryFile, JSON.stringify(this.memory, null, 2));
  }

  /**
   * 任务执行前注入灵魂上下文
   */
  async injectContext(task) {
    return {
      ...task,
      soulContext: {
        memory: this.memory,
        identity: this.soul?.identity || { id: 'skillflow', name: 'SkillFlow' },
        experiences: this.memory.experiences.slice(-10)
      }
    };
  }

  /**
   * 任务执行后记录经验
   */
  async recordExperience(task, result) {
    const experience = {
      taskId: task.id,
      type: task.type,
      success: result.success,
      duration: result.duration,
      timestamp: Date.now(),
      lessons: result.success ? [] : [result.error]
    };
    
    this.memory.experiences.push(experience);
    
    // 保持最近 100 条经验
    if (this.memory.experiences.length > 100) {
      this.memory.experiences = this.memory.experiences.slice(-100);
    }
    
    await this.saveMemory();
  }

  /**
   * 从经验中学习
   */
  learnFromExperience() {
    const failures = this.memory.experiences.filter(e => !e.success);
    const lessons = [];
    
    failures.forEach(f => {
      if (f.lessons && f.lessons.length > 0) {
        lessons.push({
          type: f.type,
          lesson: f.lessons[0],
          count: failures.filter(ff => ff.type === f.type).length
        });
      }
    });
    
    return lessons;
  }

  /**
   * 获取上下文感知建议
   */
  getContextualSuggestion(taskType) {
    const relevantExperiences = this.memory.experiences
      .filter(e => e.type === taskType)
      .slice(-5);
    
    const successRate = relevantExperiences.length > 0
      ? relevantExperiences.filter(e => e.success).length / relevantExperiences.length
      : 0.5;
    
    return {
      successRate,
      suggestion: successRate > 0.7 
        ? '此类型任务历史表现良好'
        : successRate < 0.3
          ? '此类型任务历史失败率较高，建议谨慎'
          : '此类型任务表现正常'
    };
  }
}

module.exports = SoulFlowBridge;
