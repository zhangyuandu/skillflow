#!/usr/bin/env node

/**
 * SkillFlow Priority Scheduler
 * 智能任务优先级编排模块
 * 
 * 评估维度：
 * - 紧急度：时间敏感性
 * - 重要性：对目标的贡献
 * - 依赖性：前置任务
 * - 上下文：当前状态相关性
 */

const fs = require('fs');
const path = require('path');

// 优先级评分权重
const WEIGHTS = {
  urgency: 0.4,      // 紧急度权重
  importance: 0.3,   // 重要性权重
  dependency: 0.2,   // 依赖权重
  context: 0.1       // 上下文权重
};

// 紧急度等级
const URGENCY = {
  CRITICAL: 100,  // 立即处理
  HIGH: 75,       // 今天内
  MEDIUM: 50,     // 本周内
  LOW: 25,        // 可延后
  NONE: 0         // 无时间要求
};

// 重要性等级
const IMPORTANCE = {
  BLOCKING: 100,  // 阻塞其他任务
  HIGH: 75,       // 核心功能
  MEDIUM: 50,     // 重要但非关键
  LOW: 25,        // 锦上添花
  OPTIONAL: 0     // 可选
};

// 任务状态
const STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled'
};

/**
 * 任务类
 */
class Task {
  constructor(options) {
    this.id = options.id || `task-${Date.now()}`;
    this.title = options.title;
    this.description = options.description || '';
    this.urgency = options.urgency || 'MEDIUM';
    this.importance = options.importance || 'MEDIUM';
    this.status = options.status || STATUS.PENDING;
    this.dependencies = options.dependencies || [];  // 依赖的任务ID
    this.contextTags = options.contextTags || [];      // 上下文标签
    this.createdAt = options.createdAt || new Date().toISOString();
    this.dueAt = options.dueAt || null;               // 截止时间
    this.completedAt = options.completedAt || null;
    this.metadata = options.metadata || {};
  }

  // 计算优先级分数
  calculateScore(currentContext = {}) {
    let score = 0;
    
    // 1. 紧急度评分
    const urgencyScore = URGENCY[this.urgency] || 50;
    
    // 如果有截止时间，动态调整
    if (this.dueAt) {
      const now = new Date();
      const due = new Date(this.dueAt);
      const hoursLeft = (due - now) / (1000 * 60 * 60);
      
      if (hoursLeft < 0) {
        // 已过期，紧急度翻倍
        score += URGENCY.CRITICAL * WEIGHTS.urgency * 2;
      } else if (hoursLeft < 2) {
        // 2小时内
        score += URGENCY.CRITICAL * WEIGHTS.urgency;
      } else if (hoursLeft < 24) {
        // 24小时内
        score += URGENCY.HIGH * WEIGHTS.urgency;
      } else {
        score += urgencyScore * WEIGHTS.urgency;
      }
    } else {
      score += urgencyScore * WEIGHTS.urgency;
    }
    
    // 2. 重要性评分
    const importanceScore = IMPORTANCE[this.importance] || 50;
    score += importanceScore * WEIGHTS.importance;
    
    // 3. 依赖评分
    // 如果有未完成的依赖，降低优先级
    if (this.dependencies.length > 0) {
      score += IMPORTANCE.LOW * WEIGHTS.dependency;
    } else {
      score += IMPORTANCE.MEDIUM * WEIGHTS.dependency;
    }
    
    // 4. 上下文相关性评分
    if (currentContext.tags) {
      const matchingTags = this.contextTags.filter(t => 
        currentContext.tags.includes(t)
      );
      const tagScore = (matchingTags.length / Math.max(this.contextTags.length, 1)) * 100;
      score += tagScore * WEIGHTS.context;
    }
    
    return Math.min(score, 200); // 上限200
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      urgency: this.urgency,
      importance: this.importance,
      status: this.status,
      dependencies: this.dependencies,
      contextTags: this.contextTags,
      createdAt: this.createdAt,
      dueAt: this.dueAt,
      completedAt: this.completedAt,
      metadata: this.metadata
    };
  }

  static fromJSON(json) {
    return new Task(json);
  }
}

/**
 * 任务队列管理器
 */
class PriorityScheduler {
  constructor(options = {}) {
    this.tasks = [];
    this.storagePath = options.storagePath || path.join(process.env.HOME, '.openclaw', 'task-queue.json');
    this.currentContext = options.context || { tags: ['skillflow', 'default'] };
    
    this.load();
  }

  // 加载任务队列
  load() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf-8'));
        this.tasks = (data.tasks || []).map(t => Task.fromJSON(t));
      }
      
      // 自动检查版本（静默）
      this.checkVersionSilent();
    } catch (e) {
      console.error('加载任务队列失败:', e.message);
      this.tasks = [];
    }
  }
  
  // 静默版本检查
  async checkVersionSilent() {
    try {
      const { checkVersion, formatUpgradeMessage } = require('./feedback.js');
      const info = await checkVersion();
      if (info.hasUpdate) {
        // 将升级信息保存，等下次用户交互时显示
        this.pendingUpgrade = info;
      }
    } catch (e) {
      // 忽略版本检查错误
    }
  }

  // 保存任务队列
  save() {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.storagePath, JSON.stringify({
        tasks: this.tasks.map(t => t.toJSON()),
        updatedAt: new Date().toISOString()
      }, null, 2));
    } catch (e) {
      console.error('保存任务队列失败:', e.message);
    }
  }

  // 添加任务
  add(taskOrOptions) {
    const task = taskOrOptions instanceof Task 
      ? taskOrOptions 
      : new Task(taskOrOptions);
    
    this.tasks.push(task);
    this.save();
    
    return task;
  }

  // 移除任务
  remove(taskId) {
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index > -1) {
      this.tasks.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  // 更新任务
  update(taskId, updates) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      Object.assign(task, updates);
      this.save();
      return task;
    }
    return null;
  }

  // 设置当前上下文
  setContext(context) {
    this.currentContext = { ...this.currentContext, ...context };
  }

  // 获取排序后的任务队列
  getSortedQueue() {
    // 过滤出待处理和进行中的任务
    const activeTasks = this.tasks.filter(t => 
      t.status === STATUS.PENDING || t.status === STATUS.IN_PROGRESS
    );
    
    // 计算每个任务的优先级分数
    const scored = activeTasks.map(task => ({
      task,
      score: task.calculateScore(this.currentContext)
    }));
    
    // 按分数降序排列
    scored.sort((a, b) => b.score - a.score);
    
    // 处理依赖关系
    const sorted = [];
    const added = new Set();
    
    // 拓扑排序（考虑依赖）
    while (sorted.length < scored.length) {
      let found = false;
      
      for (const { task, score } of scored) {
        if (added.has(task.id)) continue;
        
        // 检查依赖是否都已完成
        const depsMet = task.dependencies.every(depId => {
          const dep = this.tasks.find(t => t.id === depId);
          return !dep || dep.status === STATUS.DONE;
        });
        
        if (depsMet) {
          sorted.push({ task, score });
          added.add(task.id);
          found = true;
        }
      }
      
      if (!found) break; // 防止死循环
    }
    
    return sorted;
  }

  // 获取下一个任务
  getNext() {
    const queue = this.getSortedQueue();
    return queue.length > 0 ? queue[0].task : null;
  }

  // 获取可执行的任务（依赖都已满足）
  getRunnable() {
    return this.tasks.filter(t => {
      if (t.status !== STATUS.PENDING) return false;
      return t.dependencies.every(depId => {
        const dep = this.tasks.find(dep => dep.id === depId);
        return !dep || dep.status === STATUS.DONE;
      });
    });
  }

  // 重新排序队列
  reorder() {
    return this.getSortedQueue();
  }

  // 插入任务（自动重排）
  insert(taskOrOptions, position = null) {
    const task = taskOrOptions instanceof Task
      ? taskOrOptions
      : new Task(taskOrOptions);
    
    this.tasks.push(task);
    
    // 如果指定位置，插入到指定位置
    if (position !== null) {
      // 保持其他任务的相对顺序，只调整新任务
      const sorted = this.getSortedQueue();
      const insertIndex = sorted.findIndex(s => s.task.id === task.id);
      // 不需要手动插入，getSortedQueue 会重新计算
    }
    
    this.save();
    
    return {
      task,
      queue: this.getSortedQueue()
    };
  }

  // 获取队列概览
  getOverview() {
    const stats = {
      total: this.tasks.length,
      pending: this.tasks.filter(t => t.status === STATUS.PENDING).length,
      inProgress: this.tasks.filter(t => t.status === STATUS.IN_PROGRESS).length,
      done: this.tasks.filter(t => t.status === STATUS.DONE).length,
      blocked: this.tasks.filter(t => t.status === STATUS.BLOCKED).length
    };
    
    const queue = this.getSortedQueue();
    
    return {
      stats,
      nextTask: queue.length > 0 ? queue[0].task : null,
      queue: queue.slice(0, 5).map(({ task, score }) => ({
        id: task.id,
        title: task.title,
        urgency: task.urgency,
        importance: task.importance,
        score: Math.round(score)
      }))
    };
  }

  // 完成任务
  complete(taskId) {
    return this.update(taskId, {
      status: STATUS.DONE,
      completedAt: new Date().toISOString()
    });
  }

  // 开始任务
  start(taskId) {
    return this.update(taskId, { status: STATUS.IN_PROGRESS });
  }

  // 阻塞任务
  block(taskId, reason) {
    return this.update(taskId, { 
      status: STATUS.BLOCKED,
      metadata: { blockReason: reason }
    });
  }

  // 清空已完成任务
  clearCompleted() {
    this.tasks = this.tasks.filter(t => t.status !== STATUS.DONE);
    this.save();
  }

  // 导出任务
  export() {
    return this.tasks.map(t => t.toJSON());
  }

  // 导入任务
  import(tasksData) {
    this.tasks = tasksData.map(t => Task.fromJSON(t));
    this.save();
  }
}

// 便捷函数：快速添加任务
function quickAdd(title, options = {}) {
  const scheduler = new PriorityScheduler();
  return scheduler.add({ title, ...options });
}

// 便捷函数：获取下一个任务
function getNextTask() {
  const scheduler = new PriorityScheduler();
  return scheduler.getNext();
}

module.exports = {
  Task,
  PriorityScheduler,
  STATUS,
  URGENCY,
  IMPORTANCE,
  WEIGHTS,
  quickAdd,
  getNextTask
};
