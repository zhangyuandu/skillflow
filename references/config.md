# Orchestrator Configuration

## Configuration File

Location: `~/.openclaw/config/skillflow.json`

```json
{
  "planning": {
    "model": "default",
    "max_steps": 20,
    "max_depth": 5,
    "timeout": 60000
  },
  "execution": {
    "default_timeout": 30000,
    "max_parallel": 5,
    "retry_attempts": 3,
    "retry_backoff": "exponential"
  },
  "discovery": {
    "scan_on_startup": true,
    "cache_duration": 3600,
    "skill_directories": [
      "~/.openclaw/skills",
      "~/.openclaw/workspace/skills"
    ]
  },
  "skills": {
    "preferences": {},
    "exclusions": [],
    "priorities": {}
  },
  "logging": {
    "level": "info",
    "save_plans": true,
    "save_results": true
  }
}
```

## Planning Settings

### `model`

Which model to use for task planning and decomposition.

- `default`: Use session default model
- `hunyuan-turbos`: Fast, good for simple tasks
- `hunyuan-t1`: Deep thinking for complex planning
- `tc-code-latest`: Code-centric planning

### `max_steps`

Maximum number of steps in a generated plan.

- Default: `20`
- Range: `1-100`
- Lower = simpler plans, higher = complex workflows

### `max_depth`

Maximum depth of nested plans (sub-plans).

- Default: `5`
- Prevents infinite recursion

### `timeout`

Maximum time for entire orchestration (ms).

- Default: `60000` (1 minute)
- Set higher for long-running workflows

## Execution Settings

### `default_timeout`

Timeout for each step execution (ms).

- Default: `30000` (30 seconds)
- Per-step timeout can override this

### `max_parallel`

Maximum parallel steps to execute simultaneously.

- Default: `5`
- Increase for I/O bound tasks, decrease for CPU bound

### `retry_attempts`

Default retry count for failed steps.

- Default: `3`
- Can be overridden per-step

### `retry_backoff`

Backoff strategy for retries.

- `exponential`: 1s, 2s, 4s, 8s... (default)
- `linear`: 1s, 2s, 3s, 4s...
- `fixed`: Always 1s

## Discovery Settings

### `scan_on_startup`

Scan for skills when SkillFlow initializes.

- Default: `true`
- Set `false` to use cached skill registry

### `cache_duration`

How long to cache skill discovery results (seconds).

- Default: `3600` (1 hour)
- Set `0` to always re-scan

### `skill_directories`

Where to look for installed skills.

- Default includes OpenClaw's skill paths
- Add custom paths for local skills

## Skill Preferences

### `preferences`

Map task types to preferred skills.

```json
{
  "preferences": {
    "search": "tavily-search",
    "document.write": "feishu-doc",
    "document.read": "summarize",
    "code.execute": "exec"
  }
}
```

### `exclusions`

Skills to never use (by name).

```json
{
  "exclusions": ["deprecated-skill", "broken-skill"]
}
```

### `priorities`

Skill priority levels (higher = preferred).

```json
{
  "priorities": {
    "tavily-search": 10,
    "brave-search": 5
  }
}
```

## Example Configurations

### Fast & Simple (Quick tasks)

```json
{
  "planning": { "model": "hunyuan-turbos", "max_steps": 10 },
  "execution": { "default_timeout": 10000, "max_parallel": 3 }
}
```

### Deep & Thorough (Complex tasks)

```json
{
  "planning": { 
    "model": "hunyuan-t1", 
    "max_steps": 50,
    "timeout": 300000 
  },
  "execution": { 
    "retry_attempts": 5,
    "retry_backoff": "exponential" 
  }
}
```

### Conservative (Safe operations)

```json
{
  "execution": {
    "retry_attempts": 1,
    "default_timeout": 60000
  },
  "skills": {
    "exclusions": ["delete", "destructive"]
  }
}
```

## Runtime Overrides

Override configuration per-task:

```javascript
// In task request
{
  "task": "...",
  "config_override": {
    "planning": { "max_steps": 30 },
    "execution": { "max_parallel": 10 }
  }
}
```
