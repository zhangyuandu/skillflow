/**
 * SkillFlow - OpenClaw 集成实现
 * 
 * 这个文件是 SkillFlow 的核心实现，提供：
 * 1. plan() - 任务规划
 * 2. execute_step() - 步骤执行
 * 3. run() - 完整编排执行
 */

const fs = require('fs');
const path = require('path');

// 导入并行执行器
let ParallelExecutor;
try {
  ParallelExecutor = require('./parallel').ParallelExecutor;
} catch (e) {
  console.warn('ParallelExecutor 加载失败:', e.message);
}

// 导入 SoulFlow Bridge 集成
let soulflow;
try {
  soulflow = require('./skillflow-integration');
} catch (e) {
  console.warn('SoulFlow Integration 加载失败:', e.message);
  soulflow = null;
}

// ============================================================================
// 核心 API
// ============================================================================

/**
 * 任务规划 - 分析任务并生成执行计划
 * 
 * @param {string} task - 用户任务描述
 * @param {object} context - 执行上下文
 * @returns {Promise<object>} 执行计划
 */
async function plan(task, context = {}) {
  // 0. 决策过滤器（记忆驱动）
  let decision = null;
  if (soulflow) {
    decision = await soulflow.decideStrategy(task, context);
    context.decision = decision;
    
    // 如果需要检索记忆
    if (decision.needsMemoryRecall) {
      const memory = await soulflow.recallMemory(task);
      context.relevantMemory = memory;
    }
  }
  
  // 1. 发现可用技能
  const skills = await discoverSkills();
  
  // 2. 分析任务意图
  const intent = analyzeIntent(task);
  
  // 3. 匹配相关技能
  const matchedSkills = matchSkills(intent, skills);
  
  // 4. 生成执行计划
  const plan = generatePlan(intent, matchedSkills);
  
  return {
    task,
    intent,
    skills: matchedSkills.map(s => s.name),
    plan,
    decision,
    context
  };
}

/**
 * 执行步骤 - 执行单个步骤
 * 
 * @param {object} step - 步骤对象
 * @param {object} context - 执行上下文
 * @returns {Promise<object>} 执行结果
 */
async function execute_step(step, context = {}) {
  const startTime = Date.now();
  
  // 执行前注入上下文
  if (soulflow) {
    step = await soulflow.injectContext(step);
  }
  
  try {
    // 准备输入
    const inputs = prepareInputs(step, context);
    
    // 执行（这里返回模拟结果，实际会调用技能）
    const result = await invokeSkill(step.skill_hint || step.action, inputs);
    
    const duration = Date.now() - startTime;
    
    // 执行后记录经验
    if (soulflow) {
      await soulflow.recordExperience(step, {
        success: true,
        output: result,
        duration
      });
    }
    
    return {
      success: true,
      output: result,
      stepId: step.id,
      duration,
      soulContext: step.soulContext
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // 记录失败经验
    if (soulflow) {
      await soulflow.recordExperience(step, {
        success: false,
        error: error.message,
        duration
      });
    }
    
    return {
      success: false,
      error: error.message,
      stepId: step.id,
      duration,
      soulContext: step.soulContext
    };
  }
}

/**
 * 完整执行 - 从任务到结果（顺序执行）
 * 
 * @param {string} task - 用户任务描述
 * @param {object} context - 执行上下文
 * @returns {Promise<object>} 执行结果
 */
async function run(task, context = {}) {
  // 1. 规划
  const planResult = await plan(task, context);
  
  // 2. 执行所有步骤
  const executionContext = {
    ...context,
    completed_steps: {},
    history: []
  };
  
  for (const step of planResult.plan) {
    const result = await execute_step(step, executionContext);
    
    executionContext.completed_steps[step.id] = result;
    executionContext.history.push({
      stepId: step.id,
      action: step.action,
      success: result.success,
      timestamp: new Date().toISOString()
    });
    
    if (!result.success && !step.optional) {
      return {
        success: false,
        error: `Step ${step.id} failed: ${result.error}`,
        plan: planResult,
        execution: executionContext
      };
    }
  }
  
  // 3. 返回最终结果
  return {
    success: true,
    task,
    plan: planResult,
    execution: executionContext,
    result: getFinalOutput(executionContext)
  };
}

/**
 * 并行执行 - 自动检测并并行执行独立步骤
 * 
 * @param {string} task - 用户任务描述
 * @param {object} options - 执行选项
 * @returns {Promise<object>} 执行结果
 */
async function runParallel(task, options = {}) {
  if (!ParallelExecutor) {
    console.warn('ParallelExecutor 不可用，回退到顺序执行');
    return run(task, options);
  }
  
  // 1. 规划
  const planResult = await plan(task, options);
  
  if (planResult.plan.length === 0) {
    return {
      success: true,
      task,
      plan: planResult,
      result: null,
      message: '没有生成执行步骤'
    };
  }
  
  // 2. 创建并行执行器
  const executor = new ParallelExecutor({
    maxConcurrency: options.maxConcurrency || 5,
    timeout: options.timeout || 60000
  });
  
  // 3. 注册技能
  const skills = await discoverSkills();
  for (const [name, skill] of Object.entries(skills)) {
    executor.registerSkill(name, {
      async execute(inputs) {
        return invokeSkill(name, inputs);
      }
    });
  }
  
  // 4. 执行计划
  const result = await executor.executePlan(planResult.plan, options);
  
  return {
    success: result.success,
    task,
    plan: planResult,
    completed: result.completed_steps,
    failed: result.failed_steps,
    history: result.history,
    stats: result.stats,
    result: getFinalOutput({ completed_steps: result.completed_steps })
  };
}

// ============================================================================
// 内部函数
// ============================================================================

/**
 * 发现可用技能
 * @returns {Promise<object>} 技能映射
 */
async function discoverSkills() {
  // 尝试从 discovery.js 获取实际技能
  try {
    const discoveryPath = path.join(__dirname, '..', 'scripts', 'discovery.js');
    const cachePath = path.join(process.env.HOME, '.openclaw', 'cache', 'skillflow-registry.json');
    
    // 如果缓存存在且未过期，直接使用
    if (fs.existsSync(cachePath)) {
      const cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      if (cache.skills) {
        return cache.skills;
      }
    }
    
    // 否则运行 discovery.js
    if (fs.existsSync(discoveryPath)) {
      const { execSync } = require('child_process');
      const output = execSync(`node ${discoveryPath}`, { encoding: 'utf-8' });
      const registry = JSON.parse(output.split('\n').pop());
      if (registry.skills) {
        return registry.skills;
      }
    }
  } catch (error) {
    // 如果失败，回退到内置技能
    console.warn('技能发现失败，使用内置技能:', error.message);
  }
  
  // 内置回退技能
  return {
    'tavily-search': {
      name: 'tavily-search',
      capabilities: ['search', '查找', '搜索', 'web_lookup'],
      description: 'Web search via Tavily API'
    },
    'summarize': {
      name: 'summarize',
      capabilities: ['summarize', '总结', '摘要', 'extract'],
      description: 'Summarize URLs or files'
    },
    'feishu-doc': {
      name: 'feishu-doc',
      capabilities: ['create_doc', 'write_content', '保存', '飞书文档'],
      description: 'Feishu document operations'
    },
    'tencent-docs': {
      name: 'tencent-docs',
      capabilities: ['create_doc', 'write_content', '腾讯文档'],
      description: 'Tencent Docs operations'
    },
    'agent-browser': {
      name: 'agent-browser',
      capabilities: ['browse', 'browse', 'navigate', 'click', '访问网页'],
      description: 'Browser automation'
    },
    'exec': {
      name: 'exec',
      capabilities: ['execute', 'run', '执行命令', 'shell'],
      description: 'Shell command execution'
    }
  };
}

/**
 * 分析任务意图
 */
function analyzeIntent(task) {
  const intent = {
    actions: [],
    objects: [],
    modifiers: [],
    originalTask: task
  };
  
  // 动作识别
  const actionPatterns = [
    { pattern: /搜索|查找|search/i, action: 'search' },
    { pattern: /总结|摘要|summarize/i, action: 'summarize' },
    { pattern: /保存|写入|save|write/i, action: 'save' },
    { pattern: /创建|新建|create/i, action: 'create' },
    { pattern: /编辑|修改|edit|update/i, action: 'edit' },
    { pattern: /翻译|translate/i, action: 'translate' },
    { pattern: /分析|analyze/i, action: 'analyze' },
    { pattern: /发送|发送|send/i, action: 'send' }
  ];
  
  for (const { pattern, action } of actionPatterns) {
    if (pattern.test(task)) {
      intent.actions.push(action);
    }
  }
  
  // 对象识别
  const objectPatterns = [
    { pattern: /文档|doc|document/i, object: 'document' },
    { pattern: /文章|article/i, object: 'article' },
    { pattern: /文件|file/i, object: 'file' },
    { pattern: /报告|report/i, object: 'report' },
    { pattern: /邮件|email/i, object: 'email' },
    { pattern: /飞书|feishu/i, object: 'feishu' },
    { pattern: /腾讯文档|tencent.*doc/i, object: 'tencent-docs' }
  ];
  
  for (const { pattern, object } of objectPatterns) {
    if (pattern.test(task)) {
      intent.objects.push(object);
    }
  }
  
  return intent;
}

/**
 * 匹配技能 - 优化版本
 */
function matchSkills(intent, skills) {
  const matched = [];
  const scores = new Map();
  
  for (const [name, skill] of Object.entries(skills)) {
    let score = 0;
    
    // 检查动作匹配（高权重）
    for (const action of intent.actions) {
      for (const cap of skill.capabilities || []) {
        if (cap.toLowerCase().includes(action.toLowerCase()) ||
            action.toLowerCase().includes(cap.toLowerCase())) {
          score += 10;
          break;
        }
      }
    }
    
    // 检查对象匹配（中权重）
    for (const obj of intent.objects) {
      for (const cap of skill.capabilities || []) {
        if (cap.toLowerCase().includes(obj.toLowerCase()) ||
            obj.toLowerCase().includes(cap.toLowerCase())) {
          score += 5;
          break;
        }
      }
    }
    
    // 检查描述关键词匹配（低权重）
    const desc = (skill.description || '').toLowerCase();
    for (const action of intent.actions) {
      if (desc.includes(action)) {
        score += 2;
      }
    }
    
    if (score > 0) {
      scores.set(name, score);
      matched.push({ ...skill, score });
    }
  }
  
  // 按分数排序，返回前5个最相关的
  matched.sort((a, b) => b.score - a.score);
  return matched.slice(0, 5).map(s => {
    delete s.score;
    return s;
  });
}

/**
 * 生成执行计划
 */
function generatePlan(intent, skills) {
  const steps = [];
  let stepId = 1;
  let lastStepId = null;
  
  // 根据动作生成步骤
  for (const action of intent.actions) {
    const skill = findSkillForAction(action, skills);
    
    if (skill) {
      const step = {
        id: `step_${stepId++}`,
        action,
        skill_hint: skill.name,
        inputs: {},
        description: `${action} (${skill.name})`
      };
      
      if (lastStepId) {
        step.depends_on = [lastStepId];
      }
      
      steps.push(step);
      lastStepId = step.id;
    }
  }
  
  return steps;
}

/**
 * 查找动作对应的技能
 */
function findSkillForAction(action, skills) {
  const actionSkillMap = {
    'search': 'tavily-search',
    'summarize': 'summarize',
    'save': 'feishu-doc',
    'create': 'feishu-doc',
    'edit': 'feishu-doc',
    'translate': null,  // 内置能力
    'analyze': 'summarize',
    'send': null
  };
  
  const preferredSkill = actionSkillMap[action];
  
  if (preferredSkill) {
    return skills.find(s => s.name === preferredSkill);
  }
  
  // 回退：查找能力匹配的技能
  return skills.find(s => 
    s.capabilities.some(cap => cap.toLowerCase().includes(action.toLowerCase()))
  );
}

/**
 * 准备输入
 */
function prepareInputs(step, context) {
  const inputs = { ...step.inputs };
  
  // 合并依赖输出
  if (step.depends_on && context.completed_steps) {
    for (const depId of step.depends_on) {
      const depResult = context.completed_steps[depId];
      if (depResult?.output) {
        inputs[`from_${depId}`] = depResult.output;
      }
    }
  }
  
  return inputs;
}

/**
 * 调用技能（占位实现）
 */
async function invokeSkill(skillName, inputs) {
  // 实际实现会调用 OpenClaw 的技能执行机制
  // 这里返回模拟结果
  
  return {
    skill: skillName,
    inputs,
    output: `[${skillName} executed]`,
    timestamp: new Date().toISOString()
  };
}

/**
 * 获取最终输出
 */
function getFinalOutput(context) {
  const stepIds = Object.keys(context.completed_steps);
  if (stepIds.length === 0) return null;
  
  const lastStepId = stepIds[stepIds.length - 1];
  return context.completed_steps[lastStepId]?.output;
}

// ============================================================================
// 导出
// ============================================================================

module.exports = {
  plan,
  execute_step,
  run,
  runParallel,
  discoverSkills,
  analyzeIntent,
  matchSkills,
  generatePlan,
  ParallelExecutor,
  // SoulFlow Bridge 集成
  soulflow: {
    decideStrategy: () => soulflow?.decideStrategy(),
    recallMemory: (query, type) => soulflow?.recallMemory(query, type),
    reflect: (topic, ctx) => soulflow?.reflect(topic, ctx),
    getStats: () => soulflow?.getMemoryStats()
  }
};
