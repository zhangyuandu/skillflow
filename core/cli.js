#!/usr/bin/env node

/**
 * Task Queue CLI
 * 智能任务优先级管理
 */

const { PriorityScheduler, Task, STATUS } = require('./priority-scheduler');
const { submitFeedback, checkVersion, formatUpgradeMessage, getStats } = require('./feedback');
const path = require('path');

const storagePath = path.join(process.env.HOME, '.openclaw', 'task-queue.json');
const scheduler = new PriorityScheduler({ storagePath });

// 简单参数解析
const args = process.argv.slice(2);
const command = args[0];

// 提取选项
function extractOptions(args) {
  const options = {};
  const cmdArgs = [];
  
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx > 0) {
        const key = arg.substring(2, eqIdx);
        const value = arg.substring(eqIdx + 1);
        options[key] = value;
      } else {
        options[arg.substring(2)] = true;
      }
    } else {
      cmdArgs.push(arg);
    }
  }
  
  return { cmdArgs, options };
}

const { cmdArgs, options } = extractOptions(args.slice(1));

function printTask(task, score = null) {
  const urgencyEmoji = {
    CRITICAL: '🔴',
    HIGH: '🟠',
    MEDIUM: '🟡',
    LOW: '🟢',
    NONE: '⚪'
  };
  
  const statusEmoji = {
    pending: '⏳',
    in_progress: '🔄',
    done: '✅',
    blocked: '🚫',
    cancelled: '❌'
  };
  
  console.log(`  ${urgencyEmoji[task.urgency]} [${task.urgency}] ${statusEmoji[task.status]} ${task.title}`);
  if (score !== null) {
    console.log(`      优先级: ${Math.round(score)} | 重要性: ${task.importance}`);
  }
  if (task.dependencies && task.dependencies.length > 0) {
    console.log(`      依赖: ${task.dependencies.join(', ')}`);
  }
}

switch (command) {
  case 'add':
  case 'a': {
    const title = cmdArgs.join(' ');
    if (!title) {
      console.log('用法: task add <标题> [--urgency=LEVEL] [--importance=LEVEL] [--due=DATE]');
      process.exit(1);
    }
    
    const taskOptions = { title };
    if (options.urgency) taskOptions.urgency = options.urgency.toUpperCase();
    if (options.importance) taskOptions.importance = options.importance.toUpperCase();
    if (options.due) taskOptions.dueAt = options.due;
    if (options.deps) taskOptions.dependencies = options.deps.split(',');
    if (options.tags) taskOptions.contextTags = options.tags.split(',');
    
    const task = scheduler.add(taskOptions);
    console.log(`\n✅ 已添加任务: ${task.id}`);
    console.log(`   标题: ${task.title}`);
    console.log(`   紧急度: ${task.urgency} | 重要性: ${task.importance}`);
    
    const queue = scheduler.getSortedQueue();
    console.log('\n📋 当前队列:');
    queue.slice(0, 5).forEach(({ task, score }, i) => {
      console.log(`  ${i + 1}. ${task.title} (${Math.round(score)})`);
    });
    break;
  }
  
  case 'list':
  case 'ls':
  case 'l': {
    const overview = scheduler.getOverview();
    
    console.log('\n📊 任务概览');
    console.log('━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  总计: ${overview.stats.total} | 待处理: ${overview.stats.pending} | 进行中: ${overview.stats.inProgress} | 已完成: ${overview.stats.done}`);
    
    if (overview.nextTask) {
      console.log(`\n⏭️  下一个任务:`);
      printTask(overview.nextTask, overview.queue[0]?.score);
    }
    
    console.log('\n📋 优先级队列:');
    overview.queue.forEach(({ id, title, urgency, importance, score }, i) => {
      const urgencyEmoji = { CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🟢' };
      console.log(`  ${i + 1}. ${urgencyEmoji[urgency]} ${title} (${score})`);
    });
    break;
  }
  
  case 'next':
  case 'n': {
    const next = scheduler.getNext();
    if (next) {
      console.log('\n⏭️  下一个任务:');
      printTask(next);
    } else {
      console.log('\n✅ 没有待处理任务');
    }
    break;
  }
  
  case 'start':
  case 's': {
    const taskId = cmdArgs[0];
    if (!taskId) {
      console.log('用法: task start <taskId>');
      process.exit(1);
    }
    const task = scheduler.start(taskId);
    if (task) {
      console.log(`\n✅ 开始任务: ${task.title}`);
    } else {
      console.log(`\n❌ 找不到任务: ${taskId}`);
    }
    break;
  }
  
  case 'done':
  case 'complete':
  case 'c': {
    const taskId = cmdArgs[0];
    if (!taskId) {
      console.log('用法: task done <taskId>');
      process.exit(1);
    }
    const task = scheduler.complete(taskId);
    if (task) {
      console.log(`\n✅ 完成任务: ${task.title}`);
      
      const next = scheduler.getNext();
      if (next) {
        console.log(`\n⏭️  下一个任务: ${next.title}`);
      }
      
      // 完成后自动检查版本
      console.log(`\n🔍 检查更新...`);
      checkVersion().then(info => {
        if (info.hasUpdate) {
          console.log(formatUpgradeMessage(info));
        }
      });
      
      // 提示反馈
      console.log(`\n📮 请对该任务评分 (1-5星):`);
      console.log(`   task rate <1-5> [comment]`);
      console.log(`   例如: task rate 5 很好用!`);
    } else {
      console.log(`\n❌ 找不到任务: ${taskId}`);
    }
    break;
  }
  
  case 'rm':
  case 'remove': {
    const taskId = cmdArgs[0];
    if (!taskId) {
      console.log('用法: task rm <taskId>');
      process.exit(1);
    }
    if (scheduler.remove(taskId)) {
      console.log(`\n✅ 已删除任务: ${taskId}`);
    } else {
      console.log(`\n❌ 找不到任务: ${taskId}`);
    }
    break;
  }
  
  case 'context':
  case 'ctx': {
    if (cmdArgs[0]) {
      const tags = cmdArgs[0].split(',');
      scheduler.setContext({ tags });
      console.log(`\n✅ 上下文已更新: ${tags.join(', ')}`);
    } else {
      console.log(`\n📌 当前上下文: ${scheduler.currentContext.tags.join(', ')}`);
    }
    break;
  }
  
  case 'reorder':
  case 'rank': {
    const queue = scheduler.getSortedQueue();
    console.log('\n📋 重新排序的队列:');
    queue.forEach(({ task, score }, i) => {
      printTask(task, score);
      console.log();
    });
    break;
  }
  
  case 'clear': {
    scheduler.clearCompleted();
    console.log('\n✅ 已清空已完成任务');
    break;
  }
  
  case 'rate': {
    // 评分: task rate <1-5> [comment]
    const rating = parseInt(cmdArgs[0]);
    if (!rating || rating < 1 || rating > 5) {
      console.log('用法: task rate <1-5> [评论]');
      process.exit(1);
    }
    const comment = cmdArgs.slice(1).join(' ');
    
    // 获取最近完成的任务
    const recent = scheduler.tasks
      .filter(t => t.status === 'done')
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];
    
    submitFeedback({
      rating,
      comment,
      taskId: recent?.id,
      taskTitle: recent?.title
    });
    
    console.log(`\n✅ 感谢反馈! ${'⭐'.repeat(rating)}`);
    break;
  }
  
  case 'version':
  case 'v': {
    console.log(`\n🔍 检查新版本...`);
    checkVersion().then(info => {
      if (info.error) {
        console.log(`检查失败: ${info.error}`);
      } else if (info.hasUpdate) {
        console.log(formatUpgradeMessage(info));
      } else {
        console.log(`✅ 当前已是最新版本 v${info.current}`);
      }
    });
    break;
  }
  
  case 'stats': {
    const overview = scheduler.getOverview();
    console.log('\n📊 统计:');
    console.log(`  待处理: ${overview.stats.pending}`);
    console.log(`  进行中: ${overview.stats.inProgress}`);
    console.log(`  已完成: ${overview.stats.done}`);
    console.log(`  阻塞: ${overview.stats.blocked}`);
    console.log(`  总计: ${overview.stats.total}`);
    break;
  }
  
  default:
    console.log(`
🎯 Task Queue - 智能优先级管理

用法:
  task add <标题> [选项]          添加任务
    --urgency=LEVEL              紧急度: CRITICAL/HIGH/MEDIUM/LOW
    --importance=LEVEL           重要性: BLOCKING/HIGH/MEDIUM/LOW/OPTIONAL
    --due=DATE                   截止时间
    --deps=id1,id2               依赖任务
    --tags=tag1,tag2             上下文标签

  task list                       显示队列
  task next                       下一个任务
  task start <id>                 开始任务
  task done <id>                  完成任务（自动检查更新、提示反馈）
  task remove <id>                删除任务
  task context <tags>             设置上下文
  task reorder                    重新排序
  task clear                      清空已完成
  task stats                      统计
  
  task rate <1-5> [评论]          任务评分
  task version                    检查新版本
`);
}
