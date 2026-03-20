/**
 * SkillFlow - Pipeline 执行模式
 * 
 * 支持数据流水线式处理：
 * - 数据流经多个转换阶段
 * - 每个阶段处理后传递给下一阶段
 * - 支持分支和合并
 */

// ============================================================================
// Pipeline 类
// ============================================================================

class Pipeline {
  constructor(name = 'unnamed') {
    this.name = name;
    this.stages = [];
    this.context = {
      data: null,
      metadata: {},
      history: []
    };
  }

  /**
   * 添加处理阶段
   * @param {string} name - 阶段名称
   * @param {function|object} processor - 处理器
   * @returns {Pipeline} this（支持链式调用）
   */
  stage(name, processor) {
    this.stages.push({
      name,
      processor: typeof processor === 'function' ? processor : processor.execute,
      config: typeof processor === 'object' ? processor : {}
    });
    return this;
  }

  /**
   * 添加转换阶段（简写）
   * @param {function} fn - 转换函数
   * @returns {Pipeline} this
   */
  transform(fn) {
    const stageName = `transform_${this.stages.length + 1}`;
    return this.stage(stageName, fn);
  }

  /**
   * 添加过滤阶段
   * @param {function} predicate - 过滤条件
   * @returns {Pipeline} this
   */
  filter(predicate) {
    const stageName = `filter_${this.stages.length + 1}`;
    return this.stage(stageName, async (data) => {
      if (Array.isArray(data)) {
        return data.filter(predicate);
      }
      // 对于非数组，应用到整个数据
      return predicate(data) ? data : null;
    });
  }

  /**
   * 添加映射阶段
   * @param {function} mapper - 映射函数
   * @returns {Pipeline} this
   */
  map(mapper) {
    const stageName = `map_${this.stages.length + 1}`;
    return this.stage(stageName, async (data) => {
      if (Array.isArray(data)) {
        return Promise.all(data.map(async (item) => await mapper(item)));
      }
      return mapper(data);
    });
  }

  /**
   * 添加分支
   * @param {function} condition - 分支条件
   * @param {Pipeline} trueBranch - 条件为真时执行
   * @param {Pipeline} falseBranch - 条件为假时执行
   * @returns {Pipeline} this
   */
  branch(condition, trueBranch, falseBranch = null) {
    const stageName = `branch_${this.stages.length + 1}`;
    return this.stage(stageName, async (data) => {
      const shouldTakeTrue = await condition(data);
      if (shouldTakeTrue) {
        return trueBranch ? await trueBranch.run(data) : data;
      } else {
        return falseBranch ? await falseBranch.run(data) : data;
      }
    });
  }

  /**
   * 添加合并点
   * @param {...Pipeline} pipelines - 要合并的流水线
   * @returns {Pipeline} this
   */
  merge(...pipelines) {
    const stageName = `merge_${this.stages.length + 1}`;
    return this.stage(stageName, async (data) => {
      const results = await Promise.all(
        pipelines.map(p => p.run(data))
      );
      return {
        merged: true,
        sources: results,
        original: data
      };
    });
  }

  /**
   * 添加聚合阶段
   * @param {function} reducer - 聚合函数
   * @param {any} initialValue - 初始值
   * @returns {Pipeline} this
   */
  reduce(reducer, initialValue) {
    const stageName = `reduce_${this.stages.length + 1}`;
    return this.stage(stageName, async (data) => {
      if (Array.isArray(data)) {
        return data.reduce(reducer, initialValue);
      }
      return data;
    });
  }

  /**
   * 执行流水线
   * @param {any} input - 输入数据
   * @param {object} options - 执行选项
   * @returns {Promise<object>} 执行结果
   */
  async run(input, options = {}) {
    const startTime = Date.now();
    let currentData = input;
    
    this.context.history = [];
    this.context.metadata.startTime = new Date().toISOString();

    for (let i = 0; i < this.stages.length; i++) {
      const stage = this.stages[i];
      const stageStartTime = Date.now();
      
      try {
        // 执行阶段
        const result = await Promise.resolve(stage.processor(currentData));
        
        // 记录历史
        this.context.history.push({
          stage: stage.name,
          index: i,
          success: true,
          duration: Date.now() - stageStartTime,
          inputSize: this._getSize(currentData),
          outputSize: this._getSize(result)
        });
        
        currentData = result;
        
      } catch (error) {
        // 记录失败
        this.context.history.push({
          stage: stage.name,
          index: i,
          success: false,
          error: error.message,
          duration: Date.now() - stageStartTime
        });
        
        if (!options.continueOnError) {
          return {
            success: false,
            error: `Pipeline failed at stage "${stage.name}": ${error.message}`,
            failedAt: i,
            history: this.context.history,
            partialResult: currentData
          };
        }
      }
    }

    return {
      success: true,
      output: currentData,
      history: this.context.history,
      stats: {
        totalStages: this.stages.length,
        totalDuration: Date.now() - startTime,
        pipeline: this.name
      }
    };
  }

  /**
   * 获取执行历史
   * @returns {Array} 历史记录
   */
  getHistory() {
    return this.context.history;
  }

  /**
   * 获取管道图
   * @returns {string} ASCII 流程图
   */
  visualize() {
    const lines = [`Pipeline: ${this.name}`];
    lines.push('─'.repeat(40));
    
    for (let i = 0; i < this.stages.length; i++) {
      const stage = this.stages[i];
      const arrow = i < this.stages.length - 1 ? '│' : ' ';
      lines.push(`├─ [${i + 1}] ${stage.name}`);
      if (i < this.stages.length - 1) {
        lines.push(`${arrow}`);
        lines.push(`${arrow}▼`);
      }
    }
    
    lines.push('─'.repeat(40));
    lines.push('▼ Output');
    
    return lines.join('\n');
  }

  _getSize(data) {
    if (data === null || data === undefined) return 0;
    if (Array.isArray(data)) return data.length;
    if (typeof data === 'string') return data.length;
    if (typeof data === 'object') return Object.keys(data).length;
    return 1;
  }
}

// ============================================================================
// 流水线工厂
// ============================================================================

/**
 * 创建新流水线
 */
function createPipeline(name) {
  return new Pipeline(name);
}

/**
 * 创建数据处理流水线
 */
function createDataPipeline() {
  return new Pipeline('data-processing')
    .stage('ingest', async (data) => data)
    .stage('parse', async (data) => {
      if (typeof data === 'string') {
        try { return JSON.parse(data); }
        catch { return data; }
      }
      return data;
    })
    .stage('transform', async (data) => data);
}

/**
 * 创建 ETL 流水线
 */
function createETLPipeline(extract, transform, load) {
  return new Pipeline('etl')
    .stage('extract', extract)
    .stage('transform', transform)
    .stage('load', load);
}

// ============================================================================
// 导出
// ============================================================================

module.exports = {
  Pipeline,
  createPipeline,
  createDataPipeline,
  createETLPipeline
};
