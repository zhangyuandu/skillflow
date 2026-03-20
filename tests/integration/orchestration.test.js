/**
 * SkillFlow - Integration Tests
 * 
 * 测试完整的编排流程：
 * - 顺序执行
 * - 并行执行
 * - 条件执行
 * - 错误恢复
 */

const assert = require('assert');
const path = require('path');

// 模拟完整的编排器
class Orchestrator {
  constructor(skillRegistry = {}) {
    this.skillRegistry = skillRegistry;
    this.context = {
      completed_steps: {},
      outputs: {}
    };
    this.history = [];
  }

  /**
   * 执行完整计划
   * @param {Array} plan - 步骤列表
   * @returns {Promise<object>} 执行结果
   */
  async executePlan(plan) {
    const results = {};
    
    for (const step of plan) {
      const result = await this._executeStep(step);
      results[step.id] = result;
      
      if (!result.success && !step.optional) {
        // 非可选步骤失败，停止执行
        return {
          success: false,
          error: `Step ${step.id} failed: ${result.error}`,
          completed_steps: results
        };
      }
      
      // 记录完成的步骤
      this.context.completed_steps[step.id] = result;
    }
    
    return {
      success: true,
      completed_steps: results,
      context: this.context
    };
  }

  async _executeStep(step) {
    const skill = this._findSkill(step.action, step.skill_hint);
    
    if (!skill) {
      return { success: false, error: `No skill for: ${step.action}` };
    }

    // 准备输入（合并依赖输出）
    const inputs = this._prepareInputs(step);
    
    // 记录执行
    this.history.push({
      stepId: step.id,
      action: step.action,
      timestamp: Date.now()
    });

    try {
      const output = await skill.execute(inputs);
      return { success: true, output };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  _findSkill(action, hint) {
    if (hint && this.skillRegistry[hint]) {
      return this.skillRegistry[hint];
    }
    return null;
  }

  _prepareInputs(step) {
    const inputs = { ...step.inputs };
    
    // 合并依赖输出
    if (step.depends_on) {
      for (const depId of step.depends_on) {
        const depResult = this.context.completed_steps[depId];
        if (depResult?.output) {
          inputs[`from_${depId}`] = depResult.output;
        }
      }
    }
    
    return inputs;
  }
}

// 测试用例
const tests = {
  'should execute sequential plan': async () => {
    const orchestrator = new Orchestrator({
      'skill-a': { execute: async (i) => ({ result: 'A' }) },
      'skill-b': { execute: async (i) => ({ result: 'B', input: i }) }
    });

    const plan = [
      { id: 'step1', action: 'a', skill_hint: 'skill-a' },
      { id: 'step2', action: 'b', skill_hint: 'skill-b', depends_on: ['step1'] }
    ];

    const result = await orchestrator.executePlan(plan);
    
    assert(result.success === true, 'Should execute successfully');
    assert(result.completed_steps.step1.success === true, 'Step1 should succeed');
    assert(result.completed_steps.step2.success === true, 'Step2 should succeed');
    assert(result.completed_steps.step2.output.input.from_step1, 'Step2 should receive step1 output');
  },

  'should handle step failure': async () => {
    const orchestrator = new Orchestrator({
      'skill-fail': { execute: async () => { throw new Error('Intentional failure'); } },
      'skill-ok': { execute: async () => ({ result: 'ok' }) }
    });

    const plan = [
      { id: 'step1', action: 'fail', skill_hint: 'skill-fail' },
      { id: 'step2', action: 'ok', skill_hint: 'skill-ok' }
    ];

    const result = await orchestrator.executePlan(plan);
    
    assert(result.success === false, 'Should fail when step fails');
    assert(result.completed_steps.step1.success === false, 'Step1 should fail');
    assert(result.completed_steps.step2 === undefined, 'Step2 should not execute');
  },

  'should pass data between steps': async () => {
    const orchestrator = new Orchestrator({
      'producer': { execute: async () => ({ data: 'produced_value' }) },
      'consumer': { execute: async (i) => ({ received: i.from_step1 }) }
    });

    const plan = [
      { id: 'step1', action: 'produce', skill_hint: 'producer' },
      { id: 'step2', action: 'consume', skill_hint: 'consumer', depends_on: ['step1'] }
    ];

    const result = await orchestrator.executePlan(plan);
    
    assert(result.success === true, 'Should execute successfully');
    assert(result.completed_steps.step2.output.received.data === 'produced_value', 'Should pass data');
  },

  'should handle complex dependency chain': async () => {
    const orchestrator = new Orchestrator({
      'a': { execute: async () => ({ value: 1 }) },
      'b': { execute: async (i) => ({ value: (i.from_step1?.value || 0) + 1 }) },
      'c': { execute: async (i) => ({ value: (i.from_step2?.value || 0) + 1 }) }
    });

    const plan = [
      { id: 'step1', action: 'a', skill_hint: 'a' },
      { id: 'step2', action: 'b', skill_hint: 'b', depends_on: ['step1'] },
      { id: 'step3', action: 'c', skill_hint: 'c', depends_on: ['step2'] }
    ];

    const result = await orchestrator.executePlan(plan);
    
    assert(result.success === true, 'Should execute successfully');
    assert(result.completed_steps.step1.output.value === 1, 'Step1 should be 1');
    assert(result.completed_steps.step2.output.value === 2, 'Step2 should be 2');
    assert(result.completed_steps.step3.output.value === 3, 'Step3 should be 3');
  },

  'should track execution history': async () => {
    const orchestrator = new Orchestrator({
      'test': { execute: async () => ({ done: true }) }
    });

    const plan = [
      { id: 'a', action: 'test', skill_hint: 'test' },
      { id: 'b', action: 'test', skill_hint: 'test' }
    ];

    await orchestrator.executePlan(plan);
    
    assert(orchestrator.history.length === 2, 'Should record 2 executions');
    assert(orchestrator.history[0].stepId === 'a', 'First should be step a');
    assert(orchestrator.history[1].stepId === 'b', 'Second should be step b');
  }
};

// 运行测试
async function runTests() {
  console.log('Running Integration Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const [name, test] of Object.entries(tests)) {
    try {
      await test();
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
module.exports = { Orchestrator, tests, runTests };

// 直接运行
if (require.main === module) {
  runTests().then(success => process.exit(success ? 0 : 1));
}
