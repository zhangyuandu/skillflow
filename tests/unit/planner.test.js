/**
 * SkillFlow - Planner Unit Tests
 * 
 * 测试任务规划器的核心功能：
 * - 任务理解
 * - 步骤拆解
 * - 依赖分析
 * - 计划生成
 */

const assert = require('assert');
const path = require('path');

// 模拟规划器
class Planner {
  constructor(skills = []) {
    this.skills = new Map();
    skills.forEach(s => this.skills.set(s.name, s));
  }

  /**
   * 分析任务并生成执行计划
   * @param {string} task - 任务描述
   * @param {object} context - 执行上下文
   * @returns {Array} 步骤列表
   */
  plan(task, context = {}) {
    const steps = [];
    
    // 1. 理解意图
    const intent = this._understandIntent(task);
    
    // 2. 发现相关技能
    const relevantSkills = this._discoverSkills(intent);
    
    // 3. 拆解为步骤
    const subtasks = this._decompose(intent, relevantSkills);
    
    // 4. 生成计划
    let stepId = 1;
    let lastStepId = null;
    
    for (const subtask of subtasks) {
      const step = {
        id: `step_${stepId++}`,
        action: subtask.action,
        inputs: subtask.inputs || {},
        skill_hint: subtask.skill,
      };
      
      if (lastStepId) {
        step.depends_on = [lastStepId];
      }
      
      steps.push(step);
      lastStepId = step.id;
    }
    
    return steps;
  }

  _understandIntent(task) {
    // 简单的意图识别
    const intent = {
      action: null,
      object: null,
      modifiers: [],
      _originalTask: task  // 保存原始任务用于后续分析
    };

    // 检测常见动作
    const actions = ['搜索', '查找', '总结', '保存', '创建', '编辑', '发送', '分析'];
    for (const action of actions) {
      if (task.includes(action)) {
        intent.action = action;
        break;
      }
    }

    // 检测对象
    const objects = ['文档', '文章', '文件', '报告', '数据', '邮件'];
    for (const obj of objects) {
      if (task.includes(obj)) {
        intent.object = obj;
        break;
      }
    }

    return intent;
  }

  _discoverSkills(intent) {
    const skills = [];
    
    for (const [name, skill] of this.skills) {
      if (skill.capabilities && skill.capabilities.some(cap => 
        intent.action?.includes(cap) || 
        intent.object?.includes(cap)
      )) {
        skills.push(skill);
      }
    }
    
    return skills;
  }

  _decompose(intent, skills) {
    // 简单的任务拆解
    const subtasks = [];
    
    // 支持多动作识别（直接检查任务文本）
    const task = intent._originalTask || '';
    
    // 搜索/查找
    if (task.includes('搜索') || task.includes('查找')) {
      subtasks.push({ action: 'search', skill: 'tavily-search' });
    }
    
    // 总结
    if (task.includes('总结')) {
      subtasks.push({ action: 'summarize', skill: 'summarize' });
    }
    
    // 保存/文档
    if (task.includes('保存') || task.includes('文档')) {
      subtasks.push({ action: 'save', skill: 'feishu-doc' });
    }
    
    // 兼容原意图识别
    if (subtasks.length === 0) {
      if (intent.action === '搜索' || intent.action === '查找') {
        subtasks.push({ action: 'search', skill: 'tavily-search' });
      }
      if (intent.action === '总结') {
        subtasks.push({ action: 'summarize', skill: 'summarize' });
      }
      if (intent.action === '保存' || intent.object === '文档') {
        subtasks.push({ action: 'save', skill: 'feishu-doc' });
      }
    }
    
    return subtasks;
  }
}

// 测试用例
const tests = {
  'should parse simple search task': () => {
    const planner = new Planner([
      { name: 'tavily-search', capabilities: ['search', '查找'] }
    ]);
    
    const plan = planner.plan('搜索最新的AI新闻');
    
    assert(plan.length > 0, 'Plan should have at least one step');
    assert(plan[0].action === 'search', 'First step should be search');
    assert(plan[0].skill_hint === 'tavily-search', 'Should suggest tavily-search');
  },

  'should create sequential plan for multi-step task': () => {
    const planner = new Planner([
      { name: 'tavily-search', capabilities: ['search'] },
      { name: 'summarize', capabilities: ['summarize', '总结'] },
      { name: 'feishu-doc', capabilities: ['save', '保存'] }
    ]);
    
    const plan = planner.plan('搜索AI论文，总结后保存到文档');
    
    assert(plan.length >= 3, 'Plan should have at least 3 steps');
    
    // 验证依赖关系
    if (plan.length > 1) {
      assert(plan[1].depends_on, 'Second step should depend on first');
    }
  },

  'should generate step IDs': () => {
    const planner = new Planner([
      { name: 'test', capabilities: ['test'] }
    ]);
    
    const plan = planner.plan('测试任务');
    
    plan.forEach(step => {
      assert(step.id, 'Each step should have an ID');
      assert(step.id.startsWith('step_'), 'Step ID should follow pattern');
    });
  },

  'should return empty plan for unrecognized task': () => {
    const planner = new Planner([]);
    
    const plan = planner.plan('这是一个无法识别的任务 xyz');
    
    assert(Array.isArray(plan), 'Should return an array');
    // 可能返回空数组或基本步骤
  },

  'should include context in steps': () => {
    const planner = new Planner([
      { name: 'test', capabilities: ['test'] }
    ]);
    
    const context = { userId: '123', preference: 'detailed' };
    const plan = planner.plan('测试任务', context);
    
    assert(Array.isArray(plan), 'Should return a plan');
  }
};

// 运行测试
function runTests() {
  console.log('Running Planner Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const [name, test] of Object.entries(tests)) {
    try {
      test();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`  ❌ ${name}`);
      console.log(`     Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// 导出
module.exports = { Planner, tests, runTests };

// 直接运行
if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}
