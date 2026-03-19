# Quick Start Examples

## Example 1: Basic Orchestration

**User Request:**
```
Search for recent news about OpenAI, summarize the key points, and save to a Feishu document
```

**What Orchestrator Does:**

1. **Plans the workflow:**
   - Step 1: Search web for "OpenAI news"
   - Step 2: Summarize findings
   - Step 3: Create Feishu document with summary

2. **Discovers skills:**
   - `tavily-search` → for search
   - `summarize` → for summarization
   - `feishu-doc` → for document creation

3. **Executes pipeline:**
```javascript
// Step 1: Search
execute_step({
  action: "search",
  skill: "tavily-search",
  inputs: { query: "OpenAI news recent" }
})
→ { results: [...], urls: [...] }

// Step 2: Summarize
execute_step({
  action: "summarize",
  skill: "summarize",
  inputs: { content: "<search results>" }
})
→ { summary: "Key points: ..." }

// Step 3: Save
execute_step({
  action: "create_doc",
  skill: "feishu-doc",
  inputs: { title: "OpenAI News Summary", content: "<summary>" }
})
→ { doc_url: "https://..." }
```

4. **Returns result:**
```
✓ Task completed. Document created at: https://feishu.cn/...
```

---

## Example 2: Parallel Execution

**User Request:**
```
Research competitor X from web, news, and social media, then compile a report
```

**Orchestrator Plan:**
```javascript
[
  { id: "web", action: "search", skill: "tavily-search", inputs: { query: "X", source: "web" } },
  { id: "news", action: "search", skill: "tavily-search", inputs: { query: "X", source: "news" } },
  { id: "social", action: "search", skill: "agent-browser", inputs: { query: "X", source: "twitter" } },
  { id: "compile", action: "create_doc", depends_on: ["web", "news", "social"] }
]
```

**Execution:**
- Steps `web`, `news`, `social` run **in parallel**
- Step `compile` waits for all three to complete
- Context accumulates all results

---

## Example 3: Adaptive Planning

**User Request:**
```
Fix the bug in main.py and make sure tests pass
```

**Initial Plan:**
```javascript
[
  { id: "read", action: "read_file", inputs: { path: "main.py" } },
  { id: "analyze", action: "identify_bug", depends_on: ["read"] },
  { id: "fix", action: "edit", depends_on: ["analyze"] },
  { id: "test", action: "execute", inputs: { command: "pytest" }, depends_on: ["fix"] }
]
```

**Adaptive Flow:**

```
→ Execute steps 1-4
→ Test fails!
→ Orchestrator adapts:
   - Analyzes test output
   - Adds new step: { id: "debug", action: "analyze_failure" }
   - Modifies fix step with new approach
   - Re-runs from fix step
→ Test passes!
→ Task completed
```

---

## Example 4: Conditional Routing

**User Request:**
```
Process this file: data.xyz
```

**Orchestrator Logic:**
```javascript
[
  { id: "detect", action: "detect_file_type", inputs: { path: "data.xyz" } },
  { 
    id: "process_pdf", 
    action: "process", 
    skill: "pdf-processor",
    condition: "file_type === 'pdf'",
    depends_on: ["detect"]
  },
  { 
    id: "process_image", 
    action: "process", 
    skill: "image-processor",
    condition: "file_type === 'image'",
    depends_on: ["detect"]
  },
  { 
    id: "process_unknown", 
    action: "ask_user", 
    condition: "file_type not in ['pdf', 'image']",
    depends_on: ["detect"]
  }
]
```

---

## Example 5: Multi-Skill Composition

**User Request:**
```
Monitor my email for messages from boss@example.com, summarize each one, and send summaries to my WeChat
```

**Orchestrator Plan:**
```javascript
[
  { 
    id: "monitor", 
    action: "monitor_email",
    skill: "email-monitor",
    inputs: { filter: "from:boss@example.com" },
    trigger: "on_new_email"  // Event-driven
  },
  {
    id: "summarize",
    action: "summarize",
    skill: "summarize",
    depends_on: ["monitor"]
  },
  {
    id: "send",
    action: "send_message",
    skill: "wecom",
    inputs: { to: "user", message: "<summary>" },
    depends_on: ["summarize"]
  }
]
```

**Note:** This creates a continuous workflow that triggers on each new email.

---

## Testing Your Setup

After installing skillflow:

```bash
# 1. Discover installed skills
bash ~/.openclaw/skills/skillflow/scripts/discovery.sh

# 2. Check registry
cat ~/.openclaw/cache/skillflow-registry.json | jq '.skills | keys'

# 3. Test with a simple task
# Just ask: "Search for weather in Beijing and save to a document"
# Orchestrator should:
# - Find tavily-search and feishu-doc (or tencent-docs)
# - Plan: search → save
# - Execute and return result
```

---

## Tips for Best Results

1. **Install complementary skills:**
   - `tavily-search` or `brave-search` (web search)
   - `summarize` (content processing)
   - `feishu-doc` or `tencent-docs` (document operations)
   - `agent-browser` (web browsing)

2. **Provide context:**
   - Mention file paths explicitly
   - Specify output format preferences
   - Include constraints (time, budget, etc.)

3. **Trust SkillFlow:**
   - Don't over-specify the workflow
   - Let it discover and plan
   - It will ask if confused

4. **Iterate:**
   - If result not perfect, provide feedback
   - Orchestrator learns from context
   - Adaptive planning improves over execution

---

**Remember**: You're not writing workflows—you're describing outcomes. Orchestrator figures out the "how."
