---
name: skillflow
description: "Universal intelligent task orchestration engine. Automatically discovers, schedules, and composes multiple sub-skills to complete complex tasks. Use when user requests multi-step workflows, cross-skill coordination, automatic task decomposition, or phrases like orchestrate/coordinate/plan and execute appear. Core interfaces: plan(task, context), execute_step(step)."
---

# SkillFlow

Universal intelligent task orchestration engine that enables "skills orchestrating skills" paradigm.

## Core Concept

**One Brain, Infinite Skills.**

This skill encapsulates the most complex orchestration logic into a standalone, installable module. Any OpenClaw instance gains top-tier task orchestration capability by simply installing this skill—no need to reinvent the wheel.

## Standard Interfaces

```javascript
// Core API - All orchestrations follow this pattern

// 1. Plan: Decompose task into executable steps
plan(task: string, context: object) => Step[]

// 2. Execute: Run a single step with skill discovery
execute_step(step: Step) => Result

// Step structure
{
  id: string,
  action: string,        // What to do
  skill_hint?: string,   // Suggested skill (optional)
  inputs: object,        // Input parameters
  depends_on?: string[], // Step IDs this depends on
  retry?: number,        // Retry count (default: 0)
  timeout?: number       // Timeout in ms (default: 30000)
}

// Result structure
{
  success: boolean,
  output: any,
  error?: string,
  next_steps?: string[]  // Dynamically added steps
}
```

## How It Works

### 1. Task Planning

When receiving a task, the orchestrator:

1. **Understands intent** - Analyzes what the user wants
2. **Discovers available skills** - Scans installed skills matching the task
3. **Decomposes into steps** - Breaks complex tasks into atomic operations
4. **Identifies dependencies** - Determines execution order
5. **Generates plan** - Returns ordered step list

**Example:**
```
Task: "Search for latest AI papers, summarize top 3, and save to Feishu doc"

Plan generated:
1. [search] Use tavily-search to find AI papers
2. [filter] Select top 3 by relevance  
3. [summarize] Use summarize skill on each paper
4. [write] Use feishu-doc to create document with summaries
```

### 2. Skill Discovery

**Automatic Discovery:**
```bash
# SkillFlow scans available skills
skillhub list --installed

# For each skill, extracts:
# - Name and description (from SKILL.md frontmatter)
# - Capabilities (from description triggers)
# - Required inputs/outputs (inferred from examples)
```

**Skill Registry Format:**
```json
{
  "skills": {
    "tavily-search": {
      "description": "Web search via Tavily API",
      "capabilities": ["search", "web_lookup", "find_sources"],
      "inputs": ["query"],
      "outputs": ["results", "urls", "snippets"]
    },
    "feishu-doc": {
      "description": "Feishu document operations",
      "capabilities": ["create_doc", "write_content", "edit_doc"],
      "inputs": ["title", "content"],
      "outputs": ["doc_url", "doc_id"]
    }
  }
}
```

### 3. Step Execution

For each step:
1. **Skill selection** - Match step action to best available skill
2. **Input preparation** - Gather inputs from context + dependencies
3. **Execution** - Invoke skill with prepared inputs
4. **Output capture** - Store result in execution context
5. **Error handling** - Retry, fallback, or fail gracefully

**Execution Context:**
```javascript
{
  "task_id": "uuid",
  "original_task": "string",
  "plan": Step[],
  "completed_steps": {
    "step_id": Result
  },
  "current_context": {
    // Accumulated data from completed steps
  },
  "start_time": "ISO timestamp",
  "metadata": {}
}
```

## Workflow Patterns

See [references/patterns.md](references/patterns.md) for detailed patterns:

- **Sequential**: Steps execute in order (default)
- **Parallel**: Independent steps run concurrently
- **Conditional**: Steps execute based on conditions
- **Iterative**: Steps repeat until condition met
- **Adaptive**: Plan adjusts based on intermediate results

## Usage Examples

### Example 1: Multi-Source Research

```
User: "Research competitor X, gather info from web and news, summarize findings"

SkillFlow:
1. [discover] Found skills: tavily-search, summarize, agent-browser
2. [plan] 
   - Step 1: Search web for "competitor X" (tavily-search)
   - Step 2: Search news for "competitor X" (tavily-search)  
   - Step 3: Combine and summarize (summarize)
3. [execute] Run steps sequentially, passing context
4. [output] Final summary delivered
```

### Example 2: Document Pipeline

```
User: "Download the PDF from URL, extract text, translate to English, save to Tencent Docs"

SkillFlow:
1. [discover] Found skills: agent-browser, summarize, tencent-docs
2. [plan]
   - Step 1: Download PDF (agent-browser)
   - Step 2: Extract text (summarize)
   - Step 3: Translate (built-in capability)
   - Step 4: Create doc (tencent-docs)
3. [execute] Pipeline execution with context passing
```

### Example 3: Adaptive Planning

```
User: "Fix the bug in the code and deploy it"

SkillFlow:
1. [plan] Initial plan:
   - Step 1: Read code (read)
   - Step 2: Identify bug (reasoning)
   - Step 3: Fix code (edit)
   - Step 4: Test (exec)
   
2. [adaptive] If test fails:
   - Add Step 5: Debug (reasoning)
   - Modify Step 3: Fix differently
   - Re-run from Step 3
```

## Configuration

See [references/config.md](references/config.md) for configuration options:

- **Planning model**: Which model to use for task planning
- **Max steps**: Maximum steps in a plan (default: 20)
- **Timeout**: Default step timeout (default: 30s)
- **Retry policy**: Retry attempts and backoff strategy
- **Skill preferences**: Prioritize certain skills for specific tasks

## Error Handling

```javascript
// Three-tier error handling

// 1. Retry with backoff
{
  "retry": 3,
  "backoff": "exponential",  // linear, exponential, fixed
  "initial_delay": 1000
}

// 2. Fallback skill
{
  "skill_hint": "primary-skill",
  "fallback": "backup-skill"
}

// 3. Graceful degradation
{
  "on_failure": "skip",  // skip, abort, ask_user
  "default_output": null
}
```

## Integration Guide

### For Skill Developers

To make your skill orchestrator-compatible:

1. **Clear description** - Frontmatter description should clearly state capabilities
2. **Standard inputs** - Accept structured inputs (JSON when complex)
3. **Documented outputs** - Return structured, predictable outputs
4. **Error messages** - Provide actionable error messages

### For Users

Install and use:

```bash
# Install skillflow
skillhub install skillflow

# Install additional skills as needed
skillhub install tavily-search
skillhub install feishu-doc
skillhub install summarize

# SkillFlow automatically discovers and uses them
```

## Architecture Deep Dive

See [references/architecture.md](references/architecture.md) for:
- Detailed module breakdown
- Skill discovery mechanism
- Context management
- Execution engine internals
- Extension points

## Best Practices

1. **Start simple** - Let orchestrator plan, don't over-specify
2. **Provide context** - More context = better planning
3. **Trust the system** - SkillFlow handles complexity
4. **Iterate** - Refine based on results

## Limitations

- Requires properly configured skills
- Planning quality depends on available skills
- Not suitable for real-time/critical systems
- Complex dependencies may need manual specification

## Documentation

- [README.md](README.md) - 项目介绍
- [QUICKSTART.md](QUICKSTART.md) - 快速开始
- [CONTRIBUTING.md](CONTRIBUTING.md) - 贡献指南
- [CHANGELOG.md](CHANGELOG.md) - 更新日志
- [ROADMAP.md](ROADMAP.md) - 开发路线

## Support

- 📖 [GitHub Repository](https://github.com/yourname/skillflow)
- 🐛 [Issue Tracker](https://github.com/yourname/skillflow/issues)
- 💬 [Discussions](https://github.com/yourname/skillflow/discussions)

---

**Remember**: This skill is the brain. Other skills are the hands. Install once, orchestrate everything.
