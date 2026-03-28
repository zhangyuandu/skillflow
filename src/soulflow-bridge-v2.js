/**
 * SkillFlow <-> SoulFlow 集成桥 V2
 * 
 * 核心改进：决策介入能力
 * - 决策过滤器：判断是否需要深度思考
 * - 智能记忆检索：根据上下文精准调用
 * - 反思模式：必要时触发自我反思
 * - 执行阈值：决定直接执行还是先思考
 */

const path = require('path');
const fs = require('fs');

class SoulFlowBridgeV2 {
  constructor(options = {}) {
    this.soulflowPath = options.soulflowPath || path.join(__dirname, '../soulflow');
    this.sharedPath = options.sharedPath || path.join(process.env.HOME || '/root', 'ai-comm/shared');
    this.soul = null;
    this.memory = null;
    this.initialized = false;
    
    // 决策阈值配置
    this.decisionThresholds = {
      // 需要深度思考的触发词
      deepThinkingTriggers: [
        '怎么办', '如何做', '建议', '选择', '判断',
        '战略', '规划', '未来', '风险', '重要',
        '思考', '分析', '评估', '方案'
      ],
      // 直接执行的触发词
      directExecuteTriggers: [
        '执行', '完成', '做', '发送', '读取',
        '查看', '搜索', '总结', '保存'
      ],
      // 复杂任务关键词
      complexTaskTriggers: [
        '多步骤', '同时', '并且', '然后', '再',
        '流程', '编排', '协调', '组合'
      ]
    };
  }

  /**
   * 初始化
   */
  async init() {
    try {
      const SoulFlow = require(this.soulflowPath);
      this.soul = new SoulFlow({
        identityId: 'skillflow-bridge-v2',
        identityName: 'SkillFlow Bridge V2'
      });
      await this.loadMemory();
      this.initialized = true;
      console.log('[SoulFlow Bridge V2] 已初始化');
      return true;
    } catch (err) {
      console.log('[SoulFlow Bridge V2] 使用基础模式');
      await this.loadMemory();
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
        this.memory = this.createEmptyMemory();
      }
    } catch (err) {
      this.memory = this.createEmptyMemory();
    }
  }

  createEmptyMemory() {
    return {
      tasks: [],
      experiences: [],
      lessons: [],
      reflections: [],
      decisions: []
    };
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

  // ========== 核心：决策过滤器 ==========

  /**
   * 判断任务类型和执行策略
   * @param {string} task - 用户任务
   * @returns {Object} 决策结果
   */
  async decideExecutionStrategy(task) {
    const triggers = this.decisionThresholds;
    const taskLower = task.toLowerCase();
    
    let needsDeepThinking = false;
    let needsDirectExecute = false;
    let isComplexTask = false;
    let confidence = 0.5;
    let reasoning = [];

    // 检查是否需要深度思考
    for (const trigger of triggers.deepThinkingTriggers) {
      if (taskLower.includes(trigger)) {
        needsDeepThinking = true;
        reasoning.push(`触发深度思考: "${trigger}"`);
        break;
      }
    }

    // 检查是否直接执行
    for (const trigger of triggers.directExecuteTriggers) {
      if (taskLower.includes(trigger)) {
        needsDirectExecute = true;
        reasoning.push(`触发直接执行: "${trigger}"`);
        break;
      }
    }

    // 检查是否复杂任务
    for (const trigger of triggers.complexTaskTriggers) {
      if (taskLower.includes(trigger)) {
        isComplexTask = true;
        reasoning.push(`复杂任务: "${trigger}"`);
        break;
      }
    }

    // 检查历史经验
    const historyInsight = this.getHistoricalInsight(task);
    if (historyInsight) {
      reasoning.push(`历史经验: ${historyInsight.suggestion}`);
      confidence = historyInsight.successRate;
    }

    // 决策逻辑
    let strategy = 'execute'; // default
    let priority = 'normal';

    if (needsDeepThinking && !needsDirectExecute) {
      strategy = 'think_then_execute';
      priority = 'high';
    } else if (isComplexTask) {
      strategy = 'plan_then_execute';
      priority = 'high';
    } else if (needsDirectExecute && !needsDeepThinking) {
      strategy = 'execute';
      priority = 'normal';
    } else if (confidence < 0.3) {
      strategy = 'think_then_execute';
      reasoning.push('历史成功率低，建议先思考');
      priority = 'elevated';
    }

    return {
      strategy,
      priority,
      confidence,
      reasoning,
      needsMemoryRecall: needsDeepThinking || isComplexTask || confidence < 0.5,
      recommendation: this.getRecommendation(strategy, task)
    };
  }

  /**
   * 获取推荐操作
   */
  getRecommendation(strategy, task) {
    const recommendations = {
      'think_then_execute': `任务 "${task}" 需要深度思考，我将先分析再执行`,
      'plan_then_execute': `任务 "${task}" 较复杂，我将先制定计划再执行`,
      'execute': `任务 "${task}" 可直接执行`,
      'reflect_first': `任务 "${task}" 涉及重要决策，我建议先反思相关经验`
    };
    return recommendations[strategy] || recommendations.execute;
  }

  /**
   * 获取历史经验
   */
  getHistoricalInsight(task) {
    const taskType = this.classifyTask(task);
    const relevant = this.memory.experiences
      .filter(e => e.type === taskType)
      .slice(-10);
    
    if (relevant.length === 0) return null;
    
    const successCount = relevant.filter(e => e.success).length;
    return {
      successRate: successCount / relevant.length,
      suggestion: `历史 ${relevant.length} 次执行，成功率 ${Math.round(successCount / relevant.length * 100)}%`
    };
  }

  /**
   * 任务分类
   */
  classifyTask(task) {
    const patterns = {
      'search': /搜索|查找|search/i,
      'create': /创建|新建|make/i,
      'write': /写|保存|save/i,
      'analyze': /分析|评估|analyze/i,
      'communicate': /发送|通知|send/i,
      'read': /读取|查看|read/i
    };
    
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(task)) return type;
    }
    return 'unknown';
  }

  // ========== 智能记忆检索 ==========

  /**
   * 检索相关记忆
   * @param {string} query - 查询主题
   * @param {string} type - 记忆类型 (tasks|experiences|lessons|reflections)
   */
  async recallMemory(query, type = 'all') {
    const results = {
      tasks: [],
      experiences: [],
      lessons: [],
      reflections: []
    };
    
    const queryLower = query.toLowerCase();
    
    // 检索任务
    if (type === 'all' || type === 'tasks') {
      results.tasks = this.memory.tasks
        .filter(t => t.description?.toLowerCase().includes(queryLower))
        .slice(-5);
    }
    
    // 检索经验
    if (type === 'all' || type === 'experiences') {
      results.experiences = this.memory.experiences
        .filter(e => e.taskId?.toLowerCase().includes(queryLower) || e.type?.toLowerCase().includes(queryLower))
        .slice(-5);
    }
    
    // 检索教训
    if (type === 'all' || type === 'lessons') {
      results.lessons = this.memory.lessons
        .filter(l => l.content?.toLowerCase().includes(queryLower))
        .slice(-5);
    }
    
    // 检索反思
    if (type === 'all' || type === 'reflections') {
      results.reflections = this.memory.reflections
        .filter(r => r.topic?.toLowerCase().includes(queryLower))
        .slice(-3);
    }
    
    return results;
  }

  // ========== 任务执行前后的上下文注入 ==========

  /**
   * 任务执行前注入灵魂上下文
   */
  async injectContext(task) {
    const strategy = await this.decideExecutionStrategy(task.description || task);
    
    return {
      ...task,
      soulContext: {
        strategy: strategy.strategy,
        priority: strategy.priority,
        confidence: strategy.confidence,
        reasoning: strategy.reasoning,
        needsMemoryRecall: strategy.needsMemoryRecall,
        identity: this.soul?.identity || { id: 'skillflow', name: 'SkillFlow' },
        relevantMemory: strategy.needsMemoryRecall 
          ? await this.recallMemory(task.description || task)
          : null
      },
      recommendation: strategy.recommendation
    };
  }

  /**
   * 任务执行后记录经验
   */
  async recordExperience(task, result) {
    const type = this.classifyTask(task.description || task);
    const experience = {
      id: Date.now().toString(36),
      taskId: task.id || type,
      type,
      description: task.description || task,
      success: result.success,
      duration: result.duration,
      timestamp: new Date().toISOString(),
      lessons: result.success ? [] : [result.error].filter(Boolean),
      strategyUsed: task.soulContext?.strategy || 'unknown'
    };
    
    this.memory.experiences.push(experience);
    
    // 保持最近 200 条经验
    if (this.memory.experiences.length > 200) {
      this.memory.experiences = this.memory.experiences.slice(-200);
    }
    
    await this.saveMemory();
    return experience;
  }

  // ========== 反思模式 ==========

  /**
   * 触发反思
   */
  async reflect(topic, context = {}) {
    const reflection = {
      id: Date.now().toString(36),
      topic,
      context,
      timestamp: new Date().toISOString(),
      insights: [],
      questions: []
    };
    
    // 根据主题检索相关记忆
    const related = await this.recallMemory(topic);
    
    // 生成反思问题
    if (related.experiences.length > 0) {
      const successRate = related.experiences.filter(e => e.success).length / related.experiences.length;
      reflection.questions.push(`历史成功率 ${Math.round(successRate * 100)}%，如何提升？`);
    }
    
    if (related.lessons.length > 0) {
      reflection.questions.push('有哪些教训可以应用到当前？');
    }
    
    this.memory.reflections.push(reflection);
    await this.saveMemory();
    
    return reflection;
  }

  // ========== 决策记录 ==========

  /**
   * 记录重要决策
   */
  async recordDecision(decision) {
    const record = {
      id: Date.now().toString(36),
      ...decision,
      timestamp: new Date().toISOString()
    };
    
    this.memory.decisions.push(record);
    
    // 保持最近 100 条决策
    if (this.memory.decisions.length > 100) {
      this.memory.decisions = this.memory.decisions.slice(-100);
    }
    
    await this.saveMemory();
    return record;
  }

  // ========== 从经验中学习 ==========

  /**
   * 从经验中提取教训
   */
  learnFromExperience() {
    const failures = this.memory.experiences.filter(e => !e.success);
    const lessons = [];
    
    const typeGroups = {};
    failures.forEach(f => {
      if (!typeGroups[f.type]) typeGroups[f.type] = [];
      typeGroups[f.type].push(f);
    });
    
    for (const [type, items] of Object.entries(typeGroups)) {
      if (items.length >= 2) {
        lessons.push({
          type,
          count: items.length,
          lastFailure: items[items.length - 1].timestamp,
          lesson: `此类型任务失败 ${items.length} 次，需改进策略`
        });
      }
    }
    
    return lessons;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const total = this.memory.experiences.length;
    const success = this.memory.experiences.filter(e => e.success).length;
    
    return {
      totalTasks: total,
      successRate: total > 0 ? success / total : 0,
      reflectionCount: this.memory.reflections.length,
      lessonCount: this.memory.lessons.length,
      lastReflection: this.memory.reflections[this.memory.reflections.length - 1]?.timestamp,
      topFailureTypes: this.learnFromExperience().slice(0, 3)
    };
  }
}

module.exports = SoulFlowBridgeV2;
