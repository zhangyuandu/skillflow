/**
 * SkillFlow - SoulFlow Bridge 集成模块
 * 
 * 将 Bridge V2 的决策能力和记忆系统集成到 SkillFlow 核心
 * 实现"记忆驱动的任务编排"
 */

const path = require('path');

// 延迟加载 Bridge V2，避免循环依赖
let bridge = null;
let bridgeInitPromise = null;

/**
 * 获取或初始化 Bridge
 */
async function getBridge() {
  if (bridge) return bridge;
  
  if (!bridgeInitPromise) {
    bridgeInitPromise = (async () => {
      try {
        const SoulFlowBridgeV2 = require('./soulflow-bridge-v2');
        bridge = new SoulFlowBridgeV2();
        await bridge.init();
        console.log('[SkillFlow Integration] SoulFlow Bridge V2 已加载');
        return bridge;
      } catch (e) {
        console.warn('[SkillFlow Integration] Bridge V2 加载失败:', e.message);
        return null;
      }
    })();
  }
  
  return bridgeInitPromise;
}

/**
 * 任务执行前的决策判断
 * 
 * @param {string} task - 用户任务
 * @param {object} context - 执行上下文
 * @returns {Promise<object>} 决策结果
 */
async function decideStrategy(task, context = {}) {
  const b = await getBridge();
  if (!b) {
    return {
      strategy: 'execute',
      priority: 'normal',
      confidence: 0.5,
      recommendation: '直接执行（Bridge 未就绪）'
    };
  }
  
  return await b.decideExecutionStrategy(task);
}

/**
 * 执行前注入上下文
 * 
 * @param {object} step - 步骤对象
 * @returns {Promise<object>} 含上下文的步骤
 */
async function injectContext(step) {
  const b = await getBridge();
  if (!b) return step;
  
  return await b.injectContext(step);
}

/**
 * 执行后记录经验
 * 
 * @param {object} step - 步骤对象
 * @param {object} result - 执行结果
 */
async function recordExperience(step, result) {
  const b = await getBridge();
  if (!b) return;
  
  await b.recordExperience(step, result);
}

/**
 * 检索相关记忆
 * 
 * @param {string} query - 查询主题
 * @param {string} type - 记忆类型
 * @returns {Promise<object>} 记忆结果
 */
async function recallMemory(query, type = 'all') {
  const b = await getBridge();
  if (!b) return null;
  
  return await b.recallMemory(query, type);
}

/**
 * 触发反思
 * 
 * @param {string} topic - 反思主题
 * @param {object} context - 上下文
 */
async function reflect(topic, context = {}) {
  const b = await getBridge();
  if (!b) return null;
  
  return await b.reflect(topic, context);
}

/**
 * 记录决策
 * 
 * @param {object} decision - 决策对象
 */
async function recordDecision(decision) {
  const b = await getBridge();
  if (!b) return;
  
  await b.recordDecision(decision);
}

/**
 * 获取记忆统计
 */
async function getMemoryStats() {
  const b = await getBridge();
  if (!b) return null;
  
  return b.getStats();
}

module.exports = {
  getBridge,
  decideStrategy,
  injectContext,
  recordExperience,
  recallMemory,
  reflect,
  recordDecision,
  getMemoryStats
};
