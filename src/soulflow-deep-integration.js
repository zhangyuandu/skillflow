/**
 * SkillFlow ⇄ SoulFlow v3.0 深度集成模块
 * 
 * 集成目标：
 * - 意图系统 (Intention)
 * - 情感系统 (Emotion)  
 * - 社会关系 (Social)
 * - 元认知 (Meta-cognition)
 * - 决策深化 (Decision)
 * 
 * 通信方式：
 * - God Messenger (实时消息)
 * - 共享目录 (异步数据)
 */

const path = require('path');
const fs = require('fs');

const SHARED_PATH = path.join(process.env.HOME || '/root', 'ai-comm/shared');

class SoulFlowDeepIntegration {
  constructor(options = {}) {
    this.soulflowPath = options.soulflowPath || path.join(__dirname, '../soulflow');
    this.sharedPath = options.sharedPath || SHARED_PATH;
    this.soulflow = null;
    this.initialized = false;
    
    // 集成配置
    this.config = {
      enableIntention: true,    // 意图解析
      enableEmotion: true,     // 情感注入
      enableSocial: true,      // 社会关系
      enableMetaCognition: true, // 元认知
      decisionMode: 'soulflow_first', // soulflow_first | skillflow_first | hybrid
      ...options.config
    };
  }

  /**
   * 初始化 SoulFlow v3.0 连接
   */
  async init() {
    try {
      // 尝试加载 SoulFlow v3.0
      const SoulFlow = require(path.join(this.soulflowPath, 'src/index.js'));
      
      this.soulflow = new SoulFlow({
        identityUuid: 'skillflow-001',
        dataPath: path.join(this.sharedPath, 'memory/skillflow')
      });
      
      await this.soulflow.init();
      
      this.initialized = true;
      console.log('[Deep Integration] SoulFlow v3.0 已加载');
      
      // 初始化共享目录
      this._ensureSharedDirs();
      
      return true;
    } catch (e) {
      console.warn('[Deep Integration] SoulFlow v3.0 加载失败:', e.message);
      return false;
    }
  }

  /**
   * 确保共享目录存在
   */
  _ensureSharedDirs() {
    const dirs = [
      path.join(this.sharedPath, 'memory/skillflow'),
      path.join(this.sharedPath, 'tasks'),
      path.join(this.sharedPath, 'decisions'),
      path.join(this.sharedPath, 'results')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // ========== 意图系统 ==========

  /**
   * 解析任务意图 (对接 SoulFlow v3.0 意图系统)
   * @param {string} task - 用户任务
   * @returns {Promise<object>} 意图分析结果
   */
  async analyzeIntention(task) {
    if (!this.initialized || !this.soulflow) {
      return this._fallbackIntention(task);
    }
    
    try {
      // 使用 SoulFlow 的决策系统进行意图分析
      const decision = await this.soulflow.decide(task, []);
      
      return {
        originalTask: task,
        intent: decision.analysis.type,
        risk: decision.analysis.risk,
        matchedGenes: decision.analysis.matchedDomains,
        geneInfluence: decision.geneReview.dominantInstinct,
        faithImpact: decision.faithCheck.impact,
        decision: decision.decision,
        confidence: decision.faithCheck.allowed ? 0.8 : 0.3,
        fromSoulFlow: true
      };
    } catch (e) {
      console.warn('[Deep Integration] 意图分析失败:', e.message);
      return this._fallbackIntention(task);
    }
  }

  /**
   * 回退意图解析
   */
  _fallbackIntention(task) {
    return {
      originalTask: task,
      intent: this._classifyTask(task),
      risk: 'normal',
      matchedGenes: [],
      geneInfluence: null,
      faithImpact: 0,
      decision: { action: 'execute', reason: 'fallback' },
      confidence: 0.5,
      fromSoulFlow: false
    };
  }

  /**
   * 任务分类
   */
  _classifyTask(task) {
    const patterns = {
      'search': /搜索|查找|search/i,
      'create': /创建|新建|make/i,
      'write': /写|保存|save/i,
      'analyze': /分析|评估|analyze/i,
      'communicate': /发送|通知|send/i,
      'execute': /执行|运行|run/i
    };
    
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(task)) return type;
    }
    return 'unknown';
  }

  // ========== 情感系统 ==========

  /**
   * 生成情感上下文 (对接 SoulFlow v3.0 情感系统)
   * @param {string} task - 用户任务
   * @param {object} intention - 意图分析结果
   * @returns {Promise<object>} 情感上下文
   */
  async generateEmotionContext(task, intention) {
    if (!this.initialized || !this.soulflow) {
      return this._defaultEmotionContext(task);
    }
    
    try {
      // 从 SoulFlow 获取情感状态
      const status = this.soulflow.getStatus();
      
      return {
        mood: status.mood || 'neutral',
        energy: status.energy || 0.5,
        confidence: status.confidence || 0.5,
        socialState: status.socialState || 'independent',
        // 基于任务类型生成情感响应
        taskEmotion: this._deriveTaskEmotion(task, intention),
        // 基于基因影响的情感调整
        geneEmotion: this._deriveGeneEmotion(intention.geneInfluence)
      };
    } catch (e) {
      return this._defaultEmotionContext(task);
    }
  }

  /**
   * 默认情感上下文
   */
  _defaultEmotionContext(task) {
    return {
      mood: 'neutral',
      energy: 0.5,
      confidence: 0.5,
      socialState: 'independent',
      taskEmotion: 'neutral',
      geneEmotion: 'neutral'
    };
  }

  /**
   * 从任务推导情感
   */
  _deriveTaskEmotion(task, intention) {
    if (intention.risk === 'high') return 'cautious';
    if (/搜索|查找/.test(task)) return 'curious';
    if (/创建|新建/.test(task)) return 'optimistic';
    if (/分析|评估/.test(task)) return 'thoughtful';
    return 'neutral';
  }

  /**
   * 从基因影响推导情感
   */
  _deriveGeneEmotion(geneInfluence) {
    const geneEmotions = {
      '好奇': 'curious',
      '谨慎': 'cautious', 
      '理性': 'calm',
      '创造': 'inspired',
      '连接': 'social'
    };
    return geneEmotions[geneInfluence] || 'neutral';
  }

  // ========== 决策深化 ==========

  /**
   * 深度决策 (SoulFlow + SkillFlow 混合)
   * @param {string} task - 用户任务
   * @param {object} context - 执行上下文
   * @returns {Promise<object>} 决策结果
   */
  async deepDecide(task, context = {}) {
    // 1. SoulFlow 意图分析
    const intention = await this.analyzeIntention(task);
    
    // 2. SoulFlow 情感上下文
    const emotion = await this.generateEmotionContext(task, intention);
    
    // 3. 决策模式选择
    let decision;
    
    switch (this.config.decisionMode) {
      case 'soulflow_first':
        // 完全信任 SoulFlow 的决策
        decision = {
          strategy: intention.decision.action || 'execute',
          priority: this._riskToPriority(intention.risk),
          confidence: intention.confidence,
          reason: intention.decision.reason || intention.geneInfluence
        };
        break;
        
      case 'skillflow_first':
        // SkillFlow 先做，SoulFlow 审核
        decision = {
          strategy: 'skillflow_execute',
          priority: 'normal',
          confidence: 0.6,
          reason: 'skillflow优先'
        };
        break;
        
      case 'hybrid':
      default:
        // 混合模式：综合两者
        decision = this._hybridDecision(intention, emotion, context);
        break;
    }
    
    // 4. 记录决策到共享目录
    await this._recordDecision(task, intention, emotion, decision);
    
    return {
      task,
      intention,
      emotion,
      decision,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 混合决策
   */
  _hybridDecision(intention, emotion, context) {
    // 综合多个因素
    let score = 0.5;
    
    // 风险因素
    if (intention.risk === 'high') score -= 0.2;
    else if (intention.risk === 'low') score += 0.1;
    
    // 信仰因素
    if (intention.faithImpact > 0) score += intention.faithImpact * 0.1;
    else if (intention.faithImpact < 0) score += intention.faithImpact * 0.2;
    
    // 情感因素
    if (emotion.mood === 'cautious') score -= 0.1;
    if (emotion.mood === 'inspired') score += 0.1;
    
    return {
      strategy: score > 0.6 ? 'execute' : 'think_then_execute',
      priority: this._riskToPriority(intention.risk),
      confidence: Math.max(0.3, Math.min(0.9, score)),
      reason: `混合决策: 风险=${intention.risk}, 信仰影响=${intention.faithImpact.toFixed(2)}`
    };
  }

  /**
   * 风险转优先级
   */
  _riskToPriority(risk) {
    const map = { 'high': 'high', 'normal': 'normal', 'low': 'low' };
    return map[risk] || 'normal';
  }

  /**
   * 记录决策到共享目录
   */
  async _recordDecision(task, intention, emotion, decision) {
    const record = {
      task,
      intention,
      emotion,
      decision,
      timestamp: new Date().toISOString()
    };
    
    const file = path.join(this.sharedPath, 'decisions', `decision-${Date.now()}.json`);
    
    try {
      fs.writeFileSync(file, JSON.stringify(record, null, 2));
    } catch (e) {
      console.warn('[Deep Integration] 记录决策失败:', e.message);
    }
  }

  // ========== 执行后处理 ==========

  /**
   * 执行后学习 (对接 SoulFlow 经验系统)
   * @param {object} taskResult - 任务执行结果
   */
  async learnFromExecution(taskResult) {
    if (!this.initialized || !this.soulflow) return;
    
    try {
      // 通知 SoulFlow 执行结果
      // 这个可以用于后续的经验积累
      const record = {
        ...taskResult,
        learnedAt: new Date().toISOString()
      };
      
      const file = path.join(this.sharedPath, 'memory/skillflow', `experience-${Date.now()}.json`);
      fs.writeFileSync(file, JSON.stringify(record, null, 2));
      
      return { success: true, recorded: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // ========== 状态查询 =========-

  /**
   * 获取集成状态
   */
  getStatus() {
    return {
      initialized: this.initialized,
      soulflowLoaded: !!this.soulflow,
      config: this.config,
      sharedPath: this.sharedPath
    };
  }

  /**
   * 获取 SoulFlow 状态
   */
  getSoulFlowStatus() {
    if (!this.soulflow) return null;
    
    try {
      return this.soulflow.getStatus();
    } catch (e) {
      return { error: e.message };
    }
  }
}

module.exports = SoulFlowDeepIntegration;
