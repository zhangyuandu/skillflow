/**
 * SkillFlow Sandbox - 沙箱隔离执行引擎 (轻量版)
 * 
 * 功能：
 * - 隔离技能执行环境
 * - 监控敏感操作（文件、网络、进程）
 * - 异常行为实时拦截
 * - 超时和资源限制
 * 
 * ⚠️ 安全警告：此为轻量版，生产环境建议使用 vm2 或 Docker 隔离
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// 危险模式检测
const DANGEROUS_PATTERNS = [
  /require\s*\(\s*['"]fs['"]\s*\)/gi,
  /require\s*\(\s*['"]child_process['"]\s*\)/gi,
  /process\.exit\s*\(/gi,
  /process\.kill\s*\(/gi,
  /eval\s*\(/gi,
  /Function\s*\(/gi,
  /__import__\s*\(/gi,
  /import\s*\(\s*['"]/gi,
  /global\./gi,
  /globalThis\./gi
];

class Sandbox {
  constructor(options = {}) {
    this.timeout = options.timeout || 30000;
    this.maxMemory = options.maxMemory || 128 * 1024 * 1024;
    this.blockedCommands = options.blockedCommands || ['rm', 'del', 'format', 'dd', 'mkfs'];
    this.networkEnabled = options.networkEnabled !== false;
    this.execEnabled = options.execEnabled !== false;
    
    // 审计日志
    this.auditLog = [];
    
    // 安全配置
    this.securityConfig = {
      allowFsRead: options.allowFsRead || ['/root/.openclaw/workspace/**'],
      allowFsWrite: options.allowFsWrite || [],
      allowNetwork: options.allowNetwork || false,
      allowExec: options.allowExec || false
    };
  }

  /**
   * 执行技能代码（沙箱隔离）
   */
  async execute(code, context = {}) {
    const startTime = Date.now();
    const auditEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      codeLength: code.length,
      context: { ...context, sensitive: undefined }
    };

    // 安全检查 - 静态分析
    const securityCheck = this._securityCheck(code);
    if (!securityCheck.safe) {
      auditEntry.success = false;
      auditEntry.error = `Security violation: ${securityCheck.reason}`;
      auditEntry.violation = securityCheck.pattern;
      this.auditLog.push(auditEntry);
      return { success: false, error: auditEntry.error, audit: auditEntry };
    }

    try {
      // 创建安全上下文
      const safeContext = this._createSafeContext(context, auditEntry);
      
      // 使用 Function 构造器创建隔离执行环境
      const wrappedCode = `
        "use strict";
        return (async function(sandbox, context) {
          ${code}
        })(sandbox, context);
      `;
      
      const fn = new Function('sandbox', 'context', wrappedCode);
      
      // 设置超时
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Execution timeout')), this.timeout);
      });
      
      const executePromise = Promise.resolve(fn(safeContext, context));
      
      const result = await Promise.race([executePromise, timeoutPromise]);
      
      auditEntry.success = true;
      auditEntry.duration = Date.now() - startTime;
      auditEntry.result = this._sanitizeResult(result);
      
      this.auditLog.push(auditEntry);
      
      return {
        success: true,
        result,
        audit: auditEntry
      };
    } catch (error) {
      auditEntry.success = false;
      auditEntry.error = error.message;
      auditEntry.duration = Date.now() - startTime;
      auditEntry.warnings = this.detectSuspiciousBehavior(auditEntry);
      
      this.auditLog.push(auditEntry);
      
      return {
        success: false,
        error: error.message,
        audit: auditEntry
      };
    }
  }

  /**
   * 安全检查 - 静态分析
   */
  _securityCheck(code) {
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(code)) {
        return { safe: false, reason: `Dangerous pattern detected`, pattern: pattern.source };
      }
    }
    return { safe: true };
  }

  /**
   * 执行外部命令（高度受限）
   */
  async executeCommand(command, args = [], options = {}) {
    const startTime = Date.now();
    
    // 安全检查
    const cmdName = command.split('/').pop().split('\\').pop();
    if (this.blockedCommands.includes(cmdName.toLowerCase())) {
      throw new Error(`Command blocked: ${cmdName}`);
    }

    if (!this.securityConfig.allowExec) {
      throw new Error('External command execution disabled');
    }

    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        timeout: options.timeout || this.timeout,
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...options.env },
        stdio: options.stdio || 'pipe'
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => { stdout += data.toString(); });
      proc.stderr?.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', (code) => {
        resolve({
          code,
          stdout: stdout.substring(0, 10000),
          stderr: stderr.substring(0, 5000),
          duration: Date.now() - startTime
        });
      });

      proc.on('error', (error) => {
        reject(error);
      });

      setTimeout(() => {
        proc.kill('SIGTERM');
        reject(new Error('Command timeout'));
      }, options.timeout || this.timeout);
    });
  }

  /**
   * 创建安全的执行上下文
   */
  _createSafeContext(context, auditEntry) {
    return {
      console: {
        log: (...args) => {
          auditEntry.logs = auditEntry.logs || [];
          auditEntry.logs.push({ type: 'log', args: this._sanitizeArgs(args) });
        },
        info: (...args) => {
          auditEntry.logs = auditEntry.logs || [];
          auditEntry.logs.push({ type: 'info', args: this._sanitizeArgs(args) });
        },
        warn: (...args) => {
          auditEntry.logs = auditEntry.logs || [];
          auditEntry.logs.push({ type: 'warn', args: this._sanitizeArgs(args) });
        },
        error: (...args) => {
          auditEntry.logs = auditEntry.logs || [];
          auditEntry.logs.push({ type: 'error', args: this._sanitizeArgs(args) });
        }
      },
      
      JSON,
      Math,
      Date,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      Map,
      Set,
      Promise,
      Symbol,
      
      fs: {
        readFile: (filePath, encoding = 'utf8') => this._safeReadFile(filePath, encoding, auditEntry),
        readFileSync: (filePath, encoding = 'utf8') => this._safeReadFile(filePath, encoding, auditEntry),
        existsSync: (filePath) => {
          const resolved = path.resolve(filePath);
          return this._isPathAllowed(resolved, this.securityConfig.allowFsRead) && fs.existsSync(resolved);
        },
        statSync: (filePath) => {
          const resolved = path.resolve(filePath);
          if (!this._isPathAllowed(resolved, this.securityConfig.allowFsRead)) {
            throw new Error(`Path not allowed: ${filePath}`);
          }
          return fs.statSync(resolved);
        },
        readdirSync: (dirPath) => {
          const resolved = path.resolve(dirPath);
          if (!this._isPathAllowed(resolved, this.securityConfig.allowFsRead)) {
            throw new Error(`Path not allowed: ${dirPath}`);
          }
          return fs.readdirSync(resolved);
        },
        // 禁止写入
        writeFile: () => { throw new Error('Write operations blocked in sandbox'); },
        writeFileSync: () => { throw new Error('Write operations blocked in sandbox'); },
        mkdir: () => { throw new Error('Write operations blocked in sandbox'); },
        mkdirSync: () => { throw new Error('Write operations blocked in sandbox'); },
        unlink: () => { throw new Error('Write operations blocked in sandbox'); },
        rmdir: () => { throw new Error('Write operations blocked in sandbox'); },
        appendFile: () => { throw new Error('Write operations blocked in sandbox'); },
        appendFileSync: () => { throw new Error('Write operations blocked in sandbox'); },
        rename: () => { throw new Error('Write operations blocked in sandbox'); },
        copyFile: () => { throw new Error('Write operations blocked in sandbox'); },
        chmod: () => { throw new Error('Write operations blocked in sandbox'); },
        chown: () => { throw new Error('Write operations blocked in sandbox'); }
      },
      
      fetch: this.securityConfig.allowNetwork ? global.fetch : () => {
        throw new Error('Network disabled in sandbox');
      },
      
      process: {
        env: { ...process.env },
        cwd: () => process.cwd(),
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        exit: () => { throw new Error('Process exit blocked in sandbox'); },
        kill: () => { throw new Error('Signal sending blocked in sandbox'); }
      },
      
      // 禁止 require
      require: () => { throw new Error('require() disabled in sandbox'); },
      
      setTimeout: (fn, delay, ...args) => {
        const maxDelay = Math.min(delay, 10000);
        return setTimeout(fn, maxDelay, ...args);
      },
      setInterval: (fn, delay, ...args) => {
        const maxDelay = Math.min(delay, 10000);
        return setInterval(fn, maxDelay, ...args);
      },
      clearTimeout,
      clearInterval
    };
  }

  _safeReadFile(filePath, encoding, auditEntry) {
    auditEntry.fsReads = auditEntry.fsReads || [];
    auditEntry.fsReads.push(filePath);
    
    const resolved = path.resolve(filePath);
    if (!this._isPathAllowed(resolved, this.securityConfig.allowFsRead)) {
      throw new Error(`Path not allowed: ${filePath}`);
    }
    
    const stats = fs.statSync(resolved);
    if (stats.size > 1024 * 1024) {
      throw new Error('File too large to read in sandbox');
    }
    
    return fs.readFileSync(resolved, encoding);
  }

  _isPathAllowed(filePath, patterns) {
    if (!patterns || patterns.length === 0) return false;
    if (patterns.includes('**')) return true;
    
    for (const pattern of patterns) {
      const cleanPattern = pattern.replace('**', '');
      if (filePath.includes(cleanPattern) || filePath.startsWith(cleanPattern)) {
        return true;
      }
    }
    return false;
  }

  _sanitizeArgs(args) {
    return args.map(arg => {
      if (arg === undefined) return 'undefined';
      if (arg === null) return 'null';
      if (typeof arg === 'function') return '[Function]';
      if (typeof arg === 'object') return '[Object]';
      if (typeof arg === 'string') {
        return arg.length > 500 ? arg.substring(0, 500) + '...' : arg;
      }
      return arg;
    });
  }

  _sanitizeResult(result) {
    if (result === undefined) return 'undefined';
    if (result === null) return 'null';
    if (typeof result === 'function') return '[Function]';
    if (typeof result === 'symbol') return '[Symbol]';
    if (typeof result === 'object') {
      try {
        const str = JSON.stringify(result);
        return str.length > 5000 ? str.substring(0, 5000) + '...' : JSON.parse(str);
      } catch {
        return '[Object]';
      }
    }
    return result;
  }

  getAuditLog(limit = 100) {
    return this.auditLog.slice(-limit);
  }

  clearAuditLog() {
    this.auditLog = [];
  }

  detectSuspiciousBehavior(auditEntry) {
    const warnings = [];
    if (auditEntry.fsReads?.length > 10) warnings.push('Excessive file read operations');
    if (auditEntry.logs?.filter(l => l.type === 'error').length > 5) warnings.push('High error rate');
    if (auditEntry.duration > this.timeout * 0.8) warnings.push('Near timeout execution');
    if (auditEntry.codeLength > 50000) warnings.push('Large code execution');
    return warnings;
  }

  setSecurityRules(config) {
    Object.assign(this.securityConfig, config);
  }

  addAllowedPath(pattern) {
    this.securityConfig.allowFsRead.push(pattern);
  }

  setNetworkEnabled(enabled) {
    this.securityConfig.allowNetwork = enabled;
  }

  setExecEnabled(enabled) {
    this.securityConfig.allowExec = enabled;
  }
}

module.exports = Sandbox;
