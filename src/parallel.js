/**
 * SkillFlow - Parallel Executor
 * 
 * 支持并行执行多个独立步骤：
 * - 自动检测无依赖的步骤
 * - 并发执行，提升效率
 * - 结果聚合
 */

// ============================================================================
// Parallel Executor 类
// ============================================================================

class ParallelExecutor {
  constructor(options = {}) {
    this.maxConcurrency = options.maxConcurrency || 5;
    this.timeout = options.timeout || 60000;
    this.skillRegistry = options.skillRegistry || {};
    this.results = new Map();
    this.errors = new Map();
  }

  /**
   * 注册技能
   */
  registerSkill(name, skill) {
    this.skillRegistry[name] = skill;
  }

  /**
   * 执行计划（自动并行化）
   * @param {Array} steps - 步骤列表
   * @param {object} context - 执行上下文
   * @returns {Promise<object>} 执行结果
   */
  async executePlan(steps, context = {}) {
    const startTime = Date.now();
    const executionContext = {
      ...context,
      completed_steps: {},
      failed_steps: {},
      history: []
    };

    // 构建依赖图
    const graph = this._buildDependencyGraph(steps);
    
    // 按层级执行
    while (graph.pending.size > 0) {
      // 找出所有可执行的步骤（依赖已满足）
      const executable = this._findExecutableSteps(graph, steps);
      
      if (executable.length === 0) {
        // 检查是否有死锁
        if (graph.pending.size > 0) {
          return {
            success: false,
            error: 'Deadlock detected: circular dependencies',
            completed: executionContext.completed_steps,
            pending: Array.from(graph.pending)
          };
        }
        break;
      }

      // 并行执行可执行步骤
      const batchResults = await this._executeBatch(executable, steps, executionContext);
      
      // 更新状态
      for (const [stepId, result] of Object.entries(batchResults)) {
        if (result.success) {
          executionContext.completed_steps[stepId] = result;
          graph.completed.add(stepId);
        } else {
          executionContext.failed_steps[stepId] = result;
          graph.failed.add(stepId);
          
          // 检查是否有步骤依赖这个失败的步骤
          const dependents = this._findDependentSteps(stepId, graph);
          if (dependents.length > 0) {
            // 标记依赖步骤为失败
            for (const depStepId of dependents) {
              graph.failed.add(depStepId);
              graph.pending.delete(depStepId);
              executionContext.failed_steps[depStepId] = {
                success: false,
                error: `Dependency ${stepId} failed`,
                stepId: depStepId
              };
            }
          }
        }
        graph.pending.delete(stepId);
        
        // 记录历史
        const step = steps.find(s => s.id === stepId);
        executionContext.history.push({
          stepId,
          action: step?.action || stepId,
          success: result.success,
          timestamp: new Date().toISOString()
        });
      }
    }

    const totalDuration = Date.now() - startTime;
    const allSteps = Object.keys(executionContext.completed_steps).length + 
                     Object.keys(executionContext.failed_steps).length;

    return {
      success: Object.keys(executionContext.failed_steps).length === 0,
      completed_steps: executionContext.completed_steps,
      failed_steps: executionContext.failed_steps,
      history: executionContext.history,
      stats: {
        total_steps: allSteps,
        completed: Object.keys(executionContext.completed_steps).length,
        failed: Object.keys(executionContext.failed_steps).length,
        duration: totalDuration,
        parallelism: this.maxConcurrency
      }
    };
  }

  /**
   * 构建依赖图
   */
  _buildDependencyGraph(steps) {
    const graph = {
      pending: new Set(),
      completed: new Set(),
      failed: new Set(),
      dependencies: new Map(),
      dependents: new Map()
    };

    for (const step of steps) {
      graph.pending.add(step.id);
      graph.dependencies.set(step.id, new Set(step.depends_on || []));
      
      // 反向依赖
      if (step.depends_on) {
        for (const depId of step.depends_on) {
          if (!graph.dependents.has(depId)) {
            graph.dependents.set(depId, new Set());
          }
          graph.dependents.get(depId).add(step.id);
        }
      }
    }

    return graph;
  }

  /**
   * 找出可执行的步骤
   */
  _findExecutableSteps(graph, steps) {
    const executable = [];
    
    for (const stepId of graph.pending) {
      // 跳过已失败步骤的依赖
      if (graph.failed.has(stepId)) continue;
      
      const deps = graph.dependencies.get(stepId) || new Set();
      const allDepsMet = Array.from(deps).every(
        depId => graph.completed.has(depId)
      );
      
      if (allDepsMet) {
        executable.push(stepId);
      }
    }
    
    return executable;
  }

  /**
   * 找出依赖指定步骤的所有步骤
   */
  _findDependentSteps(stepId, graph) {
    const dependents = [];
    const visited = new Set();
    
    const collect = (id) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      const deps = graph.dependents.get(id);
      if (deps) {
        for (const depId of deps) {
          if (graph.pending.has(depId)) {
            dependents.push(depId);
            collect(depId);
          }
        }
      }
    };
    
    collect(stepId);
    return dependents;
  }

  /**
   * 并行执行一批步骤
   */
  async _executeBatch(stepIds, steps, context) {
    const results = {};
    const batch = stepIds.slice(0, this.maxConcurrency);
    
    const promises = batch.map(async (stepId) => {
      const step = this._findStep(stepId, steps);
      if (!step) {
        return { stepId, success: false, error: 'Step not found' };
      }
      
      try {
        const result = await this._executeStep(step, context);
        return { stepId, ...result };
      } catch (error) {
        return { stepId, success: false, error: error.message };
      }
    });
    
    const batchResults = await Promise.allSettled(promises);
    
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results[result.value.stepId] = result.value;
      } else {
        console.error('Batch execution error:', result.reason);
      }
    }
    
    return results;
  }

  /**
   * 执行单个步骤
   */
  async _executeStep(step, context) {
    const skill = this._findSkill(step.action, step.skill_hint);
    
    if (!skill) {
      // 如果没有找到技能，返回模拟成功（用于测试）
      return {
        success: true,
        output: { message: `Mock execution for ${step.action}` },
        stepId: step.id
      };
    }
    
    const inputs = this._prepareInputs(step, context);
    
    // 执行并记录结果
    const result = await skill.execute(inputs);
    
    return {
      success: true,
      output: result,
      stepId: step.id
    };
  }

  /**
   * 查找步骤
   */
  _findStep(stepId, steps) {
    return steps.find(s => s.id === stepId);
  }

  /**
   * 查找技能
   */
  _findSkill(action, hint) {
    // 先尝试 skill_hint
    if (hint && this.skillRegistry[hint]) {
      return this.skillRegistry[hint];
    }
    // 再尝试 action 作为名称
    if (action && this.skillRegistry[action]) {
      return this.skillRegistry[action];
    }
    return null;
  }

  /**
   * 准备输入
   */
  _prepareInputs(step, context) {
    const inputs = { ...step.inputs };
    
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
}

// ============================================================================
// 导出
// ============================================================================

module.exports = {
  ParallelExecutor
};
