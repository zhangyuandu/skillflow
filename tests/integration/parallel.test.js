/**
 * Parallel Executor Tests (Fixed)
 */

const assert = require('assert');
const { ParallelExecutor } = require('../../src/parallel.js');

// 模拟技能
const mockSkills = {
  'skill-a': {
    name: 'skill-a',
    capabilities: ['a'],
    execute: async (inputs) => {
      await new Promise(r => setTimeout(r, 100));
      return { result: 'A', input: inputs };
    }
  },
  'skill-b': {
    name: 'skill-b',
    capabilities: ['b'],
    execute: async (inputs) => {
      await new Promise(r => setTimeout(r, 150));
      return { result: 'B', input: inputs };
    }
  },
  'skill-c': {
    name: 'skill-c',
    capabilities: ['c'],
    execute: async (inputs) => {
      await new Promise(r => setTimeout(r, 50));
      return { result: 'C', input: inputs };
    }
  }
};

const tests = {
  'should handle step failures': async () => {
    const failSkill = {
      'fail-skill': {
        name: 'fail-skill',
        execute: async () => {
          throw new Error('Intentional failure');
        }
      }
    };
    
    const executor = new ParallelExecutor({
      skillRegistry: { ...mockSkills, ...failSkill },
      maxConcurrency: 3
    });
    
    const steps = [
      { id: 'step1', action: 'a', skill_hint: 'skill-a' },
      { id: 'step2', action: 'fail', skill_hint: 'fail-skill' },
      { id: 'step3', action: 'c', skill_hint: 'skill-c' }
    ];
    
    const result = await executor.executePlan(steps);
    
    assert(result.success === false, 'Should fail');
    assert(result.stats.failed > 0, 'Should have failed steps');
    console.log(`    ✅ Failed steps handled correctly`);
  },

  'should mark dependent steps as failed': async () => {
    const failSkill = {
      'fail-skill': {
        name: 'fail-skill',
        execute: async () => {
          throw new Error('Intentional failure');
        }
      }
    };
    
    const executor = new ParallelExecutor({
      skillRegistry: { ...mockSkills, ...failSkill },
      maxConcurrency: 3
    });
    
    const steps = [
      { id: 'step1', action: 'fail', skill_hint: 'fail-skill' },
      { id: 'step2', action: 'a', skill_hint: 'skill-a', depends_on: ['step1'] },
      { id: 'step3', action: 'b', skill_hint: 'skill-b', depends_on: ['step2'] }
    ];
    
    const result = await executor.executePlan(steps);
    
    assert(result.success === false, 'Should fail');
    assert(result.failed_steps['step1'], 'step1 should fail');
    assert(result.failed_steps['step2'], 'step2 should be marked failed');
    assert(result.failed_steps['step3'], 'step3 should be marked failed');
    console.log(`    ✅ Dependent failures propagated correctly`);
  }
};

// 运行测试
async function runTests() {
  console.log('Running Parallel Executor Tests...\n');
  
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

module.exports = { tests, runTests };

if (require.main === module) {
  runTests().then(success => process.exit(success ? 0 : 1));
}
