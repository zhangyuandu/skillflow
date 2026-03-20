/**
 * SkillFlow - OpenClaw 集成实现
 * 
 * 这个文件是 SkillFlow 的核心实现，提供：
 * 1. plan() - 任务规划
 * 2. execute_step() - 步骤执行
 * 3. run() - 完整编排执行
 */

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
  
  try {
    // 准备输入
    const inputs = prepareInputs(step, context);
    
    // 执行（这里返回模拟结果，实际会调用技能）
    const result = await invokeSkill(step.skill_hint || step.action, inputs);
    
    return {
      success: true,
      output: result,
      stepId: step.id,
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stepId: step.id,
      duration: Date.now() - startTime
    };
  }
}

/**
 * 完整执行 - 从任务到结果
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

// ============================================================================
// 内部函数
// ============================================================================

/**
 * 发现可用技能
 */
async function discoverSkills() {
  // 实际实现会扫描 ~/.openclaw/skills 和 ~/.openclaw/workspace/skills
  // 这里返回一个基于常见技能的映射
  
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
 * 匹配技能
 */
function matchSkills(intent, skills) {
  const matched = [];
  
  for (const [name, skill] of Object.entries(skills)) {
    // 检查动作匹配
    const actionMatch = intent.actions.some(action => 
      skill.capabilities.some(cap => 
        cap.toLowerCase().includes(action.toLowerCase()) ||
        action.toLowerCase().includes(cap.toLowerCase())
      )
    );
    
    // 检查对象匹配
    const objectMatch = intent.objects.some(obj =>
      skill.capabilities.some(cap =>
        cap.toLowerCase().includes(obj.toLowerCase()) ||
        obj.toLowerCase().includes(cap.toLowerCase())
      )
    );
    
    if (actionMatch || objectMatch) {
      matched.push(skill);
    }
  }
  
  return matched;
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
  discoverSkills,
  analyzeIntent,
  matchSkills,
  generatePlan
};
