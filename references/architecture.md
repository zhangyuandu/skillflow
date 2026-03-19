# Architecture Deep Dive

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        SkillFlow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Planner    │───▶│  Dispatcher  │───▶│   Executor   │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│         │                   │                    │              │
│         ▼                   ▼                    ▼              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Context    │    │   Registry   │    │    Result    │     │
│  │   Manager    │    │   (Skills)   │    │    Handler   │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────┐
        │            Installed Skills                 │
        │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
        │  │ Skill A │ │ Skill B │ │ Skill C │ ...   │
        │  └─────────┘ └─────────┘ └─────────┘       │
        └─────────────────────────────────────────────┘
```

## Core Modules

### 1. Planner (Task Decomposition)

**Responsibility**: Transform user task into executable steps.

**Process**:
```
Task → Intent Analysis → Skill Discovery → Step Generation → Dependency Resolution → Plan
```

**Implementation**:
- Uses AI model (configurable) to understand task
- Queries Registry for available skills
- Generates step-by-step plan
- Resolves dependencies and execution order

**Example Flow**:
```javascript
// Input
task: "Search for AI papers, summarize top 3, save to Feishu"
context: { user: "YiDao", timezone: "Asia/Shanghai" }

// Planner reasoning
1. Intent: Research workflow with deliverable
2. Skills needed: search, summarize, document
3. Available: tavily-search, summarize, feishu-doc ✓
4. Steps:
   - search(query="AI papers latest") → results
   - filter(results, top=3) → top_papers
   - summarize_batch(top_papers) → summaries
   - create_doc(title, summaries) → doc_url
5. Dependencies: sequential (each depends on previous)

// Output
plan: [
  { id: "s1", action: "search", skill: "tavily-search", inputs: {...} },
  { id: "s2", action: "summarize_batch", skill: "summarize", depends_on: ["s1"] },
  { id: "s3", action: "create_doc", skill: "feishu-doc", depends_on: ["s2"] }
]
```

### 2. Dispatcher (Skill Routing)

**Responsibility**: Match steps to skills and coordinate execution.

**Routing Algorithm**:
```
1. Exact match: step.skill_hint === skill.name
2. Capability match: step.action in skill.capabilities
3. Description match: semantic similarity(step.action, skill.description)
4. Priority: skill_priorities config
```

**Example**:
```javascript
// Step to dispatch
{ action: "search", inputs: { query: "..." } }

// Registry entries
{
  "tavily-search": { capabilities: ["search", "web_lookup"] },
  "brave-search": { capabilities: ["search"] }
}

// Routing decision
→ Select "tavily-search" (higher priority, exact capability match)
```

### 3. Executor (Step Execution)

**Responsibility**: Execute individual steps with error handling.

**Execution Flow**:
```
1. Prepare inputs (from step.inputs + context)
2. Invoke skill
3. Capture output
4. Update context
5. Handle errors (retry/fallback)
6. Return result
```

**Error Handling Strategy**:
```javascript
async function execute_step_with_recovery(step, context) {
  try {
    return await execute_step(step, context);
  } catch (error) {
    // 1. Retry with backoff
    for (let i = 0; i < step.retry; i++) {
      await sleep(backoff(i));
      try {
        return await execute_step(step, context);
      } catch (e) { /* continue */ }
    }
    
    // 2. Fallback skill
    if (step.fallback) {
      return await execute_step({ ...step, skill: step.fallback }, context);
    }
    
    // 3. Graceful degradation
    if (step.on_failure === "skip") {
      return { success: false, skipped: true };
    }
    
    // 4. Ask user
    if (step.on_failure === "ask_user") {
      return await ask_user_for_help(step, error);
    }
    
    // 5. Fail
    throw error;
  }
}
```

### 4. Context Manager

**Responsibility**: Manage execution state and data flow.

**Context Structure**:
```javascript
{
  // Task metadata
  task_id: "uuid",
  original_task: "user request",
  plan: [...],
  
  // Execution state
  current_step: "s2",
  status: "running", // pending, running, paused, completed, failed
  
  // Accumulated data
  outputs: {
    "s1": { results: [...] },
    "s2": { summaries: [...] }
  },
  
  // Derived context (for next steps)
  context: {
    search_results: [...],  // From s1
    papers_to_summarize: [...]  // Derived
  },
  
  // Execution metadata
  timing: {
    started: "ISO",
    steps: { "s1": { duration: 1234 } }
  },
  
  // User context
  user: "YiDao",
  timezone: "Asia/Shanghai"
}
```

### 5. Registry (Skill Discovery)

**Responsibility**: Discover, cache, and query available skills.

**Discovery Process**:
```bash
# Scan skill directories
for dir in skill_directories:
  for skill_dir in dir/*/:
    skill_md = read(skill_dir/SKILL.md)
    registry.add(parse_skill(skill_md))

# Extract skill metadata
parse_skill(md):
  name = frontmatter.name
  description = frontmatter.description
  capabilities = extract_capabilities(description)
  return { name, description, capabilities }
```

**Registry Data Structure**:
```javascript
{
  "skills": {
    "tavily-search": {
      "name": "tavily-search",
      "description": "Web search via Tavily API...",
      "capabilities": ["search", "web_lookup", "find_sources"],
      "inputs": ["query"],
      "outputs": ["results", "urls", "snippets"],
      "path": "~/.openclaw/skills/tavily-search"
    },
    // ... more skills
  },
  "capabilities_index": {
    "search": ["tavily-search", "brave-search"],
    "document.write": ["feishu-doc", "tencent-docs"],
    "summarize": ["summarize"]
  },
  "last_updated": "ISO timestamp"
}
```

**Query Methods**:
```javascript
// Find by capability
registry.findByCapability("search") → ["tavily-search", "brave-search"]

// Find by action semantic match
registry.findByAction("find information") → ["tavily-search"]

// Get skill details
registry.get("tavily-search") → Skill object
```

### 6. Result Handler

**Responsibility**: Process step outputs and determine next actions.

**Output Processing**:
```javascript
// Step returns output
{
  success: true,
  output: { results: [...] },
  next_steps: [...] // Optional: dynamic step addition
}

// Result handler
1. Validate output structure
2. Store in context.outputs[step_id]
3. Update context.context with derived data
4. Check for dynamic steps (adaptive planning)
5. Determine next step(s) to execute
```

## Data Flow

```
User Request
     │
     ▼
┌─────────────┐
│   Planner   │ ←─── Registry (available skills)
└─────────────┘
     │
     ▼
    Plan (Step[])
     │
     ▼
┌─────────────┐
│  Dispatcher │ ←─── Context (execution state)
└─────────────┘
     │
     ▼
  Skill Match
     │
     ▼
┌─────────────┐
│   Executor  │ ←─── Context (step inputs)
└─────────────┘
     │
     ▼
   Result
     │
     ▼
┌─────────────┐
│   Context   │ ←─── Update with output
└─────────────┘
     │
     ▼
  Next Step (or Complete)
```

## Extension Points

### 1. Custom Planners

Replace default planner with specialized logic:

```javascript
// In config
{
  "planner": "custom-planner-skill"
}

// Custom planner receives task + registry
// Returns plan with any custom step structure
```

### 2. Skill Adapters

Wrap external tools as skills:

```javascript
// Adapter pattern
{
  "name": "my-custom-tool",
  "adapter": {
    "to_step": (tool_input) => Step,
    "from_result": (tool_output) => Result
  }
}
```

### 3. Context Enrichers

Add custom context data:

```javascript
// Before execution
context.addEnricher("calendar", async (ctx) => {
  return { upcoming_events: await getCalendar() };
});
```

### 4. Result Processors

Post-process step outputs:

```javascript
// After each step
context.addProcessor("save_history", async (result) => {
  await saveToHistory(result);
  return result;
});
```

## Security Considerations

### Skill Isolation

- Skills run in isolated context
- No direct access to other skills' state
- Context is read-only for skills (except their own output)

### Permission Model

```javascript
// Skill declares permissions needed
{
  "name": "destructive-skill",
  "permissions": ["write", "delete"]
}

// Orchestrator checks before execution
if (skill.permissions.includes("delete") && !user.confirmed) {
  await ask_user_confirmation();
}
```

### Data Protection

- Sensitive data in context is encrypted
- Skill outputs are sanitized before storage
- User can mark context fields as private

## Performance Optimization

### Skill Caching

```javascript
// Cache skill discovery results
registry.cache(duration: 3600)

// Cache skill execution for idempotent operations
executor.cache(step, ttl: 300)
```

### Parallel Execution

```javascript
// Identify independent steps
independent_steps = plan.filter(s => !s.depends_on)

// Execute in parallel
await Promise.all(independent_steps.map(execute_step))
```

### Lazy Loading

```javascript
// Load skill SKILL.md only when needed
skill = registry.get_lazy("tavily-search")
// SKILL.md read only when skill.execute() is called
```

---

**Key Insight**: SkillFlow is meta-cognitive—it thinks about thinking, plans about planning. Its power comes from being a pure orchestration layer that treats all other skills as pluggable components.
