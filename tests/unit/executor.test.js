/**
 * SkillFlow - Executor Unit Tests
 * 
 * 测试执行器的核心功能：
 * - 步骤执行
 * - 结果处理
 * - 错误处理
 * - 重试机制
 */

const assert = require('assert');

// 模拟执行器
class Executor {
  constructor(skillRegistry = {}) {
    this.skillRegistry = skillRegistry;
    this.executionHistory = [];
  }

  /**
   * 执行单个步骤
   * @param {object} step - 步骤对象
   * @param {object} context - 执行上下文
   * @returns {Promise<object>} 执行结果
   */
  async executeStep(step, context = {}) {
    const startTime = Date.now();
    
    // 记录执行历史
    this.executionHistory.push({
      stepId: step.id,
      action: step.action,
      startTime
    });

    // 检查依赖是否满足
    if (step.depends_on && step.depends_on.length > 0) {
      const missingDeps = step.depends_on.filter(depId => {
        return !context.completed_steps || !context.completed_steps[depId];
      });
      
      if (missingDeps.length > 0) {
        return {
          success: false,
          error: `Missing dependencies: ${missingDeps.join(', ')}`,
          stepId: step.id
        };
      }
    }

    // 查找技能
    const skill = this._findSkill(step.action, step.skill_hint);
    
    if (!skill) {
      return {
        success: false,
        error: `No skill found for action: ${step.action}`,
        stepId: step.id
      };
    }

    // 准备输入
    const inputs = this._prepareInputs(step, context);

    // 执行（带超时）
    try {
      const result = await this._executeWithTimeout(
        () => skill.execute(inputs),
        step.timeout || 30000
      );
      
      return {
        success: true,
        output: result,
        stepId: step.id,
        duration: Date.now() - startTime
      };
    } catch (error) {
      // 错误处理
      return {
        success: false,
        error: error.message,
        stepId: step.id,
        duration: Date.now() - startTime
      };
    }
  }

  _findSkill(action, skillHint) {
    // 优先使用 skill_hint
    if (skillHint && this.skillRegistry[skillHint]) {
      return this.skillRegistry[skillHint];
    }
    
    // 否则查找支持该动作的技能
    for (const [name, skill] of Object.entries(this.skillRegistry)) {
      if (skill.capabilities && skill.capabilities.includes(action)) {
        return skill;
      }
    }
    
    return null;
  }

  _prepareInputs(step, context) {
    const inputs = { ...step.inputs };
    
    // 从依赖步骤获取输出
    if (step.depends_on && context.completed_steps) {
      for (const depId of step.depends_on) {
        const depResult = context.completed_steps[depId];
        if (depResult && depResult.output) {
          // 合并依赖输出到输入
          Object.assign(inputs, { [`from_${depId}`]: depResult.output });
        }
      }
    }
    
    return inputs;
  }

  _executeWithTimeout(fn, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Execution timeout after ${timeout}ms`));
      }, timeout);
      
      Promise.resolve(fn())
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  getHistory() {
    return this.executionHistory;
  }
}

// 测试用例
const tests = {
  'should execute step successfully': async () => {
    const executor = new Executor({
      'mock-skill': {
        capabilities: ['test'],
        execute: async (inputs) => ({ result: 'success', data: inputs })
      }
    });

    const result = await executor.executeStep({
      id: 'step1',
      action: 'test',
      inputs: { foo: 'bar' }
    });

    assert(result.success === true, 'Should execute successfully');
    assert(result.output.result === 'success', 'Should return correct result');
  },

  'should handle missing skill': async () => {
    const executor = new Executor({});

    const result = await executor.executeStep({
      id: 'step1',
      action: 'nonexistent'
    });

    assert(result.success === false, 'Should fail for missing skill');
    assert(result.error.includes('No skill found'), 'Should indicate missing skill');
  },

  'should handle step timeout': async () => {
    const executor = new Executor({
      'slow-skill': {
        capabilities: ['slow'],
        execute: async (inputs) => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return { done: true };
        }
      }
    });

    const result = await executor.executeStep({
      id: 'step1',
      action: 'slow',
      timeout: 100 // 100ms 超时
    });

    assert(result.success === false, 'Should fail on timeout');
    assert(result.error.includes('timeout'), 'Should indicate timeout');
  },

  'should pass dependencies to step': async () => {
    const executor = new Executor({
      'pass-skill': {
        capabilities: ['pass'],
        execute: async (inputs) => inputs
      }
    });

    const result = await executor.executeStep({
      id: 'step2',
      action: 'pass',
      depends_on: ['step1']
    }, {
      completed_steps: {
        step1: { output: { from_step1: 'data' } }
      }
    });

    assert(result.success === true, 'Should execute with dependencies');
    // 依赖数据会被添加为 from_step1 属性
    assert(result.output.from_step1 !== undefined, 'Should pass dependency data');
  },

  'should record execution history': async () => {
    const executor = new Executor({
      'test-skill': {
        capabilities: ['test'],
        execute: async () => ({ done: true })
      }
    });

    await executor.executeStep({ id: 'step1', action: 'test' });
    
    const history = executor.getHistory();
    
    assert(history.length === 1, 'Should record one execution');
    assert(history[0].stepId === 'step1', 'Should record correct step ID');
  },

  'should handle skill execution error': async () => {
    const executor = new Executor({
      'error-skill': {
        capabilities: ['error'],
        execute: async () => {
          throw new Error('Skill execution failed');
        }
      }
    });

    const result = await executor.executeStep({
      id: 'step1',
      action: 'error'
    });

    assert(result.success === false, 'Should handle execution error');
    assert(result.error === 'Skill execution failed', 'Should pass error message');
  }
};

// 运行测试
async function runTests() {
  console.log('Running Executor Tests...\n');
  
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
module.exports = { Executor, tests, runTests };

// 直接运行
if (require.main === module) {
  runTests().then(success => process.exit(success ? 0 : 1));
}
