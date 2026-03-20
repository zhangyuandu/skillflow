/**
 * SkillFlow - 执行历史管理
 * 
 * 提供执行记录的存储、查询和分析：
 * - 记录每次执行的详细信息
 * - 支持执行链追溯
 * - 提供统计和分析功能
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// History Manager 类
// ============================================================================

class HistoryManager {
  constructor(options = {}) {
    this.historyFile = options.historyFile || 
      path.join(process.env.HOME || '/tmp', '.openclaw', 'skillflow', 'history.json');
    this.maxRecords = options.maxRecords || 1000;
    this.records = [];
    this.currentIndex = 0;
    
    this._loadHistory();
  }

  /**
   * 记录执行
   * @param {object} execution - 执行记录
   * @returns {string} 执行ID
   */
  record(execution) {
    const id = this._generateId();
    const record = {
      id,
      timestamp: new Date().toISOString(),
      ...execution
    };
    
    this.records.unshift(record);
    this.currentIndex++;
    
    // 限制记录数量
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(0, this.maxRecords);
    }
    
    // 异步保存
    this._saveHistory();
    
    return id;
  }

  /**
   * 获取执行记录
   * @param {string} id - 执行ID
   * @returns {object|null} 执行记录
   */
  get(id) {
    return this.records.find(r => r.id === id) || null;
  }

  /**
   * 查询执行记录
   * @param {object} query - 查询条件
   * @returns {Array} 匹配的记录
   */
  query(query = {}) {
    let results = [...this.records];
    
    // 按任务筛选
    if (query.task) {
      results = results.filter(r => 
        r.task && r.task.toLowerCase().includes(query.task.toLowerCase())
      );
    }
    
    // 按状态筛选
    if (query.success !== undefined) {
      results = results.filter(r => r.success === query.success);
    }
    
    // 按时间范围筛选
    if (query.startTime) {
      results = results.filter(r => 
        new Date(r.timestamp) >= new Date(query.startTime)
      );
    }
    if (query.endTime) {
      results = results.filter(r => 
        new Date(r.timestamp) <= new Date(query.endTime)
      );
    }
    
    // 按技能筛选
    if (query.skill) {
      results = results.filter(r => 
        r.skills && r.skills.includes(query.skill)
      );
    }
    
    // 限制返回数量
    if (query.limit) {
      results = results.slice(0, query.limit);
    }
    
    return results;
  }

  /**
   * 获取最近执行
   * @param {number} count - 数量
   * @returns {Array} 最近记录
   */
  recent(count = 10) {
    return this.records.slice(0, count);
  }

  /**
   * 获取统计信息
   * @param {object} options - 统计选项
   * @returns {object} 统计数据
   */
  stats(options = {}) {
    const total = this.records.length;
    const successful = this.records.filter(r => r.success).length;
    const failed = total - successful;
    
    // 计算平均执行时间
    const durations = this.records
      .filter(r => r.duration)
      .map(r => r.duration);
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;
    
    // 统计技能使用频率
    const skillUsage = {};
    this.records.forEach(r => {
      if (r.skills) {
        r.skills.forEach(skill => {
          skillUsage[skill] = (skillUsage[skill] || 0) + 1;
        });
      }
    });
    
    // 统计每日执行量
    const dailyStats = {};
    this.records.forEach(r => {
      const date = r.timestamp.split('T')[0];
      dailyStats[date] = (dailyStats[date] || 0) + 1;
    });
    
    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total * 100).toFixed(2) + '%' : 'N/A',
      avgDuration: Math.round(avgDuration),
      skillUsage,
      dailyStats,
      oldestRecord: this.records.length > 0 
        ? this.records[this.records.length - 1].timestamp 
        : null,
      newestRecord: this.records.length > 0 
        ? this.records[0].timestamp 
        : null
    };
  }

  /**
   * 清除历史
   * @param {object} options - 清除选项
   */
  clear(options = {}) {
    if (options.before) {
      // 清除指定时间之前的记录
      const cutoff = new Date(options.before);
      this.records = this.records.filter(r => 
        new Date(r.timestamp) >= cutoff
      );
    } else if (options.keepRecent) {
      // 保留最近的记录
      this.records = this.records.slice(0, options.keepRecent);
    } else {
      // 清除全部
      this.records = [];
    }
    
    this._saveHistory();
  }

  /**
   * 导出历史
   * @param {string} format - 导出格式
   * @returns {string} 导出内容
   */
  export(format = 'json') {
    switch (format) {
      case 'json':
        return JSON.stringify(this.records, null, 2);
      case 'csv':
        return this._toCSV();
      case 'markdown':
        return this._toMarkdown();
      default:
        return JSON.stringify(this.records);
    }
  }

  // ============================================================================
  // 内部方法
  // ============================================================================

  _generateId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `exec_${timestamp}_${random}`;
  }

  _loadHistory() {
    try {
      const dir = path.dirname(this.historyFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      if (fs.existsSync(this.historyFile)) {
        const data = fs.readFileSync(this.historyFile, 'utf-8');
        this.records = JSON.parse(data);
      }
    } catch (error) {
      // 加载失败，使用空数组
      this.records = [];
    }
  }

  _saveHistory() {
    try {
      const dir = path.dirname(this.historyFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.historyFile, JSON.stringify(this.records, null, 2));
    } catch (error) {
      console.error('Failed to save history:', error.message);
    }
  }

  _toCSV() {
    if (this.records.length === 0) return '';
    
    const headers = ['id', 'timestamp', 'task', 'success', 'duration', 'skills'];
    const rows = this.records.map(r => [
      r.id,
      r.timestamp,
      `"${(r.task || '').replace(/"/g, '""')}"`,
      r.success,
      r.duration || '',
      `"${(r.skills || []).join(',')}"`
    ]);
    
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  _toMarkdown() {
    const lines = ['# SkillFlow 执行历史\n'];
    
    lines.push('## 统计\n');
    const stats = this.stats();
    lines.push(`- 总执行次数: ${stats.total}`);
    lines.push(`- 成功率: ${stats.successRate}`);
    lines.push(`- 平均耗时: ${stats.avgDuration}ms\n`);
    
    lines.push('## 最近执行\n');
    lines.push('| 时间 | 任务 | 状态 | 耗时 |');
    lines.push('|------|------|------|------|');
    
    this.recent(20).forEach(r => {
      const time = new Date(r.timestamp).toLocaleString('zh-CN');
      const task = (r.task || '').substring(0, 30);
      const status = r.success ? '✅' : '❌';
      const duration = r.duration ? `${r.duration}ms` : '-';
      lines.push(`| ${time} | ${task} | ${status} | ${duration} |`);
    });
    
    return lines.join('\n');
  }
}

// ============================================================================
// 单例实例
// ============================================================================

let defaultInstance = null;

function getHistoryManager(options) {
  if (!defaultInstance) {
    defaultInstance = new HistoryManager(options);
  }
  return defaultInstance;
}

// ============================================================================
// 导出
// ============================================================================

module.exports = {
  HistoryManager,
  getHistoryManager
};
