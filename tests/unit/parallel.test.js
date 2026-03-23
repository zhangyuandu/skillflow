/**
 * SkillFlow - 并行执行测试
 */

const assert = require('assert');
const { ParallelExecutor } = require('../../src/parallel');

// 模拟技能
const mockSkills = {
  search: {
    name: 'search',
    execute: async (inputs) => {
      await new Promise(r => setTimeout(r, 50));
      return { results: ['result1', 'result2'] };
    }
  },
  summarize: {
    name: 'summarize',
    execute: async (inputs) => {
      await new Promise(r => setTimeout(r, 30));
      return { summary: 'Summary of ' + inputs.text };
    }
  },
  save: {
    name: 'save',
    execute: async (inputs) => {
      await new Promise(r => setTimeout(r, 20));
      return { saved: true, path: inputs.path };
    }
  }
};

async function testParallelExecution() {
  console.log('🧪 测试并行执行...');
  
  const executor = new ParallelExecutor({ maxConcurrency: 3 });
  
  // 注册技能
  for (const [name, skill] of Object.entries(mockSkills)) {
    executor.registerSkill(name, skill);
  }
  
  // 测试计划：search 和 summarize 可以并行
  const plan = [
    { id: 'step1', action: 'search', inputs: { query: 'AI news' }, depends_on: [] },
    { id: 'step2', action: 'summarize', inputs: { text: 'article' }, depends_on: [] },
    { id: 'step3', action: 'save', inputs: { path: '/tmp/file.txt' }, depends_on: ['step1', 'step2'] }
  ];
  
  const result = await executor.executePlan(plan);
  
  assert(result.success === true, '执行应该成功');
  assert(result.completed_steps['step1'], 'step1 应该完成');
  assert(result.completed_steps['step2'], 'step2 应该完成');
  assert(result.completed_steps['step3'], 'step3 应该完成');
  
  console.log('✅ 并行执行测试通过');
  console.log('   步骤1结果:', result.completed_steps['step1'].output);
  console.log('   步骤2结果:', result.completed_steps['step2'].output);
  console.log('   步骤3结果:', result.completed_steps['step3'].output);
  console.log('   统计:', result.stats);
  
  return result;
}

async function testDependencyChain() {
  console.log('\n🧪 测试依赖链...');
  
  const executor = new ParallelExecutor({ maxConcurrency: 2 });
  
  let order = [];
  
  executor.registerSkill('taskA', {
    name: 'taskA',
    execute: async (inputs) => {
      order.push('A_start');
      await new Promise(r => setTimeout(r, 30));
      order.push('A_end');
      return { step: 'A' };
    }
  });
  
  executor.registerSkill('taskB', {
    name: 'taskB',
    execute: async (inputs) => {
      order.push('B_start');
      await new Promise(r => setTimeout(r, 20));
      order.push('B_end');
      return { step: 'B' };
    }
  });
  
  executor.registerSkill('taskC', {
    name: 'taskC',
    execute: async (inputs) => {
      order.push('C_start');
      await new Promise(r => setTimeout(r, 10));
      order.push('C_end');
      return { step: 'C' };
    }
  });
  
  const plan = [
    { id: 'stepA', action: 'taskA', inputs: {}, depends_on: [] },
    { id: 'stepB', action: 'taskB', inputs: {}, depends_on: ['stepA'] },
    { id: 'stepC', action: 'taskC', inputs: {}, depends_on: ['stepB'] }
  ];
  
  const result = await executor.executePlan(plan);
  
  assert(result.success === true, '执行应该成功');
  assert(order.indexOf('A_start') < order.indexOf('B_start'), 'A 应该在 B 之前');
  assert(order.indexOf('B_start') < order.indexOf('C_start'), 'B 应该在 C 之前');
  
  console.log('✅ 依赖链测试通过');
  console.log('   执行顺序:', order);
  
  return result;
}

async function testFailurePropagation() {
  console.log('\n🧪 测试失败传播...');
  
  const executor = new ParallelExecutor({ maxConcurrency: 2 });
  
  executor.registerSkill('success', {
    name: 'success',
    execute: async (inputs) => ({ ok: true })
  });
  
  executor.registerSkill('fail', {
    name: 'fail',
    execute: async (inputs) => {
      throw new Error('Task failed intentionally');
    }
  });
  
  const plan = [
    { id: 'step1', action: 'fail', inputs: {}, depends_on: [] },
    { id: 'step2', action: 'success', inputs: {}, depends_on: ['step1'] }
  ];
  
  const result = await executor.executePlan(plan);
  
  // 检查 step1 是否失败
  const step1Result = result.failed_steps['step1'];
  assert(step1Result && step1Result.success === false, 'step1 应该失败');
  assert(result.failed_steps['step2'], 'step2 应该被标记为失败（依赖失败）');
  
  console.log('✅ 失败传播测试通过');
  
  return result;
}

async function testMaxConcurrency() {
  console.log('\n🧪 测试最大并发控制...');
  
  const executor = new ParallelExecutor({ maxConcurrency: 2 });
  let concurrent = 0;
  let maxConcurrent = 0;
  
  for (let i = 1; i <= 4; i++) {
    executor.registerSkill(`task${i}`, {
      name: `task${i}`,
      execute: async (inputs) => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise(r => setTimeout(r, 20));
        concurrent--;
        return { task: i };
      }
    });
  }
  
  const plan = [
    { id: 'step1', action: 'task1', inputs: {}, depends_on: [] },
    { id: 'step2', action: 'task2', inputs: {}, depends_on: [] },
    { id: 'step3', action: 'task3', inputs: {}, depends_on: [] },
    { id: 'step4', action: 'task4', inputs: {}, depends_on: [] }
  ];
  
  const result = await executor.executePlan(plan);
  
  assert(maxConcurrent <= 2, `并发应该 <= 2，实际: ${maxConcurrent}`);
  
  console.log('✅ 并发控制测试通过');
  console.log('   最大并发数:', maxConcurrent);
  
  return result;
}

async function runAllTests() {
  console.log('========================================');
  console.log('🧪 SkillFlow 并行执行测试套件');
  console.log('========================================\n');
  
  try {
    await testParallelExecution();
    await testDependencyChain();
    await testFailurePropagation();
    await testMaxConcurrency();
    
    console.log('\n========================================');
    console.log('✅ 所有测试通过!');
    console.log('========================================');
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

runAllTests();
