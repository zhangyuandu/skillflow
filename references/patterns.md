# Orchestration Patterns

## Sequential Pattern

Steps execute one after another. Output of step N becomes input to step N+1.

```javascript
// Example: Sequential
const plan = [
  { id: "step1", action: "search", inputs: { query: "AI news" } },
  { id: "step2", action: "summarize", depends_on: ["step1"] },
  { id: "step3", action: "save", depends_on: ["step2"] }
];
```

**Use case**: Linear workflows where each step depends on previous.

## Parallel Pattern

Independent steps execute simultaneously. Best for tasks with no dependencies.

```javascript
// Example: Parallel execution
const plan = [
  { id: "web_search", action: "search", inputs: { query: "X" } },
  { id: "news_search", action: "search_news", inputs: { query: "X" } },
  { id: "social_search", action: "search_social", inputs: { query: "X" } },
  // All three run in parallel, then merge
  { id: "merge", action: "combine", depends_on: ["web_search", "news_search", "social_search"] }
];
```

**Use case**: Multi-source data gathering, batch processing.

## Conditional Pattern

Steps execute based on conditions evaluated at runtime.

```javascript
// Example: Conditional
const plan = [
  { 
    id: "check_type", 
    action: "detect_type",
    outputs: ["file_type"]
  },
  {
    id: "process_pdf",
    action: "process",
    condition: "file_type === 'pdf'",
    depends_on: ["check_type"]
  },
  {
    id: "process_image", 
    action: "process",
    condition: "file_type === 'image'",
    depends_on: ["check_type"]
  }
];
```

**Use case**: File type detection, routing based on content.

## Iterative Pattern

Steps repeat until condition is met.

```javascript
// Example: Iterative (refine until good)
const plan = [
  { id: "generate", action: "generate_content" },
  { 
    id: "evaluate", 
    action: "assess_quality",
    depends_on: ["generate"]
  },
  {
    id: "refine",
    action: "improve",
    condition: "quality < threshold",
    depends_on: ["evaluate"],
    loop_back_to: "generate"  // Iterates
  }
];
```

**Use case**: Content generation with quality checks, debugging loops.

## Adaptive Pattern

Plan dynamically adjusts based on execution results.

```javascript
// Example: Adaptive execution
async function execute_with_adaptation(plan, context) {
  let current_plan = plan;
  
  for (let step of current_plan) {
    const result = await execute_step(step, context);
    
    // Analyze result
    if (result.success && result.next_steps) {
      // Dynamically add new steps
      current_plan = insert_steps(current_plan, step.id, result.next_steps);
    }
    
    if (!result.success && result.retry_suggestion) {
      // Modify and retry
      current_plan = modify_step(current_plan, step.id, result.retry_suggestion);
    }
  }
  
  return context;
}
```

**Use case**: Complex problem-solving, debugging, research tasks.

## Pipeline Pattern

Data flows through transformation stages.

```javascript
// Example: Data pipeline
const pipeline = [
  { id: "ingest", action: "fetch", source: "url" },
  { id: "parse", action: "extract", format: "json" },
  { id: "transform", action: "normalize", schema: "standard" },
  { id: "enrich", action: "add_metadata", source: "external_api" },
  { id: "store", action: "save", destination: "db" }
];
```

**Use case**: ETL, data processing, document workflows.

## Human-in-the-Loop Pattern

Orchestrator pauses for human approval at key points.

```javascript
// Example: Human approval
const plan = [
  { id: "plan", action: "generate_plan" },
  { 
    id: "approve", 
    action: "request_approval", 
    pause_point: true,
    depends_on: ["plan"]
  },
  { 
    id: "execute", 
    action: "run_plan", 
    condition: "approved",
    depends_on: ["approve"]
  }
];
```

**Use case**: Sensitive operations, important decisions, safety checks.

## Error Recovery Pattern

Automatic error handling with recovery strategies.

```javascript
// Example: Error recovery
const step = {
  id: "risky_operation",
  action: "delete_data",
  retry: {
    attempts: 3,
    backoff: "exponential",
    strategy: "fallback_skill"
  },
  fallback: {
    action: "mark_for_review",
    notify: "admin"
  },
  on_failure: "ask_user"
};
```

**Use case**: Network operations, external API calls, destructive actions.
