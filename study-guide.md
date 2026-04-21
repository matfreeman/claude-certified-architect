# Claude Certified Architect – Foundations: Complete Study Guide

> **Pass target:** 720/1000 scaled score. This guide consolidates the official exam guide, the internal reference guide, the slide deck, the study doc, and internal passer notes into one end-to-end study resource covering all 5 domains, with examples, implementation patterns, and exam-specific callouts.

---

## How to Use This Guide

Work through each domain sequentially. For each Task Statement, read the concept explanation, study the code examples, check the documentation links, and note the **exam tips** (common distractors and traps). Complete the mini-quizzes at the end of each domain before moving on.

**Primary documentation sources:**
- Claude Code docs: `https://code.claude.com/docs/en/`
- Anthropic platform docs: `https://platform.claude.com/docs/en/`
- MCP specification: `https://modelcontextprotocol.io/`

---

## Exam Overview

This exam is scenario-based. The goal is not memorizing isolated facts; it is choosing the **most effective** architectural decision for a realistic Claude implementation problem.

### Format at a glance

| Detail | Value |
|---|---|
| Question type | Multiple choice (1 correct answer, 3 distractors) |
| Passing score | `720 / 1000` scaled |
| Guessing penalty | None — answer every question |
| Scenario selection | 4 of 6 official scenarios per exam sitting |
| Highest-weighted domain | Domain 1: Agentic Architecture & Orchestration (27%) |
| Highest combined priority | Domain 1 (27%) + Domain 4 (20%) = nearly half the exam |

### Official scenario map

| Scenario | Primary domains |
|---|---|
| Customer Support Resolution Agent | D1, D2, D5 |
| Code Generation with Claude Code | D3, D5 |
| Multi-Agent Research System | D1, D2, D5 |
| Developer Productivity with Claude | D2, D3, D1 |
| Claude Code for CI/CD | D3, D4 |
| Structured Data Extraction | D4, D5 |

### Study posture for the exam

- Look for deterministic controls over prompt-only guidance when correctness, money, security, or compliance are involved.
- Expect distractors that are technically plausible but too heavy, too vague, or at the wrong layer.
- Questions often hinge on wording such as **most effective**, **first step**, **best initial fix**, or **most appropriate architecture**.

---

## Cross-Domain Foundations

These concepts show up across multiple domains. Know them before drilling into the task statements.

### API request structure and message history

At the Messages API layer, the model does not persist state between requests. Your application must resend the relevant conversation history on every call.

```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 1024,
  "system": "You are a careful assistant.",
  "messages": [
    {"role": "user", "content": "Find the bug"},
    {"role": "assistant", "content": "I'll inspect the codebase."}
  ],
  "tools": [],
  "tool_choice": {"type": "auto"}
}
```

**Fields worth memorizing:**
- `model`: which Claude model to use
- `max_tokens`: output cap
- `system`: behavior, constraints, and role
- `messages`: the current conversation history
- `tools`: the available structured tools
- `tool_choice`: whether Claude may skip tools, must call a tool, or must call a specific tool

**Message roles to remember:**
- `user`: the current request or returned tool results
- `assistant`: Claude's prior responses
- `tool_result` content: returned tool outputs that become part of the next turn's context

### `stop_reason` and loop control

At the raw API layer, `stop_reason` is the reliable signal for what happens next.

| `stop_reason` | Meaning | What to do |
|---|---|---|
| `"tool_use"` | Claude wants one or more tool calls | Execute tools, append results, continue |
| `"end_turn"` | Claude is done | Present final answer |
| `"max_tokens"` | Output was truncated | Retry or resume with adjusted settings |
| `"stop_sequence"` | Custom stop sequence matched | Handle according to app logic |
| `"pause_turn"` | Server-side tool loop hit an iteration boundary | Re-send the conversation to continue |

**Exam distinction:** if you're using the Agent SDK, the SDK drives the loop for you. If you're reasoning about the Messages API directly, you own the loop.

### System prompt vs user prompt

This distinction is tested directly.

| Prompt type | Purpose |
|---|---|
| System prompt | Sets behavior, role, constraints, escalation rules, and output expectations |
| User prompt | The actual task or request for the current interaction |

**Important nuance:** system prompt wording can accidentally bias tool selection. For example, a keyword-heavy instruction like "always verify customer records first" can make Claude overuse `get_customer` even when `lookup_order` is the better first tool.

### Context window fundamentals

Everything below consumes context:
- system prompt
- `CLAUDE.md` and rules
- tool definitions
- prior conversation turns
- tool inputs and outputs

**Cross-domain context failure modes:**
- Lost in the middle: important mid-input findings get underweighted
- Tool result bloat: 40 returned fields when only 5 matter
- Progressive summarization loss: dates, percentages, IDs, and customer expectations get blurred

**First-line mitigations:**
- Put key findings at the beginning or end of long prompts
- Trim tool outputs before they accumulate
- Preserve critical facts in a structured facts block
- Prefer structured upstream outputs over passing raw transcripts downstream

---

## Domain 1: Agentic Architecture & Orchestration (27%)

### 1.1 The Agentic Loop Lifecycle

**Core concept:** The agentic loop is a cycle where Claude evaluates a prompt, decides whether to call a tool or produce a final answer, executes tools (if any), and repeats until done.

**The loop at a glance:**
1. Claude receives prompt + tool definitions + conversation history
2. Claude responds — either with tool calls or a final text answer
3. If tool calls: execute tools, append results to conversation, go to step 2
4. If no tool calls: loop ends (`stop_reason: "end_turn"`)

**Key `stop_reason` values:**

| `stop_reason` | Meaning | Action |
|---|---|---|
| `"tool_use"` | Claude wants to call one or more tools | Execute tools, return results, continue loop |
| `"end_turn"` | Claude finished — this is the final answer | Exit loop, use `result` field |
| `"max_tokens"` | Hit output token limit | Handle error, optionally resume |
| `"refusal"` | Claude declined the request | Handle gracefully |

**Correct loop implementation (Python SDK):**

```python
from claude_agent_sdk import query, ResultMessage, AssistantMessage

async for message in query(
    prompt="Find and fix the bug in auth.py",
    options=ClaudeAgentOptions(
        allowed_tools=["Read", "Edit", "Bash", "Glob", "Grep"],
        max_turns=30,
        effort="high",
    ),
):
    if isinstance(message, AssistantMessage):
        print(f"Turn completed: {len(message.content)} content blocks")
    if isinstance(message, ResultMessage):
        if message.subtype == "success":
            print(message.result)
        elif message.subtype == "error_max_turns":
            print(f"Hit turn limit. Resume session {message.session_id}")
        print(f"Cost: ${message.total_cost_usd:.4f}")
```

**The SDK handles the loop for you.** You do NOT manually check `stop_reason: tool_use` and execute tools — the SDK Agent loop does this internally. The `stop_reason` / `subtype` you inspect is the *final* outcome from `ResultMessage`.

**Anti-patterns to avoid on the exam:**
- Parsing natural language in assistant responses to decide when to stop (e.g., looking for "Task complete" text)
- Setting an arbitrary `max_turns=5` as the *only* stopping mechanism — this should be a safety limit, not the primary exit condition
- Checking for the presence of text content blocks as a completion indicator
- Model-driven vs pre-configured: Claude *reasons* about which tool to call next — you don't hardcode tool sequences

**Result subtypes:**

| Subtype | Meaning |
|---|---|
| `success` | Finished normally — `result` field has the answer |
| `error_max_turns` | Hit `maxTurns` limit |
| `error_max_budget_usd` | Hit `maxBudgetUsd` limit |
| `error_during_execution` | API failure or cancelled |
| `error_max_structured_output_retries` | Structured output failed after max retries |

**Doc link:** https://code.claude.com/docs/en/agent-sdk/agent-loop

---

### 1.2 Multi-Agent Coordinator-Subagent Patterns

**Hub-and-spoke architecture:** A coordinator agent manages all communication. Subagents do not talk to each other — everything routes through the coordinator.

```
User → Coordinator
Coordinator → Web Search Subagent
Coordinator ← Web Search Subagent (results)
Coordinator → Document Analysis Subagent (with web results in prompt)
Coordinator ← Document Analysis Subagent
Coordinator → Synthesis Subagent (with all findings)
Coordinator ← Synthesis Subagent
Coordinator → User
```

**Critical: subagents have isolated context.** A subagent does NOT automatically inherit the coordinator's conversation history, tool results, or prior reasoning. You must explicitly pass everything the subagent needs in its prompt.

**Coordinator responsibilities:**
1. **Task decomposition** — breaking down complex requests into subtasks
2. **Dynamic subagent selection** — choosing which subagents to invoke based on the query (not always running all of them)
3. **Scope partitioning** — assigning distinct subtopics or source types to each agent to minimize duplication
4. **Result aggregation** — combining subagent outputs
5. **Iterative refinement** — evaluating synthesis output for gaps, re-delegating targeted queries, repeating until coverage is sufficient
6. **Error handling** — managing failures from subagents

**Exam trap — narrow task decomposition:** If a coordinator decomposes "AI impact on creative industries" into only ["AI in digital art", "AI in graphic design", "AI in photography"], and subagents execute correctly, the system still fails because the coordinator's decomposition missed music, writing, and film. The root cause is the coordinator, not the subagents.

**Doc link:** https://code.claude.com/docs/en/agent-sdk/subagents

---

### 1.3 Subagent Invocation, Context Passing, and Spawning

**The `Agent` tool (formerly `Task`):** Subagents are spawned via the `Agent` tool. For a coordinator to invoke subagents, `"Agent"` must be in `allowedTools`.

```python
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition

async for message in query(
    prompt="Research the impact of AI on creative industries",
    options=ClaudeAgentOptions(
        allowed_tools=["Read", "Grep", "Glob", "Agent"],  # Agent required!
        agents={
            "web-search": AgentDefinition(
                description="Searches the web for recent information. Use for finding current articles and news.",
                prompt="""You are a web research specialist. Search for relevant content and return:
- Claim text
- Source URL
- Publication date
- Relevance score

Return structured JSON with these fields for each finding.""",
                tools=["WebSearch", "WebFetch"],
            ),
            "doc-analyzer": AgentDefinition(
                description="Analyzes documents and research papers. Use for deep document analysis.",
                prompt="You are a document analysis specialist. Analyze the provided documents thoroughly.",
                tools=["Read", "Grep", "Glob"],
            ),
            "synthesizer": AgentDefinition(
                description="Synthesizes findings from multiple sources into comprehensive reports.",
                prompt="""You are a synthesis specialist. Combine the provided findings into a coherent report.
Preserve all source attributions. Structure: well-established findings vs contested claims.""",
                tools=["Read"],
            ),
        },
    ),
):
    if hasattr(message, "result"):
        print(message.result)
```

**Passing context to subagents — pass everything explicitly:**

```python
# WRONG — subagent cannot see web_results from parent context
subagent_prompt = "Analyze these documents and synthesize findings"

# CORRECT — include all findings in the prompt
subagent_prompt = f"""
Synthesize these research findings into a comprehensive report:

## Web Search Results
{json.dumps(web_results, indent=2)}

## Document Analysis
{json.dumps(doc_analysis, indent=2)}

Requirements:
- Preserve source URLs for every claim
- Distinguish well-established from contested findings
- Include publication dates for temporal context
"""
```

**Spawning parallel subagents:** Emit multiple `Agent` tool calls in a single coordinator response (not across separate turns).

```python
# The coordinator's system prompt should instruct it to spawn agents in parallel:
coordinator_prompt = """
When researching a broad topic:
1. Spawn the web-search and doc-analyzer subagents simultaneously
2. Wait for both results
3. Pass ALL findings to the synthesizer

Do NOT run agents sequentially — spawn them in parallel by calling Agent multiple times in one response.
"""
```

**Structured context separation — content vs metadata:**

```python
# Pass findings with attribution metadata preserved
findings = {
    "claims": [
        {
            "claim": "AI tools reduced production time by 40%",
            "source_url": "https://example.com/article",
            "source_name": "Creative AI Report 2025",
            "publication_date": "2025-01-15",
            "excerpt": "...our study found..."
        }
    ]
}
```

**AgentDefinition fields:**

| Field | Required | Description |
|---|---|---|
| `description` | Yes | When Claude should use this subagent |
| `prompt` | Yes | Subagent's system prompt / role |
| `tools` | No | Restricted tool list (inherits all if omitted) |
| `model` | No | `"sonnet"`, `"opus"`, `"haiku"`, or `"inherit"` |
| `skills` | No | Skill names available to this subagent |

**Note on naming:** The tool was renamed from `"Task"` to `"Agent"` in Claude Code v2.1.63. Exam questions still reference `Task` in descriptions — know that both refer to subagent spawning.

**Official docs nuance:** A subagent's own prompt replaces the default Claude Code system prompt for that subagent session. `CLAUDE.md` files and project memory still load through the normal message flow, so subagents remain isolated from parent conversation history but not from project instructions and memory.

**Doc link:** https://code.claude.com/docs/en/agent-sdk/subagents

---

### 1.4 Multi-Step Workflows with Enforcement and Handoff

**Programmatic enforcement vs prompt-based guidance:**

| Approach | Reliability | Use when |
|---|---|---|
| Programmatic (hooks, gates) | Deterministic — guaranteed | Business rules with financial/safety consequences |
| Prompt-based instructions | Probabilistic — ~85-95% | Style, preferences, soft guidelines |

**The exam's key principle:** When a specific tool sequence is *required* for correctness (e.g., verifying customer identity before processing a refund), prompt instructions alone have a non-zero failure rate. Use programmatic enforcement.

**Programmatic prerequisite example — blocking `process_refund` until `get_customer` has verified:**

```python
async def enforce_verification_gate(input_data, tool_use_id, context):
    """Block refund processing until customer verification is complete."""
    if input_data["tool_name"] == "process_refund":
        # Check if verification has been completed in this session
        if not context.get("customer_verified"):
            return {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": "Must call get_customer first to verify customer identity"
                }
            }
    
    if input_data["tool_name"] == "get_customer":
        # Mark verification as in-progress; PostToolUse hook will set completed
        pass
    
    return {}
```

**Structured handoff protocols:** When escalating to a human agent, include everything they need — they don't have access to the conversation transcript.

```python
handoff_summary = {
    "customer_id": "C-12345",
    "customer_name": "Jane Smith",
    "issue_description": "Customer disputes $150 charge from 2025-03-01",
    "root_cause": "Duplicate billing due to system error during payment retry",
    "attempted_resolution": "Standard refund blocked — amount exceeds $100 auto-approval limit",
    "refund_amount_requested": 150.00,
    "recommended_action": "Approve manual refund of $150 — verified duplicate charge",
    "evidence": "Order #98765 shows two identical charges 3 minutes apart"
}
```

**Multi-concern decomposition:** When a customer has multiple issues, investigate each in parallel using shared context, then synthesize a unified resolution.

**Doc link:** https://code.claude.com/docs/en/agent-sdk/hooks

---

### 1.5 Agent SDK Hooks for Tool Call Interception and Data Normalization

**Hook types and when they fire:**

| Hook | Fires when | Common use |
|---|---|---|
| `PreToolUse` | Before a tool executes | Block dangerous commands, validate inputs, modify inputs |
| `PostToolUse` | After a tool returns | Normalize output data, audit, trigger side effects |
| `TeammateIdle` | When an agent teammate is about to go idle | Enforce quality gates before the teammate stops |
| `PostToolUseFailure` | After a tool fails | Handle/log errors |
| `UserPromptSubmit` | When a prompt is submitted | Inject additional context |
| `Stop` | When agent finishes | Save session state, validate result |
| `SubagentStart` / `SubagentStop` | Subagent spawns/completes | Track parallel tasks, aggregate results |
| `SessionStart` | Session initializes | Inject environment context, initialize telemetry, load defaults |
| `PreCompact` | Before context compaction | Archive full transcript |
| `Notification` | Agent status messages | Forward to Slack/PagerDuty |

**PostToolUse hook — normalizing heterogeneous data formats:**

```python
async def normalize_tool_outputs(input_data, tool_use_id, context):
    """Normalize date formats and status codes from different MCP tools."""
    if input_data["hook_event_name"] != "PostToolUse":
        return {}
    
    tool_output = input_data.get("tool_output", {})
    
    # Different tools return dates in different formats — normalize to ISO 8601
    if "timestamp" in tool_output:
        if isinstance(tool_output["timestamp"], int):
            # Unix timestamp → ISO 8601
            from datetime import datetime, timezone
            tool_output["timestamp"] = datetime.fromtimestamp(
                tool_output["timestamp"], tz=timezone.utc
            ).isoformat()
    
    # Normalize numeric status codes to human-readable strings
    status_map = {200: "active", 0: "inactive", 404: "not_found", 403: "suspended"}
    if "status" in tool_output and isinstance(tool_output["status"], int):
        tool_output["status"] = status_map.get(tool_output["status"], "unknown")
    
    return {
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": f"Normalized output: {json.dumps(tool_output)}"
        }
    }
```

**PreToolUse hook — blocking policy violations (e.g., refunds > $500):**

```python
async def enforce_refund_policy(input_data, tool_use_id, context):
    """Block refunds exceeding $500 auto-approval threshold."""
    if input_data["tool_name"] == "process_refund":
        amount = input_data["tool_input"].get("amount", 0)
        if amount > 500:
            return {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": f"Refund of ${amount} exceeds $500 limit. Escalate to human agent."
                },
                "systemMessage": "This refund requires human approval. Please escalate using escalate_to_human tool."
            }
    return {}

options = ClaudeAgentOptions(
    hooks={
        "PreToolUse": [
            HookMatcher(matcher="process_refund", hooks=[enforce_refund_policy])
        ],
        "PostToolUse": [
            HookMatcher(hooks=[normalize_tool_outputs])
        ]
    }
)
```

**Hooks vs prompts — key exam distinction:**
- Hooks provide **deterministic** guarantees — a `deny` decision ALWAYS blocks the tool
- Prompts provide **probabilistic** compliance — Claude usually follows instructions but not always
- For financial operations, security checks, or compliance requirements: use hooks

**Matcher syntax:**
- `"Bash"` — matches only the Bash tool
- `"Write|Edit"` — matches Write OR Edit
- `"^mcp__"` — matches all MCP tools
- No matcher — matches all events of that type

**Doc link:** https://code.claude.com/docs/en/agent-sdk/hooks

---

### 1.6 Task Decomposition Strategies

**Two decomposition patterns:**

| Pattern | When to use | How it works |
|---|---|---|
| **Prompt chaining** (fixed sequential) | Predictable, multi-aspect tasks (code reviews) | Each step is predefined; output of step N feeds step N+1 |
| **Dynamic adaptive** | Open-ended investigation tasks | Generate subtasks based on what's discovered at each step |

**Prompt chaining for code reviews:**

```
Step 1: Analyze file auth.py → findings_auth
Step 2: Analyze file orders.py → findings_orders  
Step 3: Analyze file payments.py → findings_payments
Step 4: Cross-file integration pass (data flow, interface contracts) → integrated_findings
Step 5: Prioritized report
```

Why split? Reviewing 14 files together causes **attention dilution** — the model gives inconsistent depth across files and may produce contradictory feedback (flagging a pattern as bad in one file while approving the same pattern in another).

**Dynamic decomposition for open-ended tasks:**

```python
# Example: "Add comprehensive tests to this legacy codebase"
# Step 1: Map codebase structure (discover what's there)
# Step 2: Identify high-impact, undertested areas
# Step 3: Create prioritized plan — adapts as dependencies are discovered
# Step 4: Generate tests for highest-priority areas first
# (each step informs the next)
```

**Doc link:** https://code.claude.com/docs/en/agent-sdk/agent-loop

---

### 1.7 Session State, Resumption, and Forking

**Session options:**

| Option | Python | TypeScript | What it does |
|---|---|---|---|
| Continue most recent | `ClaudeSDKClient` | `continue: true` | Picks up the most recent session in cwd |
| Resume by ID | `resume=session_id` | `resume: sessionId` | Resumes a specific past session |
| Fork | `fork_session=True` | `forkSession: true` | Creates a new session branching from existing history |

**Capture session ID:**

```python
async for message in query(prompt="Analyze the auth module", options=...):
    if isinstance(message, ResultMessage):
        session_id = message.session_id  # Save this!
        print(f"Session: {session_id}")
```

**Resume a specific session:**

```python
# Later, with a follow-up question — agent has full prior context
async for message in query(
    prompt="Now implement the refactoring you suggested",
    options=ClaudeAgentOptions(
        resume=session_id,
        allowed_tools=["Read", "Edit", "Write"],
    ),
):
    ...
```

**Fork to explore divergent approaches:**

```python
# Fork: try OAuth2 without losing the JWT analysis
forked_id = None
async for message in query(
    prompt="Instead of JWT, implement OAuth2",
    options=ClaudeAgentOptions(resume=session_id, fork_session=True),
):
    if isinstance(message, ResultMessage):
        forked_id = message.session_id  # NEW session ID for the fork

# Original session_id still points to the JWT analysis — untouched
```

**When to resume vs start fresh:**
- **Resume:** Prior context is mostly valid, tool results are still accurate
- **Start fresh with structured summary:** Prior tool results are stale (files changed significantly)
- **Fork:** Want to explore divergent approaches from a shared baseline

**After resuming, inform the agent about file changes:**
```
"Since our last session, auth.py was refactored — the JWTManager class was split into 
TokenIssuer and TokenValidator. Please re-read auth.py before continuing."
```

**Session storage location:** `~/.claude/projects/<encoded-cwd>/<session-id>.jsonl`
The `encoded-cwd` is the absolute path with non-alphanumeric chars replaced by `-`.
A session from `/Users/me/proj` is stored under `-Users-me-proj`.

**`--resume` in CLI (Claude Code):**
```bash
claude --resume my-investigation-session "What did we find about the auth bug?"
```

**Related CLI study point:** `context: fork` isolates a skill invocation, while `--fork-session` is the CLI-side session forking concept. Exam questions may contrast these, so memorize the distinction even if you usually work through the SDK's `fork_session` / `forkSession` options.

**Doc link:** https://code.claude.com/docs/en/agent-sdk/sessions

---

### Domain 1 Quick Reference

| Concept | Key fact |
|---|---|
| `stop_reason: "tool_use"` | SDK drives the loop; you handle `ResultMessage` subtype |
| Subagent context | Must be passed explicitly in prompt — no automatic inheritance |
| `allowedTools` for coordinator | Must include `"Agent"` to spawn subagents |
| Hooks vs prompts | Hooks = deterministic; Prompts = probabilistic |
| `PostToolUse` | Fires AFTER tool returns — use for normalization |
| `PreToolUse` with `"deny"` | Blocks tool execution — guaranteed, not probabilistic |
| Fork | Creates new session ID; original unchanged |
| Narrow decomposition | Root cause of incomplete research coverage |

---

## Domain 2: Tool Design & MCP Integration (18%)

### 2.1 Designing Effective Tool Interfaces

**Tool descriptions are the primary mechanism for tool selection.** Claude reads descriptions — not code — to decide which tool to call. Minimal descriptions lead to unreliable selection, especially when multiple tools accept similar inputs.

**Bad tool descriptions (cause misrouting):**
```python
tools = [
    {"name": "analyze_content", "description": "Analyzes content"},
    {"name": "analyze_document", "description": "Analyzes documents"},
]
# Result: Claude can't distinguish these — will misroute frequently
```

**Good tool descriptions (differentiated, with examples and boundaries):**
```python
tools = [
    {
        "name": "extract_web_results",
        "description": """Extracts structured data from web search result pages.
        
        Use when: Processing HTML/text from web URLs, news articles, blog posts.
        Input format: Raw HTML or plain text from a web page.
        Output: Structured JSON with title, author, date, key claims, source URL.
        
        Do NOT use for: PDF documents, database records, API responses.
        Instead use: extract_document_data for PDFs, query_database for records."""
    },
    {
        "name": "extract_document_data", 
        "description": """Extracts structured data from documents (PDF, Word, research papers).
        
        Use when: Processing academic papers, reports, contracts, whitepapers.
        Input format: Document content as text or base64.
        Output: Structured JSON with sections, citations, methodology, findings.
        
        Do NOT use for: Web pages or HTML content.
        Instead use: extract_web_results for web content."""
    }
]
```

**Splitting generic tools into purpose-specific ones:**
```python
# Instead of one generic analyze_document:
tools = [
    {"name": "extract_data_points",    "description": "Extracts quantitative data points, statistics, and measurements"},
    {"name": "summarize_content",      "description": "Creates concise summaries of document content"},
    {"name": "verify_claim_against_source", "description": "Checks whether a specific claim is supported by source text"},
]
```

**Official docs update — `input_examples`:** For complex tools with nested objects, optional parameters, or format-sensitive inputs, you can provide `input_examples` alongside the schema. These are secondary to descriptions, not a replacement for them.

```json
{
  "name": "get_weather",
  "description": "Get the current weather for a location. Use for live weather lookups, not forecasts.",
  "input_schema": {
    "type": "object",
    "properties": {
      "location": {"type": "string"},
      "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]}
    },
    "required": ["location"]
  },
  "input_examples": [
    {"location": "San Francisco, CA", "unit": "fahrenheit"},
    {"location": "Melbourne, VIC", "unit": "celsius"}
  ]
}
```

**System prompt keyword interference:** The wording of your system prompt can override well-written tool descriptions. Example: a system prompt saying "always check customer records before orders" creates an unintended association between "customer" and `get_customer` tool — even for order queries. Review system prompts for inadvertent keyword-sensitive associations.

**Renaming tools to eliminate overlap:**
- `analyze_content` → `extract_web_results` (web-specific name + description)
- `lookup` → `lookup_order` vs `get_customer` (clear purpose in name)

**Doc link:** https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview

---

### 2.2 Structured Error Responses for MCP Tools

**The `isError` flag pattern:** MCP tools communicate failures through the `isError` flag in their response, not by raising exceptions that terminate the agent.

**Error categories:**

| Category | When | Agent action |
|---|---|---|
| `transient` | Network timeout, service temporarily unavailable | Retry with backoff |
| `validation` | Invalid input, malformed request | Do not retry — fix the input |
| `business` | Policy violation, insufficient funds | Do not retry — explain to user |
| `permission` | Unauthorized, access denied | Do not retry — escalate or inform |

**Bad error response (agent can't make recovery decisions):**
```json
{
  "isError": true,
  "content": [{"type": "text", "text": "Operation failed"}]
}
```

**Good error response (structured metadata enables intelligent recovery):**
```json
{
  "isError": true,
  "content": [{
    "type": "text",
    "text": "Order lookup failed: Database connection timeout after 5000ms",
    "errorCategory": "transient",
    "isRetryable": true,
    "retryAfterMs": 2000,
    "attemptedQuery": {"customer_id": "C-12345", "order_status": "pending"},
    "partialResults": null
  }]
}
```

**Business rule violation (not retryable):**
```json
{
  "isError": true,
  "content": [{
    "type": "text",
    "text": "Refund denied: Order #98765 is outside the 30-day return window (order date: 2024-11-01).",
    "errorCategory": "business",
    "isRetryable": false,
    "customerMessage": "I'm sorry, but this order is no longer eligible for a refund as it was placed more than 30 days ago."
  }]
}
```

**Access failure vs valid empty result — critical distinction:**
```json
// Access FAILURE (search system down) — agent should consider retry/alternative
{
  "isError": true,
  "content": [{"type": "text", "text": "Search service unavailable", "errorCategory": "transient"}]
}

// Valid EMPTY RESULT (no matching orders) — NOT an error, agent should tell customer
{
  "isError": false,
  "content": [{"type": "text", "text": "No orders found for customer C-12345 with status 'pending'"}]
}
```

**Subagent error propagation:** Subagents should implement local recovery for transient failures. Only propagate errors that cannot be resolved locally, and include what was attempted and partial results.

**Anti-patterns:**
- Silently returning empty results as success (masks failures, prevents recovery)
- Terminating the entire workflow on a single subagent failure
- Generic "Operation failed" messages that hide the error category

**Doc link:** https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview

---

### 2.3 Tool Distribution and `tool_choice` Configuration

**Too many tools degrades reliability:** Giving an agent 18 tools instead of 4-5 increases decision complexity, leading to misuse of tools outside the agent's specialization.

**Principle of least privilege for tools:**
```python
agents = {
    "web-searcher": AgentDefinition(
        tools=["WebSearch", "WebFetch"],  # Only web tools
        # NOT: Read, Edit, Bash, Grep — searcher doesn't need these
    ),
    "doc-analyzer": AgentDefinition(
        tools=["Read", "Grep", "Glob"],  # Only read tools
        # NOT: WebSearch, Bash — analyzer works on local docs
    ),
    "synthesizer": AgentDefinition(
        tools=["Read", "verify_fact"],  # Read + scoped cross-role tool
        # verify_fact handles 85% of simple fact checks
        # Complex verifications routed through coordinator
    ),
}
```

**Replacing generic tools with constrained alternatives:**
```python
# Instead of generic fetch_url (can fetch anything):
tools = [
    {
        "name": "load_document",
        "description": "Loads a document from validated document storage only. Validates URL against approved document storage domains before fetching.",
        # Internally validates URL — prevents fetching arbitrary URLs
    }
]
```

**`tool_choice` options:**

| Value | Behavior | Use case |
|---|---|---|
| `"auto"` (default) | Claude decides — may return text instead of tool call | Normal usage |
| `"any"` | Claude MUST call a tool (any tool) | When you need guaranteed structured output, not prose |
| `{"type": "tool", "name": "extract_metadata"}` | Claude MUST call this specific tool | Force a specific extraction to happen first |
| `"none"` | Claude may not call tools at all | Disable tool use even when tools are provided |

**Guaranteeing a specific tool runs first:**
```python
# Step 1: Force metadata extraction
response1 = client.messages.create(
    model="claude-sonnet-4-6",
    tools=[extract_metadata_tool, enrich_data_tool],
    tool_choice={"type": "tool", "name": "extract_metadata"},
    messages=[{"role": "user", "content": document_content}]
)

# Step 2: Now run enrichment with extracted metadata as context
response2 = client.messages.create(
    model="claude-sonnet-4-6",
    tools=[enrich_data_tool],
    tool_choice="auto",
    messages=[
        {"role": "user", "content": document_content},
        {"role": "assistant", "content": response1.content},
        {"role": "user", "content": [{"type": "tool_result", ...}]}
    ]
)
```

**Providing scoped cross-role tools for high-frequency needs:**
The synthesis agent handles 85% of fact verifications itself (simple, fast). The remaining 15% (complex) routes through the coordinator to the web-searcher. This eliminates 85% of round-trip overhead without violating the separation of concerns for complex cases.

**Official docs nuances that are easy to miss:**
- With `tool_choice: "any"` or forced tool selection, Claude is prefilled to emit a tool call, so you should not expect a natural-language preamble before `tool_use`.
- Forced tool use (`"any"` or a specific `"tool"`) is incompatible with extended thinking; use `"auto"` or `"none"` in that case.
- `strict: true` on tools plus `tool_choice: "any"` is the strongest official pattern when you need both a guaranteed tool call and schema-conformant inputs.

**Doc link:** https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview

---

### 2.4 MCP Server Integration

**MCP scoping:**

| Scope | Location | Shared via version control? | Use for |
|---|---|---|---|
| Project (shared team) | `.mcp.json` in project root | Yes | Team tooling (GitHub, Jira, databases) |
| User (personal) | `~/.claude.json` | No | Personal/experimental servers |

**Project `.mcp.json` with environment variable expansion:**
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "database": {
      "command": "python",
      "args": ["-m", "mcp_server_db"],
      "env": {
        "DB_CONNECTION_STRING": "${DB_CONNECTION_STRING}"
      }
    }
  }
}
```

Never commit secrets directly. Always use `${ENV_VAR}` syntax so each developer provides their own credentials via environment variables.

**Personal server in `~/.claude.json`:**
```json
{
  "mcpServers": {
    "my-experimental-tool": {
      "command": "node",
      "args": ["/Users/me/dev/my-mcp-server/index.js"]
    }
  }
}
```

**All configured MCP servers are discovered at connection time** and available simultaneously. The agent can use tools from multiple servers in the same session.

**MCP Resources vs Tools:**
- **Tools** = executable functions (take action, query data on demand)
- **Resources** = content catalogs (expose available data without tool calls)
- **Naming tip:** prefer stable, descriptive, `snake_case` names for MCP resources so catalogs are predictable and easy to reference across tools, prompts, and agent outputs
- **Official MCP nuance:** resources are application-driven. Hosts decide how to surface, search, select, or auto-include them. The protocol does not require one specific UX pattern.
- **Protocol concept to know:** resources are identified by URIs and are discovered separately from tools.

```
# Resource: expose what's available upfront
resource: issue_catalog
  → Returns: list of open issues with summaries
  → Benefit: Agent sees available data without exploratory tool calls

# Tool: fetch specific data on demand
tool: get_issue_detail
  → Input: issue_id
  → Returns: full issue details
```

**Enhancing MCP tool descriptions:** If your MCP tool has a weak description, the agent will prefer built-in tools (like Grep) over the more capable MCP tool. Enhance descriptions to explain capabilities, outputs, and when to use vs alternatives.

**Community vs custom servers:** Use existing community MCP servers for standard integrations (GitHub, Slack, Jira). Only build custom servers for team-specific workflows not covered by existing servers.

**Doc link:** https://code.claude.com/docs/en/mcp

---

### 2.5 Built-in Tools: Read, Write, Edit, Bash, Grep, Glob

**Tool selection matrix:**

| Task | Correct tool | Why |
|---|---|---|
| Find files by name/extension | `Glob` | Pattern matching against file paths |
| Search code for a pattern | `Grep` | Regex search in file contents |
| Read a full file | `Read` | Returns complete file content |
| Make a targeted change | `Edit` | Finds unique anchor text, replaces |
| Modify when Edit fails | `Read` → `Write` | Fallback when no unique anchor text |
| Run a command | `Bash` | Shell execution |

**Glob patterns:**
```
**/*.test.tsx        → All test files, any directory
src/api/**/*         → Everything under src/api/
*.md                 → Markdown at project root
src/components/*.tsx → Components in specific directory
```

**Edit failure fallback:**
```python
# Edit requires UNIQUE anchor text — fails if text appears multiple times
# When Edit can't find a unique match:
# 1. Read the full file
# 2. Make changes in memory
# 3. Write the entire file back
```

**Incremental codebase exploration strategy:**
```
1. Grep for entry points (e.g., grep "export default" in index files)
2. Read the entry point file to understand imports
3. Follow imports — Read each imported module
4. Don't read all files upfront — explore incrementally
```

**Tracing function usage across wrappers:**
```
1. Identify all exported names from a module (grep the export statements)
2. Search for each export name across the codebase (grep)
3. Follow the call chain through wrapper modules
```

**Doc link:** https://code.claude.com/docs/en/agent-sdk/agent-loop (tools section)

---

### Domain 2 Quick Reference

| Concept | Key fact |
|---|---|
| Tool descriptions | Primary mechanism for LLM tool selection |
| `isError` flag | MCP error communication pattern — use structured metadata |
| Transient errors | Retryable — include `isRetryable: true` |
| Business errors | NOT retryable — include customer-friendly message |
| Access failure vs empty result | Empty result is NOT an error |
| Too many tools | 18 tools >> 4-5 tools degrades selection reliability |
| `tool_choice: "any"` | Guarantees tool call (no prose response) |
| Forced tool_choice | `{"type": "tool", "name": "x"}` — runs specific tool first |
| `.mcp.json` | Project-scoped, version-controlled team MCP config |
| `~/.claude.json` | Personal MCP server config |
| Resources | Content catalogs — reduce exploratory tool calls |
| Glob | File pattern matching (name/extension) |
| Grep | Content search (file contents) |

---

## Domain 3: Claude Code Configuration & Workflows (20%)

### 3.1 CLAUDE.md Configuration Hierarchy

**The loading hierarchy (most-specific wins):**

| Level | Location | Scope | Shared? |
|---|---|---|---|
| Managed policy | `/Library/Application Support/ClaudeCode/CLAUDE.md` (macOS) | All users in org | Via IT/MDM |
| Project | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Team | Via version control |
| Local | `./CLAUDE.local.md` | Personal + current project | No (add to .gitignore) |
| User | `~/.claude/CLAUDE.md` | Personal + all projects | No |

**Critical exam fact:** Instructions in `~/.claude/CLAUDE.md` (user-level) are NOT shared with teammates via version control. If a new team member isn't getting the right instructions, the issue is that instructions are in user-level config instead of project-level.

**Loading behavior:**
- Files are concatenated (not overriding) — all applicable files are loaded
- Files in the directory hierarchy above cwd are loaded at launch
- Files in subdirectories load on demand when Claude reads files in those directories
- `CLAUDE.local.md` loads after `CLAUDE.md` at each level (personal notes override project at same level)
- Official docs note that `CLAUDE.md` content is delivered as context after the system prompt, not as part of the system prompt itself
- If you need true CLI-side system-prompt additions for one session, use `--append-system-prompt` or `--append-system-prompt-file`; that is a different mechanism from `CLAUDE.md`

**If your repo already uses `AGENTS.md`:**
Claude Code reads `CLAUDE.md`, not `AGENTS.md`. The official pattern is to create a `CLAUDE.md` that imports `@AGENTS.md`, then add Claude-specific guidance below that import.

```markdown
@AGENTS.md

## Claude Code

Use plan mode for changes under `src/billing/`.
```

**`@path` syntax for modular organization:**
```markdown
# CLAUDE.md in packages/api/

See @README for project overview.

## Standards
@../../docs/api-conventions.md
@../../docs/error-handling-standards.md
@../../docs/testing-conventions.md
```

**Splitting large CLAUDE.md into `.claude/rules/`:**
```
.claude/
├── CLAUDE.md              # Universal project instructions (short)
└── rules/
    ├── testing.md         # Testing conventions
    ├── api-conventions.md # API design rules
    ├── security.md        # Security requirements
    └── deployment.md      # Deployment procedures
```

Rules in `.claude/rules/` without `paths` frontmatter load at launch (same as CLAUDE.md). Rules with `paths` frontmatter load conditionally.

**The `/memory` command:** Shows which memory files are currently loaded in your session, lets you inspect auto memory, and lets you toggle auto memory on or off. Use it to diagnose why instructions aren't being followed — if a file isn't listed, Claude can't see it.

**Auto memory — what matters for the exam:**
- Auto memory is machine-local and project-scoped
- `MEMORY.md` is the entrypoint; detailed notes move into topic files
- Only the first part of `MEMORY.md` is loaded automatically at session start; long detailed memory is read on demand

**Additional directories nuance:** `--add-dir` gives Claude access to extra directories, but their memory files are not loaded by default. Official docs call out `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` when you want memory files from those directories loaded too.

**Best practices for CLAUDE.md:**
- Target under 200 lines per file — longer files reduce adherence
- Specific instructions work better than vague ones: "Use 2-space indentation" not "Format code well"
- Avoid contradictions across files — Claude may pick one arbitrarily
- HTML comments (`<!-- like this -->`) are stripped before injection — use for maintainer notes

**What survives `/compact`:**

| Mechanism | After compaction |
|---|---|
| System prompt and output style | Unchanged |
| Project-root `CLAUDE.md` and unscoped rules | Re-injected from disk |
| Auto memory | Re-injected from disk |
| Rules with `paths:` frontmatter | Lost until a matching file is read again |
| Nested `CLAUDE.md` files in subdirectories | Lost until a file in that subdirectory is read again |
| Invoked skill bodies | Re-injected with token caps |

**Doc link:** https://code.claude.com/docs/en/memory

---

### 3.2 Custom Slash Commands and Skills

**Scoping:**

| Type | Location | Shared? | Use for |
|---|---|---|---|
| Project commands | `.claude/commands/` | Yes (via git) | Team-wide workflows |
| User commands | `~/.claude/commands/` | No | Personal workflows |
| Project skills | `.claude/skills/<name>/SKILL.md` | Yes (via git) | Team workflows with frontmatter features |
| User skills | `~/.claude/skills/<name>/SKILL.md` | No | Personal skills |

**Note:** `.claude/commands/` files and `.claude/skills/` files are functionally equivalent — both create slash commands. Skills add features: supporting files, more frontmatter options, and auto-invocation by Claude.

**SKILL.md frontmatter reference:**

```yaml
---
name: review-pr
description: Reviews a pull request for security, quality, and test coverage. Use when asked to review a PR or check code quality.
argument-hint: [PR number or diff]
context: fork
allowed-tools: Read Grep Glob Bash(gh pr *)
disable-model-invocation: false
---

Review the pull request $ARGUMENTS:

1. Check for security vulnerabilities
2. Assess code quality and maintainability  
3. Verify test coverage is adequate
4. Check for documentation gaps

Format findings as: location | issue | severity | suggested fix
```

**Key frontmatter fields:**

| Field | Purpose |
|---|---|
| `description` | Tells Claude when to auto-invoke the skill |
| `argument-hint` | Shown during tab completion: `[filename] [format]` |
| `context: fork` | Runs skill in isolated subagent — output doesn't pollute main conversation |
| `allowed-tools` | Pre-approved tools during skill execution (no permission prompts) |
| `disable-model-invocation: true` | Only you can invoke — Claude won't auto-trigger |
| `user-invocable: false` | Claude can invoke but it's hidden from / menu |

**When to use `context: fork`:**
- Verbose output skills (codebase analysis, deep research) — keeps main context clean
- Exploratory skills (brainstorming alternatives) — isolates divergent thinking
- Skills with side effects — prevents intermediate steps from polluting session

**Skills vs CLAUDE.md:**

| Use | When |
|---|---|
| Skills | On-demand workflows, task-specific procedures, verbose reference material |
| CLAUDE.md | Always-loaded universal standards (coding style, conventions, build commands) |

**Creating a project-scoped `/review` command available to all developers:**
```
.claude/
└── commands/
    └── review.md   # or
skills/
└── review/
    └── SKILL.md
```
Both approaches create `/review` and are version-controlled — available after `git clone`.

**Personal skill variant (avoid affecting teammates):**
Create at `~/.claude/skills/review-strict/SKILL.md` with a different name — personal skills don't override project skills unless they share the same name.

**Doc link:** https://code.claude.com/docs/en/skills

---

### 3.3 Path-Specific Rules for Conditional Convention Loading

**Path-specific rules in `.claude/rules/`:**

```markdown
---
paths:
  - "src/api/**/*.ts"
---

# API Development Rules

All API endpoints must include input validation.
Use the standard error response format: { error: string, code: string, details?: object }
Include OpenAPI documentation comments on every handler.
```

```markdown
---
paths:
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "tests/**/*"
---

# Testing Conventions

Use describe/it block structure.
Mock external services with jest.mock().
Every test file must have at least one assertion.
Test files must not import from other test files.
```

**Why path-specific rules outperform directory-level CLAUDE.md for cross-directory conventions:**

Test files spread throughout the codebase (`Button.test.tsx` next to `Button.tsx`, `auth.test.ts` next to `auth.ts`) cannot be covered by a single directory-level `CLAUDE.md`. A `.claude/rules/testing.md` with `paths: ["**/*.test.tsx"]` covers ALL test files regardless of directory.

**Path pattern examples:**

| Pattern | Matches |
|---|---|
| `terraform/**/*` | All files under terraform/ |
| `**/*.test.tsx` | All test files anywhere |
| `src/components/*.tsx` | Components in specific dir |
| `*.md` | Markdown at project root |
| `src/**/*.{ts,tsx}` | All TS/TSX under src/ |

**Benefits of path-specific rules:**
1. Only load into context when relevant — reduces token usage
2. Can cover files spread across many directories
3. Don't require restructuring the codebase

**Doc link:** https://code.claude.com/docs/en/memory (`.claude/rules/` section)

---

### 3.4 Plan Mode vs Direct Execution

**Decision framework:**

| Situation | Use |
|---|---|
| Large-scale architectural change (e.g., monolith → microservices) | Plan mode |
| Library migration affecting 45+ files | Plan mode |
| Choosing between integration approaches with different infrastructure requirements | Plan mode |
| Multi-file changes where approach isn't clear | Plan mode |
| Single-file bug fix with clear stack trace | Direct execution |
| Adding a date validation conditional | Direct execution |
| Well-understood change with clear scope | Direct execution |

**Why plan mode for complex tasks:**
- Enables safe codebase exploration and design BEFORE committing to changes
- Prevents costly rework when dependencies are discovered mid-implementation
- Multiple valid approaches exist — plan mode helps choose the best one

**Permission mode `"plan"`:**
```python
options = ClaudeAgentOptions(
    permission_mode="plan"  # No tool execution — Claude produces a plan for review
)
```

**The Explore subagent for verbose discovery:**
When the discovery phase of a task will produce verbose output (reading hundreds of files, running many searches), use the Explore subagent to isolate that output. The main agent receives a concise summary, not the full transcript.

```python
# The coordinator spawns an Explore subagent for codebase mapping
# Explore reads files, runs Grep, follows imports
# Main agent receives: "Found 45 service files in src/services/. Key dependency: auth.ts..."
# Not: 50,000 tokens of file contents
```

**Combining plan mode with direct execution:**
```
Phase 1 (Plan mode): Explore codebase, understand dependencies, design approach
Phase 2 (Direct execution): Implement the planned approach
```

**Doc link:** https://code.claude.com/docs/en/agent-sdk/agent-loop (permission mode section)

---

### 3.5 Iterative Refinement Techniques

**When prose descriptions are inconsistently interpreted — use concrete input/output examples:**

```
BAD: "Transform dates to a consistent format"

GOOD: Provide 2-3 examples:
  Input:  "January 15th, 2025" → Output: "2025-01-15"
  Input:  "15/01/25"           → Output: "2025-01-15"  
  Input:  "Jan 15 2025"        → Output: "2025-01-15"
```

**Test-driven iteration:**
1. Write test suite first (covering expected behavior, edge cases, performance)
2. Share implementation prompt
3. Run tests
4. Inspect intermediates at each step — partial outputs, failing cases, and validation artifacts
5. Share test failures with Claude → iterate until passing

**The interview pattern:**
Have Claude ask questions BEFORE implementing in unfamiliar domains.

```
Instead of: "Implement a Redis cache for our user sessions"

Try: "Before implementing a Redis cache for user sessions, 
      ask me the questions you'd need answered to make the right design decisions"

Claude asks: 
- What's your cache invalidation strategy when users update their profile?
- Should sessions survive Redis restarts?
- What's the expected session size? (affects memory planning)
- Do you need distributed locking for concurrent session updates?
```

**Single message vs sequential iteration:**

| Issue type | Approach |
|---|---|
| Interacting issues (fixes interact) | One detailed message with all issues |
| Independent issues | Sequential — fix one, verify, then next |

Example of interacting: "Fix the null pointer exception AND refactor the validation logic" — these interact because the null check may be inside the validation logic.

**Specific test cases for edge cases:**
```
The migration script handles null values incorrectly.

Here's a specific failing case:
Input:  {"user_id": 123, "preferences": null, "created_at": "2025-01-01"}
Expected: {"user_id": 123, "preferences": {}, "created_at": 1735689600}
Actual: TypeError: Cannot read property 'theme' of null
```

**Doc link:** https://code.claude.com/docs/en/best-practices

---

### 3.6 CI/CD Pipeline Integration

**The `-p` / `--print` flag is the ONLY correct way to run Claude Code non-interactively in CI:**

```bash
# WRONG — hangs waiting for interactive input
claude "Review this PR for security issues"

# CORRECT — non-interactive, exits after completing
claude -p "Review this PR for security issues"

# With tools pre-approved
claude -p "Run the test suite and fix failures" --allowedTools "Bash,Read,Edit"
```

**Structured output for CI:**
```bash
# Output conforming to JSON schema — machine-parseable for automated PR comments
claude -p "Analyze this PR for security vulnerabilities" \
  --output-format json \
  --json-schema '{
    "type": "object",
    "properties": {
      "findings": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "file": {"type": "string"},
            "line": {"type": "integer"},
            "severity": {"type": "string", "enum": ["critical", "high", "medium", "low"]},
            "issue": {"type": "string"},
            "suggested_fix": {"type": "string"}
          }
        }
      }
    }
  }'

# Parse with jq
| jq '.structured_output.findings[] | select(.severity == "critical")'
```

**Official docs nuance:** when using `--output-format json` with `--json-schema`, the CLI returns request metadata plus your schema-conformant result in the `structured_output` field.

**`CLAUDE.md` provides project context to CI-invoked Claude Code:**
```markdown
# CI Review Instructions

## Testing Standards
- Unit tests required for all business logic
- Integration tests for API endpoints
- No mocking of database connections in integration tests

## Available Test Fixtures
- `fixtures/users.json` — sample user objects
- `fixtures/orders.json` — sample order data

## Review Criteria
- Flag security issues (SQL injection, XSS, unvalidated input)
- Flag missing error handling in API handlers
- Flag test coverage gaps in business logic
- Skip: style issues, minor naming conventions
```

**Session context isolation for reviews:** The same Claude session that generated code is less effective at reviewing its own changes — it retains reasoning context and is less likely to question its own decisions. Use an independent review instance.

**Avoiding duplicate PR comments:**
```bash
# Include prior review context so Claude only reports NEW issues
claude -p "Review the new changes in this PR.

Prior review findings (already commented on PR):
$(cat previous-findings.json)

Only report issues that are NEW or still unaddressed from the prior review." \
  --output-format json
```

**Avoiding duplicate test suggestions:**
```bash
# Provide existing tests as context
claude -p "Generate tests for auth.py.

Existing test file auth.test.py is provided below. 
Do NOT suggest tests that duplicate existing scenarios.
$(cat auth.test.py)" \
  --output-format json
```

**The `--bare` flag:** Skips auto-discovery of hooks, skills, MCP servers, and CLAUDE.md. Useful in CI when you want identical behavior on every machine regardless of local configuration.

```bash
claude --bare -p "Summarize this file" --allowedTools "Read"
```

**Official CI integration study points:**
- GitHub Actions wraps the same headless pattern: repository `CLAUDE.md` still shapes behavior, while workflow-specific behavior comes from the action `prompt` plus `claude_args`.
- GitLab CI/CD uses the same core setup: store `ANTHROPIC_API_KEY` as a masked variable, run `claude -p ...` in the job, and optionally expose GitLab operations through an MCP server such as `mcp__gitlab`.
- Exam takeaway: GitHub Actions, GitLab, and raw CLI all reduce to the same ideas — non-interactive invocation, explicit tool/permission control, and repo-scoped context.

**Doc link:** https://code.claude.com/docs/en/headless

---

### Domain 3 Quick Reference

| Concept | Key fact |
|---|---|
| User-level `CLAUDE.md` | NOT shared with teammates — must use project-level |
| `@import` syntax | Modularize CLAUDE.md — import relevant standards files |
| `/memory` command | Verify which memory files are loaded in current session |
| `.claude/rules/` with `paths` | Conditional rules — load only when editing matching files |
| `**/*.test.tsx` | Glob for all test files regardless of directory |
| `context: fork` | Skill runs in isolated subagent — keeps main context clean |
| `argument-hint` | Shown during tab completion for skill arguments |
| `--fork-session` | CLI-side session fork — related to but distinct from skill `context: fork` |
| `--append-system-prompt` | Adds session-level system-prompt guidance; different from `CLAUDE.md` |
| `/context` | Inspect current context / memory utilization |
| `/branch [name]` | Duplicate current session state into a named branch |
| `/effort [level]` | Adjust reasoning depth vs latency / token spend |
| Plan mode | For complex, multi-file, architectural decisions |
| Direct execution | For clear-scope, single-file, well-understood changes |
| `-p` / `--print` flag | The ONLY correct way to run Claude Code non-interactively |
| `--output-format json --json-schema` | Machine-parseable structured output for CI |
| Session isolation | Use independent Claude instance for reviewing own-generated code |

---

## Domain 4: Prompt Engineering & Structured Output (20%)

### 4.1 Explicit Criteria to Reduce False Positives

**Vague instructions fail to improve precision:**
```
BAD: "Be conservative in your findings"
BAD: "Only report high-confidence issues"
BAD: "Focus on important issues"

WHY THESE FAIL: Claude's interpretation of "conservative" and "high-confidence" 
is subjective and not reliably calibrated to your actual standards.
```

**Specific categorical criteria work:**
```
GOOD: "Report ONLY the following categories:
- Security vulnerabilities (SQL injection, XSS, authentication bypass, exposed secrets)
- Functional bugs (incorrect business logic, missing null checks that cause exceptions)
- Data integrity issues (missing transactions, race conditions)

DO NOT REPORT:
- Style issues or naming conventions
- Patterns that differ from your personal preference but work correctly
- Local code patterns that are intentional (e.g., verbose error messages in this codebase)
- Theoretical concerns without clear exploit paths"
```

**Explicit severity criteria with code examples:**
```
CRITICAL: Code that can be exploited without authentication
  Example: SELECT * FROM users WHERE email = '{user_input}'  (SQL injection)

HIGH: Authentication/authorization bypass or data corruption
  Example: Missing admin check before deleting user records

MEDIUM: Logic errors that cause incorrect results in specific scenarios
  Example: date.getMonth() without +1 causing off-by-one in month display

LOW: Minor issues with easy workarounds
  Example: Inefficient loop that could be replaced with a built-in
```

**Managing false positive categories:** If one category (e.g., "documentation gaps") has a very high false positive rate, it undermines developer trust in all other categories — even the accurate ones. Temporarily disable or isolate high-FP categories while improving the prompts for that category.

**Doc link:** https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview

---

### 4.2 Few-Shot Prompting for Consistency and Quality

**Few-shot examples are the most effective technique for:**
1. Achieving consistently formatted output when detailed instructions produce inconsistency
2. Demonstrating how to handle ambiguous cases
3. Reducing hallucination in extraction tasks
4. Distinguishing acceptable patterns from genuine issues

**Example: Few-shot for code review output format:**
```python
system_prompt = """You are a code reviewer. Format every finding exactly as shown in these examples:

EXAMPLE 1:
File: src/auth/login.py, Line 47
Issue: SQL injection vulnerability — user input directly concatenated into SQL query
Severity: CRITICAL
Suggested fix: Use parameterized queries: cursor.execute("SELECT * FROM users WHERE email = %s", (email,))

EXAMPLE 2:
File: src/api/orders.py, Line 123  
Issue: Missing null check — order.customer can be None if order was created before customer verification
Severity: HIGH
Suggested fix: Add guard: if order.customer is None: return error_response("Customer not found")

EXAMPLE 3 (acceptable pattern — do NOT flag):
File: src/utils/dates.py, Line 34
Pattern: Explicit timezone conversion on every datetime operation
Note: This is intentional — the codebase deliberately avoids implicit timezone handling
Action: Skip — this is a documented intentional pattern, not a bug

Now review the provided code using this exact format."""
```

**Few-shot for ambiguous tool selection:**
```python
system_prompt = """When selecting between lookup_order and get_customer, use these examples:

User: "Check order #12345"
→ Call: lookup_order(order_id="12345")
Reasoning: User referenced an order ID directly — lookup_order is for order data.

User: "What's the status of my account?"
→ Call: get_customer(identifier=<from context>)
Reasoning: User asked about their account — get_customer is for account/profile data.

User: "Did my recent order ship?"
→ Call: get_customer(identifier=<from context>) THEN lookup_order(customer_id=<result>)
Reasoning: No order ID provided — must first identify the customer, then find their recent order."""
```

**Few-shot for extraction with varied document structures:**
```python
system_prompt = """Extract the author and date from documents. Documents vary in structure:

EXAMPLE 1 (academic paper):
Document: "...Published by Jane Smith (j.smith@university.edu) in March 2025..."
Result: {"author": "Jane Smith", "date": "2025-03"}

EXAMPLE 2 (blog post):
Document: "Posted on January 15, 2025 | By @janesmith"
Result: {"author": "janesmith", "date": "2025-01-15"}

EXAMPLE 3 (report with no author):
Document: "Q4 2024 Annual Report — Finance Division"
Result: {"author": null, "date": "2024-Q4"}

EXAMPLE 4 (informal measurement — handle gracefully):
Document: "The component weighs about 2-3 kilos"
Result: {"weight_kg": null, "weight_note": "approximately 2-3 kg, not exact"}"""
```

**Target 2-4 few-shot examples.** More than 6-8 adds token overhead without proportional benefit. Focus examples on the ambiguous cases, not the obvious ones.

**Doc link:** https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices

---

### 4.3 Structured Output via Tool Use and JSON Schemas

**`tool_use` with JSON schemas is the most reliable approach** for guaranteed schema-compliant output — it eliminates JSON syntax errors (malformed JSON, missing brackets, unescaped characters).

**Defining an extraction tool:**
```python
import anthropic

client = anthropic.Anthropic()

extraction_tool = {
    "name": "extract_invoice_data",
    "description": "Extracts structured data from invoice documents",
    "input_schema": {
        "type": "object",
        "properties": {
            "invoice_number": {
                "type": "string",
                "description": "Invoice identifier"
            },
            "total_amount": {
                "type": ["number", "null"],  # nullable — may not exist
                "description": "Total invoice amount in source currency. Null if not found."
            },
            "currency": {
                "type": ["string", "null"],
                "description": "ISO 4217 currency code (USD, EUR, etc.) or null if unclear"
            },
            "payment_terms": {
                "type": "string",
                "enum": ["net-30", "net-60", "net-90", "immediate", "other"],
                "description": "Payment terms classification"
            },
            "payment_terms_detail": {
                "type": ["string", "null"],
                "description": "If payment_terms is 'other', describe the actual terms here"
            },
            "confidence": {
                "type": "string",
                "enum": ["high", "medium", "low"],
                "description": "Overall extraction confidence"
            }
        },
        "required": ["invoice_number", "payment_terms", "confidence"]
        # total_amount, currency, payment_terms_detail are optional (nullable)
    }
}

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    tools=[extraction_tool],
    tool_choice={"type": "tool", "name": "extract_invoice_data"},  # Force this tool
    messages=[{"role": "user", "content": invoice_text}]
)

# Extract from tool_use block
for block in response.content:
    if block.type == "tool_use":
        extracted_data = block.input
        print(extracted_data)
```

**`tool_choice` behavior:**

| Value | Behavior | Risk |
|---|---|---|
| `"auto"` | Claude decides — may return prose instead of calling tool | Claude might say "I found an invoice for $500" instead of filling schema |
| `"any"` | Must call a tool (any tool) | Safe when you have one extraction tool |
| `{"type": "tool", "name": "..."}` | Must call THIS specific tool | Guaranteed — best for mandatory extractions |

**When to use `tool_choice: "any"`:**
When you have multiple extraction schemas and the document type is unknown:
```python
tool_choice="any"  # Claude picks invoice_extractor vs receipt_extractor based on document
```

**Nullable fields prevent hallucination:**
```json
// BAD — required field forces model to fabricate when data is absent
"vendor_address": {"type": "string"}  // Model makes up an address

// GOOD — nullable allows honest "not found"
"vendor_address": {"type": ["string", "null"]}  // Model returns null
```

**`"other"` + detail string for extensible enums:**
```json
{
  "document_type": {
    "type": "string",
    "enum": ["invoice", "receipt", "purchase_order", "credit_note", "other"]
  },
  "document_type_detail": {
    "type": ["string", "null"],
    "description": "Required when document_type is 'other' — describe the actual type"
  }
}
```

**`"unclear"` enum value for ambiguous cases:**
```json
{
  "sentiment": {
    "type": "string",
    "enum": ["positive", "negative", "neutral", "unclear"]
    // "unclear" when insufficient signal — prevents forced classification
  }
}
```

**What strict JSON schemas guarantee vs what they don't:**
- ✅ Eliminate syntax errors (malformed JSON)
- ✅ Guarantee required fields are present
- ✅ Guarantee enum values are valid
- ❌ Do NOT prevent semantic errors (line items don't sum to total, wrong field)
- ❌ Do NOT prevent misclassification (putting a number in the wrong field)

**Extended thinking with tool use — official constraints:**
- Only `tool_choice: "auto"` and `tool_choice: "none"` work with extended thinking. Forced tool use (`"any"` or a specific tool) is incompatible and returns an error.
- In raw API tool loops, you must pass the last assistant message's `thinking` blocks back unmodified when returning `tool_result` content, or Claude loses reasoning continuity.
- Previous thinking blocks from earlier turns do not accumulate in context usage the same way normal content does; the API ignores them for context-window calculation.

**Format normalization alongside strict schemas:**
```python
system_prompt = """Extract invoice data using the provided tool.

Format normalization rules:
- Dates: normalize to YYYY-MM-DD regardless of source format
- Amounts: convert all amounts to the currency code's minor units (cents for USD)
- Phone numbers: strip all non-digit characters
- Company names: use exact casing from document, do not normalize"""
```

**Doc link:** https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview

---

### 4.4 Validation, Retry, and Feedback Loops

**Retry-with-error-feedback pattern:**

```python
import anthropic
import json

client = anthropic.Anthropic()

def extract_with_retry(document: str, max_retries: int = 3) -> dict:
    messages = [{"role": "user", "content": document}]
    
    for attempt in range(max_retries):
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            tools=[extraction_tool],
            tool_choice={"type": "tool", "name": "extract_invoice_data"},
            messages=messages
        )
        
        # Extract result
        for block in response.content:
            if block.type == "tool_use":
                extracted = block.input
                
                # Validate semantics (beyond schema compliance)
                errors = validate_extraction(extracted)
                
                if not errors:
                    return extracted  # Success
                
                # Retry with specific error feedback
                messages.extend([
                    {"role": "assistant", "content": response.content},
                    {
                        "role": "user", 
                        "content": [{
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": f"Validation failed. Please correct these specific issues:\n{chr(10).join(errors)}\n\nOriginal document for reference:\n{document}"
                        }]
                    }
                ])
    
    raise Exception(f"Extraction failed after {max_retries} attempts")

def validate_extraction(data: dict) -> list[str]:
    errors = []
    
    # Semantic validation — schema alone can't catch these
    if data.get("line_items") and data.get("total_amount"):
        calculated = sum(item["amount"] for item in data["line_items"])
        stated = data["total_amount"]
        if abs(calculated - stated) > 0.01:
            errors.append(f"Line items sum to {calculated} but stated total is {stated}")
    
    if data.get("payment_terms") == "other" and not data.get("payment_terms_detail"):
        errors.append("payment_terms is 'other' but payment_terms_detail is missing")
    
    return errors
```

**When retries will succeed vs fail:**

| Situation | Retry effective? |
|---|---|
| Format mismatch (date as "Jan 15" instead of "2025-01-15") | ✅ Yes — formatting instruction + retry works |
| Structural output error (line items in wrong field) | ✅ Yes — specific error + retry works |
| Information absent from source document | ❌ No — model can't fabricate information that isn't there |
| External document referenced but not provided | ❌ No — model can't access what's not in context |

**Self-correction validation — detecting semantic inconsistencies:**
```python
# Add "calculated_total" to schema alongside "stated_total"
# Model computes sum of line items — flag when they don't match
{
    "stated_total": 1500.00,       # From document
    "calculated_total": 1450.00,   # Sum of line_items
    "total_conflict_detected": true # Flag discrepancy
}
```

**`detected_pattern` field for false positive analysis:**
```python
# Add to review findings schema
{
    "issue": "Unparameterized SQL query",
    "detected_pattern": "string concatenation in cursor.execute()",
    "severity": "critical"
}

# Later, when developers dismiss findings:
# Analyze dismissed findings by detected_pattern
# If "string concatenation in cursor.execute()" is always dismissed for this codebase,
# it may be using an ORM that handles escaping — adjust detection criteria
```

**Doc link:** https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview

---

### 4.5 Batch Processing Strategies

**Message Batches API specifications:**

| Property | Value |
|---|---|
| Cost savings | 50% vs synchronous API |
| Processing time | Up to 24 hours (typically < 1 hour) |
| Latency SLA | None — no guarantee |
| Multi-turn tool calling | NOT supported within a single request |
| Use `custom_id` | Correlate requests and responses |

**When to use batch vs synchronous:**

| Workflow | API | Why |
|---|---|---|
| Blocking pre-merge check (developer waits) | Synchronous | Requires sub-minute response |
| Overnight technical debt report | Batch | Latency-tolerant — 50% cost saving |
| Weekly security audit | Batch | Non-blocking, runs overnight |
| Nightly test generation | Batch | Non-blocking, results needed next morning |
| Real-time code review comment | Synchronous | Developer waiting for response |

**Batch processing with `custom_id`:**

```python
import anthropic
import json

client = anthropic.Anthropic()

# Prepare batch
requests = []
for i, document in enumerate(documents):
    requests.append({
        "custom_id": f"doc_{i}_{document['id']}",  # For correlation
        "params": {
            "model": "claude-sonnet-4-6",
            "max_tokens": 1024,
            "tools": [extraction_tool],
            "tool_choice": {"type": "tool", "name": "extract_invoice_data"},
            "messages": [{"role": "user", "content": document["content"]}]
        }
    })

# Submit batch
batch = client.beta.messages.batches.create(requests=requests)
batch_id = batch.id

# Poll for completion
import time
while True:
    batch_status = client.beta.messages.batches.retrieve(batch_id)
    if batch_status.processing_status == "ended":
        break
    time.sleep(60)  # Check every minute

# Process results — handle failures by custom_id
failed_ids = []
results = {}

for result in client.beta.messages.batches.results(batch_id):
    if result.result.type == "succeeded":
        results[result.custom_id] = result.result.message
    elif result.result.type == "errored":
        failed_ids.append(result.custom_id)
        error_type = result.result.error.type
        
        # Identify context limit failures for chunking
        if error_type == "context_too_long":
            # Resubmit with chunked document
            doc_id = result.custom_id.split("_")[-1]
            # ... chunk and resubmit
```

**SLA calculation:** If you need results within 30 hours and batch processing takes up to 24 hours, you must submit batches at most every 6 hours (30 - 24 = 6 hour submission window).

**Batch prompt refinement:** Test on a sample of 10-20 documents before batch-processing thousands. Fix prompt issues on the sample to maximize first-pass success rate and avoid expensive resubmission.

**What batch API does NOT support:** Multi-turn tool calling within a single request. If your extraction requires tool calling (getting data from an external source), you need the synchronous API.

**Doc link:** https://platform.claude.com/docs/en/build-with-claude/batch-processing

---

### 4.6 Multi-Instance and Multi-Pass Review Architectures

**Self-review limitation:** When a model reviews its own output in the same session, it retains the reasoning context from generation — making it less likely to question decisions it just made. This is not a capability limitation — it's a fundamental property of retaining context.

**Independent review instance:**
```python
# WRONG — same session reviews its own output
code = generate_code(session, requirements)
review = review_code(session, code)  # Retains "why I did it this way"

# CORRECT — independent session with no generation context
code = generate_code(session1, requirements)
review = review_code(session2, code)  # Fresh context, no prior reasoning
```

**Multi-pass review for large PRs:**
```python
# A 14-file PR reviewed in a single pass:
# - Inconsistent depth (detailed for some files, superficial for others)
# - Attention dilution (middle files get less attention)
# - Contradictions (flags pattern as bad in file 3, approves same pattern in file 11)

# Solution: Split into passes
async def review_pr(files: list[str]) -> dict:
    # Pass 1: Analyze each file independently for local issues
    local_findings = {}
    for file in files:
        findings = await analyze_file_locally(file)
        local_findings[file] = findings
    
    # Pass 2: Cross-file integration pass
    integration_findings = await analyze_cross_file_issues(
        files=files,
        local_findings=local_findings,
        focus="data flow between modules, interface contracts, shared state"
    )
    
    return merge_findings(local_findings, integration_findings)
```

**Confidence-scored findings for calibrated routing:**
```python
# Model self-reports confidence alongside each finding
schema = {
    "findings": [{
        "issue": "string",
        "severity": "string",
        "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
        "reasoning": "string"  # Why this confidence level
    }]
}

# Route based on confidence:
# high confidence → auto-comment on PR
# medium confidence → human review queue
# low confidence → discard or separate review
```

**Doc link:** https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview

---

### Domain 4 Quick Reference

| Concept | Key fact |
|---|---|
| Vague instructions | "Be conservative" fails — use specific categorical criteria |
| Few-shot examples | Most effective for consistent format AND reducing hallucination |
| `tool_choice: "auto"` | May return prose — use `"any"` or forced for guaranteed structure |
| Nullable fields | Prevent fabrication of absent values — mark optional fields as nullable |
| `"other"` + detail string | Extensible enum pattern for non-enumerated categories |
| Schema guarantees | Eliminates syntax errors; does NOT prevent semantic errors |
| Retry-with-feedback | Include original doc + failed extraction + specific errors |
| Retry won't help when | Information is absent from source document |
| Batch API | 50% cost savings, up to 24h, no latency SLA, no multi-turn tool calling |
| `custom_id` | Correlate batch request/response pairs |
| Self-review limitation | Same session retains reasoning context — use independent instance |
| Multi-pass reviews | Per-file local analysis + separate cross-file integration pass |

---

## Domain 5: Context Management & Reliability (15%)

### 5.1 Conversation Context Management

**What accumulates in context:**
- System prompt
- CLAUDE.md files
- Tool definitions
- Every turn of conversation (both sides)
- All tool inputs AND outputs

**The "lost in the middle" effect:** Models reliably process information at the beginning and end of long inputs. Information in the middle sections receives less attention. For important findings, place them at the beginning or end of inputs.

**Progressive summarization risks:** When condensing a long conversation, summaries may lose:
- Specific numbers (amounts, percentages, order numbers)
- Exact dates and deadlines
- Customer-stated expectations ("I need this fixed by Friday")
- Technical specifications

**Solution: Persistent "case facts" block:**
```python
# Extract transactional facts into a persistent structure
# Include this at the beginning of every prompt — NOT in the summarized history
case_facts = {
    "customer_id": "C-12345",
    "customer_name": "Jane Smith",
    "issue_type": "billing_dispute",
    "disputed_amount": 150.00,
    "disputed_transaction_date": "2025-03-01",
    "customer_stated_expectation": "Full refund within 48 hours",
    "case_opened": "2025-04-15T14:30:00Z"
}

prompt = f"""
## Active Case Facts (do not summarize — preserve verbatim)
{json.dumps(case_facts, indent=2)}

## Conversation Summary
{summarized_history}

## Current Customer Message
{current_message}
"""
```

**Trimming verbose tool outputs:**
```python
def trim_order_lookup(full_result: dict) -> dict:
    """Keep only return-relevant fields from a 40-field order object."""
    return {
        "order_id": full_result["order_id"],
        "order_date": full_result["order_date"],
        "status": full_result["status"],
        "total_amount": full_result["total_amount"],
        "items": full_result["items"],
        "return_eligibility": full_result["return_eligibility"],
        # Drop: shipping address, payment method, internal SKUs, warehouse codes, etc.
    }
```

**Position-aware input ordering:**
```python
# For aggregated multi-agent findings:
prompt = f"""
## Summary of Key Findings (read this first)
{key_findings_summary}  # <-- BEGINNING — gets full attention

## Detailed Search Results
### Section A: Visual Arts
{visual_arts_results}

### Section B: Music Industry  
{music_results}

### Section C: Film Production
{film_results}

## Integration Notes (cross-section patterns)
{integration_notes}  # <-- END — also gets good attention
"""
```

**Requiring metadata in structured outputs for downstream synthesis:**
```python
# Subagent must include these fields — downstream synthesis needs them
subagent_output_schema = {
    "findings": [{
        "claim": "string",
        "source_url": "string",       # For attribution
        "source_name": "string",      # Human-readable source
        "publication_date": "string", # ISO date — critical for temporal analysis
        "evidence_excerpt": "string", # Direct quote supporting claim
        "relevance_score": "number"   # For downstream prioritization
    }]
}
```

**Upstream agents → structured data instead of verbose content:**
When downstream agents have limited context budgets, modify upstream agents to return structured data (key facts, citations, relevance scores) instead of verbose content and reasoning chains.

**Doc link:** https://platform.claude.com/docs/en/build-with-claude/context-windows

---

### 5.2 Escalation and Ambiguity Resolution Patterns

**Appropriate escalation triggers:**
1. Customer explicitly requests a human agent → **escalate immediately**
2. Policy gap — policy is silent on the specific situation (not just "complex")
3. Inability to make meaningful progress after reasonable attempts
4. Policy exception required beyond agent's authority

**Immediate escalation on explicit request:**
```python
# WRONG — agent tries to resolve first despite customer's explicit request
if customer_requests_human and issue_seems_simple:
    attempt_resolution_first()  # Don't do this

# CORRECT — honor explicit requests immediately
if customer_requests_human:
    escalate_to_human(reason="Customer explicitly requested human agent")
```

**Acknowledging frustration while offering resolution:**
```
Customer: "This is ridiculous, I just want to talk to a real person!"

If issue is WITHIN agent's capability:
"I completely understand your frustration, and I sincerely apologize for the difficulty 
you've experienced. I can actually resolve this right now — would you like me to process 
a full refund of $150 for the duplicate charge? If you'd still prefer to speak with 
a human agent after that, I'll transfer you immediately."

If customer reiterates: escalate without further resistance.
```

**Policy gap escalation:**
```
Customer: "I found your product for $50 less on CompetitorSite — will you match it?"

Policy covers: Own-site price matching (e.g., "found it cheaper on our other channel")
Policy is SILENT on: Competitor price matching

→ ESCALATE — policy gap requires human judgment
→ Do NOT: Invent a policy ("we don't match competitor prices")
→ Do NOT: Make an exception without authority
```

**Multiple customer matches — ask for disambiguation:**
```python
# When get_customer returns multiple matches
if len(customer_matches) > 1:
    # Ask for additional identifier — do NOT select by heuristic
    response = "I found multiple accounts matching that name. Could you provide your:
    - Email address on the account
    - Last 4 digits of the payment method used
    - Account number if you have it"
    
    # WRONG — selecting by "most recent login" or "highest value account" is a heuristic
    # that could lead to accessing the wrong customer's data
```

**Unreliable escalation proxies:**
- Sentiment-based escalation: frustrated customers may have simple issues; calm customers may have complex ones
- Self-reported confidence scores: poorly calibrated — agent may be confidently wrong

**Explicit escalation criteria with few-shot examples in system prompt:**
```
Escalate when:
1. Customer says "I want to speak to a person" or similar → escalate immediately
2. Resolution requires policy exception you're not authorized to grant → escalate
3. Issue has been open for 3+ interactions without resolution → escalate
4. Customer data shows account flag: escalation_required → escalate

Do NOT escalate for:
- Standard returns within policy window
- Billing questions with clear answers
- Order status inquiries

EXAMPLES:
Request: "Just give me my money back, you've wasted enough of my time"
→ Escalate (customer dissatisfaction + explicit time concern suggests they want human)

Request: "This charge is wrong and I've been dealing with it for 2 weeks"
→ Escalate (long-running unresolved issue, customer likely wants escalation)

Request: "What's the status of order #12345?"
→ Do NOT escalate (simple lookup — use lookup_order tool)
```

**Doc link:** https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview

---

### 5.3 Error Propagation Across Multi-Agent Systems

**Structured error context enables coordinator recovery:**
```python
# WRONG — coordinator can't make recovery decisions
return {"error": "search unavailable"}

# CORRECT — structured context with recovery options
return {
    "success": False,
    "error": {
        "type": "transient",
        "message": "Web search timeout after 10s",
        "attempted_query": "AI impact on music industry 2024 2025",
        "partial_results": [
            {"title": "AI in Music Production", "url": "...", "snippet": "..."}
            # Returned 3 results before timeout
        ],
        "suggested_alternatives": [
            "Retry with simpler query: 'AI music industry'",
            "Use document_analysis subagent with cached research papers",
            "Proceed with partial results and annotate gaps in synthesis"
        ],
        "retry_recommended": True
    }
}
```

**Coordinator recovery options with structured errors:**
```python
async def coordinator_with_recovery(topic: str):
    search_result = await invoke_web_searcher(topic)
    
    if not search_result["success"]:
        error = search_result["error"]
        
        if error["type"] == "transient" and error["retry_recommended"]:
            # Try once with simplified query
            search_result = await invoke_web_searcher(simplify_query(topic))
        
        if not search_result["success"]:
            # Proceed with partial results + gap annotation
            partial_data = error.get("partial_results", [])
            synthesis_prompt = f"""
            Synthesize findings from available sources.
            
            Available data: {json.dumps(partial_data)}
            
            IMPORTANT: Web search was unavailable. Mark sections relying on 
            web sources with: [GAP: web search unavailable for this subtopic]
            """
            return await invoke_synthesizer(synthesis_prompt, has_gaps=True)
```

**Anti-patterns:**
- **Silently suppressing errors:** Returning `{"results": []}` when search failed — coordinator thinks no data exists and proceeds with incomplete output
- **Terminating entire workflow:** One subagent failure shouldn't abort the whole research task
- **Generic error messages:** "Search failed" hides recovery options

**Coverage annotations in synthesis output:**
```python
synthesis_output = {
    "report": "...",
    "coverage_summary": {
        "visual_arts": "Well-supported — 12 sources found",
        "music_industry": "Partial — web search unavailable, 3 cached papers used",
        "film_production": "GAP — no sources available for this subtopic"
    },
    "confidence": "medium"  # Reduced due to coverage gaps
}
```

**Doc link:** https://code.claude.com/docs/en/agent-sdk/subagents

---

### 5.4 Context Management in Large Codebase Exploration

**Context degradation signs:**
- Agent starts giving inconsistent answers
- References "typical patterns" instead of specific classes found earlier
- Contradicts earlier findings
- Forgets which files were already analyzed

**Scratchpad files for persisting key findings:**
```python
# Agent maintains a scratchpad throughout exploration
# Written as findings are discovered — not after

scratchpad_content = """
# Codebase Exploration Scratchpad

## Key Architecture Findings
- Entry point: src/index.ts → imports from src/server.ts
- Auth flow: AuthMiddleware (src/middleware/auth.ts) → JWT validation → UserService
- Database: PostgreSQL via TypeORM, repository pattern in src/repositories/

## Files Modified by Recent Bug
- src/services/OrderService.ts (line 145 — the duplicate charge logic)
- src/repositories/PaymentRepository.ts (missing transaction boundary)

## Unexplored Areas (HIGH PRIORITY)
- src/webhooks/ — not yet analyzed
- src/jobs/ — background jobs unclear
"""

# Use Write tool to persist, Read to reference
await write_scratchpad(scratchpad_content)
# Later: reference the scratchpad instead of re-exploring
```

**Subagent delegation for verbose exploration:**
```python
# Main agent coordinates high-level understanding
# Subagents investigate specific questions without polluting main context

# Instead of: main agent reads all 200 files in src/
# Do: spawn exploration subagents for specific questions

exploration_tasks = [
    "Find all test files and report what they cover",
    "Trace the refund flow: start from API endpoint to database",
    "Identify all services that depend on UserService",
]

# Each subagent returns a concise summary
# Main agent accumulates summaries — not full file contents
```

**Avoid raw context daisy-chaining:** Passing full conversation logs or raw multi-agent transcripts from one agent to another scales token costs badly and reduces reliability. First improve upstream outputs so they return structured findings, not verbose reasoning. In larger systems, use coordinator-managed manifests, scratchpads, or shared retrieval layers so downstream agents query only the findings they need.

**Summarize before spawning subagents:**
```python
# After first exploration phase, summarize key findings
summary = "Architecture: Express API, PostgreSQL + TypeORM, JWT auth. Key issue area: OrderService."

# Inject this summary into subagent prompts for next phase
subagent_prompt = f"""
Context from prior exploration:
{summary}

Your task: Trace the payment processing flow in detail.
Start from src/api/payments.ts and follow the dependency chain.
"""
```

**Crash recovery using state manifests:**
```python
# Each agent exports state to a known location
agent_state = {
    "agent_id": "web-searcher",
    "completed_queries": ["AI music 2025", "AI visual arts 2024"],
    "pending_queries": ["AI film production 2025"],
    "results_file": "~/.claude/research/web_results.json",
    "status": "in_progress"
}

# Write to known manifest location
write_json("~/.claude/research/manifest.json", agent_state)

# On resume, coordinator loads manifest
manifest = read_json("~/.claude/research/manifest.json")
# Inject into resumed agent's prompt:
resume_prompt = f"Resume from: {json.dumps(manifest)}"
```

**`/compact` command:** Use during extended exploration when context fills with verbose discovery output. Compacts the conversation to a summary, freeing space for continued exploration.

**Doc link:** https://code.claude.com/docs/en/context-window

---

### 5.5 Human Review Workflows and Confidence Calibration

**Aggregate accuracy can mask segment failures:**
```
Overall accuracy: 97%
But broken down:
  Standard invoices:          99.5% ✅
  Handwritten invoices:       78%   ⚠️
  Non-English invoices:       65%   ❌
  Multi-page invoices:        91%   ⚠️
```

Do NOT reduce human review based on aggregate accuracy alone. Validate by document type AND field segment before automating.

**Stratified random sampling:**
Sample from HIGH-confidence extractions, not just low-confidence ones. High-confidence extractions may contain systematic errors that the model is consistently wrong about — these won't appear in your low-confidence queue.

```python
# Stratified sampling from confidence groups
def create_review_sample(extractions: list) -> list:
    high_confidence = [e for e in extractions if e["confidence"] == "high"]
    medium_confidence = [e for e in extractions if e["confidence"] == "medium"]
    low_confidence = [e for e in extractions if e["confidence"] == "low"]
    
    # Sample from EACH group — detect systematic errors in high-confidence
    return (
        random.sample(high_confidence, min(20, len(high_confidence))) +
        random.sample(medium_confidence, min(30, len(medium_confidence))) +
        list(low_confidence)  # Review all low-confidence
    )
```

**Field-level confidence scores:**
```python
# Rather than one overall confidence:
extraction = {
    "invoice_number": {"value": "INV-2025-001", "confidence": "high"},
    "total_amount": {"value": 15000.00, "confidence": "high"},
    "vendor_address": {"value": "123 Main St...", "confidence": "medium"},
    "payment_terms": {"value": "net-30", "confidence": "low"},  # Routing to human
}

# Route based on field-level confidence
def route_for_review(extraction: dict, thresholds: dict) -> list:
    fields_needing_review = []
    for field, data in extraction.items():
        if data["confidence"] == "low":
            fields_needing_review.append(field)
        elif data["confidence"] == "medium" and field in thresholds["medium_review_fields"]:
            fields_needing_review.append(field)
    return fields_needing_review
```

**Calibrating thresholds with labeled validation sets:**
1. Collect labeled ground-truth extractions
2. Run model on these documents
3. Compare model confidence levels to actual accuracy
4. Set review thresholds based on actual error rates by confidence level
5. Re-calibrate quarterly as document types change

**Doc link:** https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview

---

### 5.6 Information Provenance and Multi-Source Synthesis

**Source attribution is lost during summarization** when findings are compressed without preserving claim-source mappings. The synthesizer receives: "AI reduces costs" — but which source? Which study? What year?

**Structured claim-source mappings (required subagent output):**
```python
# Subagents MUST include this structure — not free-text summaries
finding = {
    "claim": "AI tools reduced music production time by 40% on average",
    "source": {
        "url": "https://musictech.report/ai-2025",
        "title": "AI in Music Production: 2025 Industry Report",
        "author": "Music Technology Research Group",
        "publication_date": "2025-02-15",  # Required for temporal analysis
        "methodology": "Survey of 500 professional music producers"
    },
    "evidence_excerpt": "Respondents reported an average reduction of 40% (±8%) in production time...",
    "confidence": "high"
}
```

**Why publication dates are critical:** Two studies might show different adoption rates — not because they contradict each other, but because one is from 2022 and one is from 2025. Without dates, the synthesizer may incorrectly present a "conflict."

**Handling conflicting statistics:**
```python
# WRONG — arbitrarily pick one value
synthesis = "AI adoption in creative industries is 34%"

# CORRECT — annotate conflict with source attribution
synthesis = """
AI adoption in creative industries:
- Smith et al. (2024): 34% adoption among professional musicians [n=500, survey methodology]
- Johnson & Lee (2025): 52% adoption among music professionals [n=1200, platform analytics]

Note: These statistics appear to conflict. Possible explanations:
1. Different definitions of "adoption" (tried once vs. regular use)
2. Different populations sampled (professional vs. semi-professional)
3. 12-month time difference — rapid adoption growth
These findings require reconciliation before citing a single figure.
"""
```

**Report structure distinguishing established vs contested findings:**
```markdown
# AI Impact on Creative Industries — Research Synthesis

## Well-Established Findings (multiple consistent sources)
- AI tools are widely adopted for image generation in advertising (8 sources, consistent)
- Most AI music tools require significant human curation (6 sources, consistent)

## Findings Under Active Research (fewer or conflicting sources)
- Economic impact on professional musicians: conflicting data (see Source Conflict section)
- Long-term effects on creative skill development: insufficient research

## Source Conflicts
[Detail conflicts with full source attribution]

## Coverage Gaps
- Film production: only 2 sources found, both from 2023 — current data unavailable
- Fine art: web search unavailable — 3 cached papers from 2022 used (potentially outdated)
```

**Rendering content appropriately:**
```
Financial data → Tables (numbers must be aligned for comparison)
News/narrative → Prose (events, quotes, context)
Technical findings → Structured lists with headers
Statistical comparisons → Side-by-side tables with source annotations
```

**Doc link:** https://platform.claude.com/docs/en/build-with-claude/context-windows

---

### Domain 5 Quick Reference

| Concept | Key fact |
|---|---|
| Lost-in-the-middle | Models underweight middle sections — put key findings at beginning/end |
| Progressive summarization | Loses specific numbers, dates, customer expectations |
| Case facts block | Persist transactional facts outside summarized history |
| Trim tool outputs | Only keep fields relevant to current task before they accumulate |
| Escalation on explicit request | Immediate — don't attempt resolution first |
| Policy gap | Escalate when policy is silent (not just complex) |
| Sentiment as proxy | Unreliable — frustrated customers may have simple issues |
| Multiple matches | Ask for additional identifiers — never select by heuristic |
| Structured error context | Include failure type, attempted query, partial results, alternatives |
| Access failure vs empty | Empty result is NOT an error — don't conflate |
| Scratchpad files | Persist key findings across context boundaries |
| `/compact` | Reduces context usage during extended exploration |
| Aggregate accuracy | Can mask poor performance on specific document types/fields |
| Stratified sampling | Sample from HIGH-confidence too — detect systematic errors |
| Publication dates | Required in structured outputs — prevent temporal misinterpretation |
| Conflict annotation | Preserve both values with source attribution — don't pick one |

---

## Practice Questions by Domain

### Domain 1 Practice

**Q1:** A customer support agent has a 55% first-contact resolution rate, well below the 80% target. Logs show it escalates straightforward cases (damage replacements with photo evidence) while autonomously handling complex situations requiring policy exceptions. What's the most effective first step?

A) Add explicit escalation criteria to the system prompt with few-shot examples demonstrating when to escalate vs resolve autonomously.  
B) Have the agent self-report a confidence score and escalate when confidence < 7.  
C) Deploy a separate classifier trained on historical tickets to predict escalation need.  
D) Implement sentiment analysis to detect frustration and auto-escalate.

**Answer: A** — The root cause is unclear decision boundaries. Explicit criteria + few-shot examples directly address this. B fails because self-reported confidence is poorly calibrated. C is over-engineered (ML infrastructure before prompt optimization). D solves a different problem — sentiment ≠ case complexity.

---

**Q2:** Your multi-agent research system produces reports that cover only visual arts when tasked with "AI impact on creative industries." Each subagent completes successfully. The coordinator's logs show decomposition into: ["AI in digital art", "AI in graphic design", "AI in photography"]. What is the root cause?

A) The synthesis agent lacks instructions for identifying coverage gaps.  
B) The coordinator's task decomposition is too narrow, missing music, writing, and film.  
C) The web search agent's queries aren't comprehensive enough.  
D) The document analysis agent is filtering out non-visual creative industry sources.

**Answer: B** — The coordinator logs reveal the problem directly: it decomposed into only visual arts subtasks. Subagents executed their assigned tasks correctly — the fault is in what they were assigned. The synthesis agent (A), web searcher (C), and document analyzer (D) all worked correctly within their assigned scope.

---

### Domain 2 Practice

**Q3:** Production data shows your agent frequently calls `get_customer` when users ask about orders (e.g., "check my order #12345"), instead of `lookup_order`. Both tools have minimal descriptions and accept similar identifier formats. What's the most effective first step?

A) Add 5-8 few-shot examples showing order queries routing to `lookup_order`.  
B) Expand each tool's description to include input formats, example queries, edge cases, and when to use vs similar tools.  
C) Implement a routing layer that pre-selects the tool based on keyword detection.  
D) Consolidate both tools into a single `lookup_entity` tool.

**Answer: B** — Tool descriptions are the primary mechanism for tool selection. Minimal descriptions are the root cause. B directly addresses this root cause. A adds overhead without fixing the underlying issue. C over-engineers and bypasses the LLM's natural language understanding. D is a valid architectural choice but more effort than the "first step" warrants.

---

### Domain 3 Practice

**Q4:** You want a `/review` command available to all developers when they clone the repo. Where do you create it?

A) `.claude/commands/review.md` in the project repository  
B) `~/.claude/commands/review.md` on each developer's machine  
C) In the root `CLAUDE.md` file  
D) In `.claude/config.json` with a `commands` array

**Answer: A** — Project-scoped commands in `.claude/commands/` are version-controlled and available to all developers after clone. B creates personal commands not shared via git. C is for instructions, not commands. D describes a non-existent configuration mechanism.

---

### Domain 4 Practice

**Q5:** Your CI pipeline runs `claude "Analyze this PR for security issues"` but the job hangs indefinitely. What's the fix?

A) `claude -p "Analyze this PR for security issues"`  
B) Set `CLAUDE_HEADLESS=true` before running  
C) Redirect stdin: `claude "..." < /dev/null`  
D) Add `--batch` flag

**Answer: A** — The `-p` (or `--print`) flag is the documented way to run Claude Code non-interactively. B and D reference non-existent features. C is a Unix workaround that doesn't address Claude Code's command syntax.

---

### Domain 5 Practice

**Q6:** You're reviewing a 14-file PR. A single-pass review produces inconsistent depth, obvious bugs missed in some files, and contradictory feedback — flagging a pattern as bad in one file while approving the same pattern in another. How should you restructure the review?

A) Split into focused passes: analyze each file individually for local issues, then run a separate integration pass examining cross-file data flow.  
B) Require developers to split large PRs into 3-4 file submissions.  
C) Switch to a model with a larger context window.  
D) Run 3 independent review passes and only flag issues appearing in 2+ runs.

**Answer: A** — Splitting reviews addresses attention dilution (the root cause). B shifts burden to developers without fixing the system. C misunderstands that larger context windows don't solve attention quality issues. D suppresses real bugs by requiring consensus — intermittent detection is still valid detection.

---

---

## Examples of Exam Questions with Explanations

### Question 1 (Scenario: Customer Support Agent)

**Situation:** Data shows that in 12% of cases the agent skips `get_customer` and calls `lookup_order` using only the customer’s name, which leads to incorrect refunds.

**Which change is most effective?**

- A) Add a programmatic precondition that blocks `lookup_order` and `process_refund` until an ID is obtained from `get_customer` **[CORRECT]**
- B) Improve the system prompt
- C) Add few-shot examples
- D) Implement a routing classifier

**Why A:** When critical business logic requires a specific tool sequence, software provides **deterministic guarantees** that prompt-based approaches (B, C) cannot. D addresses availability, not tool ordering.

---

### Question 2 (Scenario: Customer Support Agent)

**Situation:** The agent often calls `get_customer` instead of `lookup_order` for order-related questions. Tool descriptions are minimal and similar.

**What is the first step?**

- A) Few-shot examples
- B) Expand each tool’s description with input formats, examples, and boundaries **[CORRECT]**
- C) Add a routing layer
- D) Merge the tools

**Why B:** Tool descriptions are the model’s primary selection mechanism. This is the lowest-effort, highest-impact fix. A adds tokens without addressing the root cause. C is overengineering. D requires more effort than justified.

---

### Question 3 (Scenario: Customer Support Agent)

**Situation:** The agent resolves only 55% of issues with a target of 80%. It escalates simple cases and tries to handle complex policy exceptions autonomously.

**How do you improve calibration?**

- A) Add explicit escalation criteria with few-shot examples **[CORRECT]**
- B) Self-rated confidence (1–10) with automatic escalation
- C) A separate classifier trained on historical data
- D) Sentiment analysis

**Why A:** It directly addresses the root cause—unclear decision boundaries. B is unreliable (the model can be confidently wrong). C is overengineering. D solves a different problem (mood != complexity).

---

### Question 4 (Scenario: Code Generation with Claude Code)

**Situation:** You need a custom `/review` command for standard code review that is available to the whole team when they clone the repository.

**Where should you create the command file?**

- A) `.claude/commands/` in the project repository **[CORRECT]**
- B) `~/.claude/commands/`
- C) Root `CLAUDE.md`
- D) `.claude/config.json`

**Why A:** Project commands stored in `.claude/commands/` are version-controlled and automatically available to everyone. B is for personal commands. C is for instructions, not command definitions. D does not exist.

---

### Question 5 (Scenario: Code Generation with Claude Code)

**Situation:** You need to restructure a monolith into microservices (dozens of files, service-boundary decisions).

**What approach should you use?**

- A) Planning mode: explore the codebase, understand dependencies, design an approach **[CORRECT]**
- B) Direct execution incrementally
- C) Direct execution with detailed up-front instructions
- D) Direct execution and switch to planning when it gets hard

**Why A:** Planning mode is designed for large changes, multiple possible approaches, and architectural decisions. B risks expensive rework. C assumes you already know the structure. D is reactive.

---

### Question 6 (Scenario: Code Generation with Claude Code)

**Situation:** A codebase has different conventions across areas (React, API, database). Tests are co-located with code. You want conventions to be applied automatically.

**What approach should you use?**

- A) `.claude/rules/` files with YAML frontmatter and glob patterns **[CORRECT]**
- B) Put everything in the root CLAUDE.md
- C) Skills in `.claude/skills/`
- D) CLAUDE.md in every directory

**Why A:** `.claude/rules/` with glob patterns (e.g., `**/*.test.tsx`) enables automatic convention application based on file paths—ideal for tests spread across the codebase. B relies on model inference. C is manual/on-demand. D does not work well when relevant files are in many directories.

---

### Question 7 (Scenario: Multi-agent Research System)

**Situation:** The system researches “AI impact on creative industries,” but reports cover only visual art. The coordinator decomposed the topic into: “AI in digital art,” “AI in graphic design,” “AI in photography.”

**What’s the cause?**

- A) The synthesis agent does not detect gaps
- B) The coordinator decomposed the task too narrowly **[CORRECT]**
- C) The web search agent does not search thoroughly enough
- D) The document analysis agent filters out non-visual sources

**Why B:** The logs show the coordinator decomposed “creative industries” only into visual subtopics, completely missing music, literature, and film. Subagents executed correctly—the issue is what they were assigned.

---

### Question 8 (Scenario: Multi-agent Research System)

**Situation:** A web-search subagent times out while researching a complex topic. You need to design how error information is passed back to the coordinator.

**Which error propagation approach best enables intelligent recovery?**

- A) Return structured error context to the coordinator: failure type, query, partial results, and alternatives **[CORRECT]**
- B) Implement automatic retries with exponential backoff inside the subagent, then return a generic “search unavailable” status
- C) Catch the timeout inside the subagent and return an empty result set marked as success
- D) Propagate the timeout exception to a top-level handler that terminates the whole workflow

**Why A:** Structured error context gives the coordinator what it needs to decide whether to retry with a modified query, try an alternative approach, or continue with partial results. B hides context behind a generic status. C masks failure as success. D aborts the entire workflow unnecessarily.

---

### Question 9 (Scenario: Multi-agent Research System)

**Situation:** The synthesis agent often needs to verify specific claims while merging results. Currently, when verification is needed, the synthesis agent hands control back to the coordinator, which calls the web-search agent and then re-runs synthesis with the new results. This adds 2–3 extra round trips per task and increases latency by 40%. Your assessment shows that 85% of these checks are simple fact checks (dates, names, statistics), while 15% require deeper investigation.

**How do you reduce overhead while maintaining reliability?**

- A) Give the synthesis agent a limited `verify_fact` tool for simple checks, and continue routing complex verification through the coordinator **[CORRECT]**
- B) Accumulate all verification needs into a batch and return them to the coordinator at the end
- C) Give the synthesis agent full access to all web-search tools
- D) Proactively cache additional context around each source

**Why A:** This applies the principle of least privilege: the synthesis agent gets exactly what it needs for the 85% common case (simple fact checks) while preserving the coordinator-mediated path for complex investigations. B introduces blocking dependencies (later synthesis steps may depend on earlier verified facts). C breaks separation of responsibilities. D relies on speculative caching that cannot reliably predict needs.

---

### Question 10 (Scenario: Claude Code for CI)

**Situation:** A pipeline runs `claude "Analyze this pull request for security issues"`, but hangs waiting for interactive input.

**What is the correct approach?**

- A) Use the `-p` flag: `claude -p "Analyze this pull request for security issues"` **[CORRECT]**
- B) Set `CLAUDE_HEADLESS=true`
- C) Redirect stdin from `/dev/null`
- D) Use `--batch`

**Why A:** `-p` (or `--print`) is the documented way to run Claude Code in non-interactive mode. It processes the prompt, prints to stdout, and exits. The other options are either non-existent features or Unix workarounds.

---

### Question 11 (Scenario: Claude Code for CI)

**Situation:** The team wants to reduce API cost for automated analysis. Claude currently serves two workflows in real time: (1) a blocking pre-merge check that must complete before developers can merge a PR, and (2) a tech-debt report generated overnight for morning review. A manager proposes moving both to the Message Batches API to save 50%.

**How should you evaluate this proposal?**

- A) Use batch processing only for tech-debt reports; keep real-time calls for pre-merge checks **[CORRECT]**
- B) Move both workflows to batch processing and poll for completion
- C) Keep real-time calls for both to avoid ordering issues in batch results
- D) Move both to batch processing with a fallback to real time if a batch takes too long

**Why A:** The Message Batches API saves 50%, but processing time can be up to 24 hours with no guaranteed latency SLA. That makes it unsuitable for blocking pre-merge checks where developers are waiting, but ideal for overnight batch workloads like tech-debt reports.

---

### Question 12 (Scenario: Multi-file Code Review)

**Situation:** A pull request changes 14 files in an inventory tracking module. A single-pass review of all files produces inconsistent results: detailed comments for some files but superficial ones for others, missed obvious bugs, and contradictory feedback (a pattern is flagged as problematic in one file but approved in identical code in another file).

**How should you restructure the review?**

- A) Split into focused passes: analyze each file individually for local issues, then run a separate integration pass for cross-file data flows **[CORRECT]**
- B) Require developers to split large PRs into submissions of 3–4 files
- C) Switch to a higher-tier model with a larger context window to review all 14 files in one pass
- D) Run three independent full-PR review passes and report only issues found in at least two runs

**Why A:** Focused passes directly address the root cause—attention dilution when processing many files at once. Per-file analysis ensures consistent depth, and a separate integration pass catches cross-file issues. B shifts burden to developers without improving the system. C is a misconception: larger context does not fix attention quality. D suppresses real bugs by requiring consensus across inconsistent detections.

---

---

## Practice Test

> 60 questions across 4 scenarios. Format and difficulty match the real exam.
> 
> Alternatively, you can practice these questions in an exam-like HTML file: [Practical Test (EN)](practical_test_en.html)

### Scenario: Multi-agent Research System

---

### Question 1 (Scenario: Multi-agent Research System)

**Situation:** A document analysis agent discovers that two credible sources contain directly contradictory statistics for a key metric: a government report states 40% growth, while an industry analysis states 12%. Both sources look credible, and the discrepancy could materially affect the research conclusions. How should the document analysis agent handle this situation most effectively?

**Which approach is most effective?**

- A) Apply credibility heuristics to pick the most likely correct number, finish analysis with that value, and add a footnote mentioning the discrepancy.
- B) Include both numbers in the analysis output without marking them as conflicting, letting the synthesis agent decide which to use based on broader context.
- C) Stop analysis and immediately escalate to the coordinator, asking it to decide which source is more authoritative before continuing.
- D) Complete analysis with both numbers, explicitly annotate the conflict with source attribution, and let the coordinator decide how to reconcile the data before passing to synthesis. **[CORRECT]**

**Why D:** This approach preserves separation of responsibilities: the analysis agent completes its core work without blocking, preserves both conflicting values with clear attribution, and correctly passes reconciliation to the coordinator, which has broader context.

---

### Question 2 (Scenario: Multi-agent Research System)

**Situation:** The web-search and document-analysis agents have completed their tasks and returned results to the coordinator. What is the next step for creating an integrated research report?

**Which next step is most appropriate?**

- A) Each agent sends its results directly to the report-writing agent, bypassing the coordinator.
- B) The document analysis agent requests web-search results and merges them internally.
- C) The coordinator passes both sets of results to the synthesis agent for a unified integration. **[CORRECT]**
- D) The coordinator concatenates the raw outputs from both agents and returns them as the final result.

**Why C:** In a coordinator–subagent architecture, the coordinator forwards both result sets to the synthesis agent for centralized integration, preserving control and ensuring high-quality merging.

---

### Question 3 (Scenario: Multi-agent Research System)

**Situation:** A document analysis subagent frequently fails when processing PDF files: some have corrupted sections that trigger parsing exceptions, others are password-protected, and sometimes the parsing library hangs on large files. Currently, any exception immediately terminates the subagent and returns an error to the coordinator, which must decide whether to retry, skip, or fail the whole task. This causes excessive coordinator involvement in routine error handling. What architectural improvement is most effective?

**Which improvement is most effective?**

- A) Create a dedicated error-handling agent that monitors all failures via a shared queue and decides recovery actions, sending restart commands directly to subagents.
- B) Configure the subagent to always return partial results with a success status, embedding error details in metadata; the coordinator treats all responses as successful.
- C) Make the coordinator validate all documents before sending them to the subagent, rejecting documents that might cause failures.
- D) Implement local recovery in the subagent for transient failures and escalate to the coordinator only errors it cannot resolve, including attempted steps and partial results. **[CORRECT]**

**Why D:** Handle errors at the lowest level capable of resolving them. Local recovery reduces coordinator workload while still escalating truly unrecoverable issues with full context and partial progress.

---

### Question 4 (Scenario: Multi-agent Research System)

**Situation:** After running the system on “AI impact on creative industries,” you observe that every subagent completes successfully: the web-search agent finds relevant articles, the document analysis agent summarizes them correctly, and the synthesis agent produces coherent text. However, final reports cover only visual art and completely miss music, literature, and film. In the coordinator logs, you see it decomposed the topic into three subtasks: “AI in digital art,” “AI in graphic design,” and “AI in photography.” What is the most likely root cause?

**What is the most likely root cause?**

- A) The synthesis agent lacks instructions to detect coverage gaps.
- B) The document analysis agent filters out non-visual sources due to overly strict relevance criteria.
- C) The coordinator’s task decomposition is too narrow, assigning subagents work that does not cover all relevant areas. **[CORRECT]**
- D) The web-search agent’s queries are insufficient and should be broadened to cover more sectors.

**Why C:** The coordinator decomposed a broad topic only into visual-art subtasks, missing music, literature, and film entirely. Since subagents executed their assignments correctly, the narrow decomposition is the obvious root cause.

---

### Question 5 (Scenario: Multi-agent Research System)

**Situation:** The web-search subagent returns results for only 3 of 5 requested source categories (competitor sites and industry reports succeed, but news archives and social feeds time out). The document analysis subagent successfully processes all provided documents. The synthesis subagent must produce a summary from mixed-quality upstream inputs. Which error-propagation strategy is most effective?

**Which error-propagation strategy is most effective?**

- A) Continue synthesis using only successful sources and produce an output without mentioning which data was unavailable.
- B) The synthesis subagent returns an error to the coordinator, triggering a full retry or task failure due to incomplete data.
- C) The synthesis subagent asks the coordinator to retry timed-out sources with a longer timeout before starting synthesis.
- D) Structure the synthesis output with coverage annotations that indicate which conclusions are well-supported and where gaps exist due to unavailable sources. **[CORRECT]**

**Why D:** Coverage annotations implement graceful degradation with transparency, preserving value from completed work while propagating uncertainty to enable informed decisions about confidence.

---

### Question 6 (Scenario: Multi-agent Research System)

**Situation:** The document analysis subagent encounters a corrupted PDF file that it cannot parse. When designing the system’s error handling, what is the most effective way to handle this failure?

**Which approach is most effective?**

- A) Return an error with context to the coordinator agent, allowing it to decide how to proceed. **[CORRECT]**
- B) Silently skip the corrupted document and continue processing the remaining files to avoid interrupting the workflow.
- C) Automatically retry parsing the document three times with exponential backoff before reporting a failure.
- D) Throw an exception that terminates the entire research workflow.

**Why A:** Returning an error with context to the coordinator is the most effective approach because it lets the coordinator make an informed decision—skip the file, try an alternative parsing method, or notify the user—while maintaining visibility into the failure.

---

### Question 7 (Scenario: Multi-agent Research System)

**Situation:** Production logs show a persistent pattern: requests like “analyze the uploaded quarterly report” are routed to the web-search agent 45% of the time instead of the document analysis agent. Reviewing tool definitions, you find that the web-search agent has a tool `analyze_content` described as “analyzes content and extracts key information,” while the document analysis agent has a tool `analyze_document` described as “analyzes documents and extracts key information.” How should you fix the misrouting problem?

**How should you fix the misrouting problem?**

- A) Add a pre-routing classifier that detects whether the user refers to uploaded files or web content before the coordinator decides on delegation.
- B) Rename the web-search tool to `extract_web_results` and update its description to “processes and returns information retrieved from web search and URLs.” **[CORRECT]**
- C) Add few-shot examples to the coordinator prompt showing correct routing: “User uploads a quarterly report → document analysis agent” and “User asks about a web page → web-search agent.”
- D) Expand the document analysis tool description with usage examples like “Use for uploaded PDFs, Word docs, and spreadsheets,” leaving the web-search tool unchanged.

**Why B:** Renaming the web-search tool to `extract_web_results` and updating its description to explicitly reference web search and URLs directly removes the root cause by eliminating semantic overlap between the two tool names and descriptions. This makes each tool’s purpose unambiguous, enabling the coordinator to reliably distinguish document analysis from web search.

---

### Question 8 (Scenario: Multi-agent Research System)

**Situation:** A colleague proposes that the document analysis agent should send its results directly to the synthesis agent, bypassing the coordinator. What is the main advantage of keeping the coordinator as the central hub for all communication between subagents?

**What is the main advantage of keeping the coordinator as the central hub?**

- A) The coordinator can observe all interactions, handle errors uniformly, and decide what information each subagent should receive. **[CORRECT]**
- B) The coordinator batches multiple requests to subagents, reducing total API calls and overall latency.
- C) Routing through the coordinator enables automatic retry logic that direct inter-agent calls cannot support.
- D) Subagents use isolated memory, and direct communication would require complex serialization that only the coordinator can perform.

**Why A:** The coordinator pattern provides centralized visibility into all interactions, uniform error handling across the system, and fine-grained control over what information each subagent receives—these are the primary advantages of a star-shaped communication topology.

---

### Question 9 (Scenario: Multi-agent Research System)

**Situation:** The web-search subagent times out while researching a complex topic. You need to design how information about this failure is returned to the coordinator. Which error-propagation approach best enables intelligent recovery?

**Which error-propagation approach best enables intelligent recovery?**

- A) Return structured error context to the coordinator including the failure type, the query executed, any partial results, and potential alternative approaches. **[CORRECT]**
- B) Catch the timeout within the subagent and return an empty result set marked as successful.
- C) Implement automatic exponential-backoff retries inside the subagent, only returning a generic “search unavailable” status after exhausting retries.
- D) Propagate the timeout exception directly to the top-level handler, terminating the entire research workflow.

**Why A:** Returning structured error context—including failure type, executed query, partial results, and alternative approaches—gives the coordinator everything needed to make intelligent recovery decisions (e.g., retry with a modified query or continue with partial results). It preserves maximum context for informed coordination-level decision-making.

---

### Question 10 (Scenario: Multi-agent Research System)

**Situation:** In your system design, you gave the document analysis agent access to a general-purpose tool `fetch_url` so it could download documents by URL. Production logs show this agent now frequently downloads search engine results pages to perform ad hoc web search—behavior that should be routed through the web-search agent—causing inconsistent results. Which fix is most effective?

**Which fix is most effective?**

- A) Replace `fetch_url` with a `load_document` tool that validates that URLs point to document formats. **[CORRECT]**
- B) Remove `fetch_url` from the document analysis agent and route all URL fetching through the coordinator to the web-search agent.
- C) Implement filtering that blocks `fetch_url` calls to known search engine domains while allowing other URLs.
- D) Add instructions to the document analysis agent prompt that `fetch_url` should only be used to download document URLs, not to search.

**Why A:** Replacing a general-purpose tool with a document-specific tool that validates URLs against document formats fixes the root cause by constraining capability at the interface level. This follows the principle of least privilege, making undesired search behavior impossible rather than merely discouraged.

---

### Question 11 (Scenario: Multi-agent Research System)

**Situation:** While researching a broad topic, you observe that the web-search agent and the document analysis agent investigate the same subtopics, leading to substantial duplication in their outputs. Token usage nearly doubles without a proportional increase in research breadth or depth. What is the most effective way to address this?

**What is the most effective way to address this?**

- A) Allow both agents to finish in parallel, then have the coordinator deduplicate overlapping results before passing them to the synthesis agent.
- B) The coordinator explicitly partitions the research space before delegating, assigning each agent distinct subtopics or source types. **[CORRECT]**
- C) Implement a shared-state mechanism where agents log their current focus area so other agents can dynamically avoid duplication during execution.
- D) Switch to sequential execution where document analysis runs only after web search completes, using web-search results as context to avoid duplication.

**Why B:** Having the coordinator explicitly partition the research space before delegating is most effective because it addresses the root cause—unclear task boundaries—before any work begins. It preserves parallelism while preventing duplicated effort and wasted tokens.

---

### Question 12 (Scenario: Multi-agent Research System)

**Situation:** During research, the web-search subagent queries three source categories with different outcomes: academic databases return 15 relevant papers, industry reports return “0 results,” and patent databases return “Connection timeout.” When designing error propagation to the coordinator, which approach enables the best recovery decisions?

**Which approach enables the best recovery decisions?**

- A) Aggregate the results into a single success-percentage metric (e.g., “67% source coverage”) with detailed logs available on demand.
- B) Report both “timeout” and “0 results” as failures requiring coordinator intervention.
- C) Retry transient failures internally and report only persistent errors.
- D) Distinguish access failures (timeout) that require a retry decision from valid empty results (“0 results”) that represent successful queries. **[CORRECT]**

**Why D:** A timeout (access failure) and “0 results” (valid empty result) are semantically different outcomes requiring different responses. Distinguishing them allows the coordinator to retry the patent database while accepting the industry reports “0 results” as a valid, informative finding.

---

### Question 13 (Scenario: Multi-agent Research System)

**Situation:** Production monitoring shows inconsistent synthesis quality. When aggregated results are ~75K tokens, the synthesis agent reliably cites information from the first 15K tokens (web-search headlines/snippets) and the last 10K tokens (document analysis conclusions), but often misses critical findings in the middle 50K tokens—even when they directly answer the research question. How should you restructure the aggregated input?

**How should you restructure the aggregated input?**

- A) Summarize all subagent outputs to under 20K tokens before aggregation to keep content within the model’s reliable processing range.
- B) Stream subagent results to the synthesis agent incrementally, processing web-search results first to completion, then adding document analysis results.
- C) Place a key-findings summary at the start of the aggregated input and organize detailed results with explicit section headings for easier navigation. **[CORRECT]**
- D) Implement rotation that alternates which subagent’s results appear first across research tasks to ensure both sources get equal top positioning over time.

**Why C:** Putting a key-findings summary at the start leverages primacy effects so critical information sits in the most reliably processed position. Adding explicit section headings throughout helps the model navigate and attend to mid-input content, directly mitigating the “lost in the middle” phenomenon.

---

### Question 14 (Scenario: Multi-agent Research System)

**Situation:** In testing, the combined output of the web-search agent (85K tokens including page content) and the document analysis agent (70K tokens including chains of thought) totals 155K tokens, but the synthesis agent performs best with inputs under 50K tokens. Which solution is most effective?

**Which solution is most effective?**

- A) Modify upstream agents to return structured data (key facts, quotes, relevance scores) instead of verbose content and reasoning. **[CORRECT]**
- B) Add an intermediate summarization agent that condenses findings before passing them to synthesis.
- C) Have the synthesis agent process findings in sequential batches, maintaining state between calls.
- D) Store findings in a vector database and give the synthesis agent search tools to query during its work.

**Why A:** Modifying upstream agents to return structured data fixes the root cause by reducing token volume at the source while preserving essential information. It avoids passing bulky page content and reasoning traces that inflate tokens without improving the synthesis step.

---

### Question 15 (Scenario: Multi-agent Research System)

**Situation:** In testing, you observe that the synthesis agent often needs to verify specific claims while merging results. Currently, when verification is needed, the synthesis agent returns control to the coordinator, which calls the web-search agent and then re-invokes synthesis with the results. This adds 2–3 extra loops per task and increases latency by 40%. Your assessment shows 85% of these verifications are simple fact checks (dates, names, stats) and 15% require deeper research. Which approach most effectively reduces overhead while preserving system reliability?

**Which approach is most effective?**

- A) Give the synthesis agent access to all web-search tools so it can handle any verification need directly without coordinator loops.
- B) Have the synthesis agent accumulate all verification needs and return them as a batch to the coordinator at the end, which then sends them all to the web-search agent at once.
- C) Have the web-search agent proactively cache extra context around each source during initial research in anticipation of synthesis needing verification.
- D) Give the synthesis agent a limited-scope `verify_fact` tool for simple checks, while routing complex verifications through the coordinator to the web-search agent. **[CORRECT]**

**Why D:** A limited-scope fact-verification tool lets the synthesis agent handle 85% of simple checks directly, eliminating most loops, while preserving the coordinator delegation path for the 15% of complex verifications. This applies least privilege while significantly reducing latency.

---

### Scenario: Claude Code for Continuous Integration

---

### Question 16 (Scenario: Claude Code for Continuous Integration)

**Situation:** Your CI pipeline runs the Claude Code CLI (in `--print` mode) using CLAUDE.md to provide project context for code review, and developers generally find the reviews substantive. However, they report that integrating findings into the workflow is difficult—Claude outputs narrative paragraphs that must be manually copied into PR comments. The team wants to automatically post each finding as a separate inline PR comment at the relevant place in code, which requires structured data with file path, line number, severity level, and suggested fix. Which approach is most effective?

**Which approach is most effective?**

- A) Add an “Output Format for Review” section to CLAUDE.md with examples of structured findings so Claude learns the expected format from project context.
- B) Use the CLI flags `--output-format json` and `--json-schema` to enforce structured findings, then parse the output to post inline comments via the GitHub API. **[CORRECT]**
- C) Include explicit formatting instructions in the review prompt requiring each finding to follow a parseable template like `[FILE:path] [LINE:n] [SEVERITY:level] ...`.
- D) Keep narrative review format but add a summarization step that uses Claude to generate a structured JSON summary of findings.

**Why B:** Using `--output-format json` with `--json-schema` enforces structured output at the CLI level, guaranteeing well-formed JSON with the required fields (file path, line number, severity, suggested fix) that can be reliably parsed and posted as inline PR comments via the GitHub API. It leverages built-in CLI capabilities designed specifically for structured output.

---

### Question 17 (Scenario: Claude Code for Continuous Integration)

**Situation:** Your team uses Claude Code for generating code suggestions, but you notice a pattern: non-obvious issues—performance optimizations that break edge cases, cleanups that unexpectedly change behavior—are only caught when another team member reviews the PR. Claude’s reasoning during generation shows it considered these cases but concluded its approach was correct. Which approach directly addresses the root cause of this self-check limitation?

**Which approach directly addresses the root cause?**

- A) Run a second independent instance of Claude Code to review the changes without access to the generator’s reasoning. **[CORRECT]**
- B) Enable extended thinking mode for the generation stage to allow more thorough deliberation before producing suggestions.
- C) Add explicit self-review instructions to the generation prompt asking Claude to critique its own suggestions before finalizing output.
- D) Include full test files and documentation in prompt context so Claude better understands expected behavior during generation.

**Why A:** A second independent Claude Code instance without access to the generator’s reasoning directly addresses the root cause by avoiding confirmation bias. This “fresh eyes” perspective mirrors human peer review, where another reviewer catches issues the author rationalized.

---

### Question 18 (Scenario: Claude Code for Continuous Integration)

**Situation:** Your code review component is iterative: Claude analyzes the changed file, then may request related files (imports, base classes, tests) via tool calls to understand context before providing final feedback. Your application defines a tool that lets Claude request file contents; Claude calls the tool, gets results, and continues analysis. You’re evaluating batch processing to reduce API cost. What is the primary technical limitation when considering batch processing for this workflow?

**What is the primary technical limitation?**

- A) Batch processing does not include correlation IDs to map outputs back to input requests.
- B) The asynchronous model cannot execute tools mid-request and return results for Claude to continue analysis. **[CORRECT]**
- C) The Batch API does not support tool definitions in request parameters.
- D) The batch processing latency of up to 24 hours is too slow for pull request feedback, although the workflow would otherwise function.

**Why B:** A “fire-and-forget” asynchronous Batch API model has no mechanism to intercept a tool call during a request, execute the tool, and return results for Claude to continue analysis. This is fundamentally incompatible with iterative tool-calling workflows that require multiple tool request/response rounds within a single logical interaction.

---

### Question 19 (Scenario: Claude Code for Continuous Integration)

**Situation:** Your CI/CD system runs three Claude-based analyses: (1) fast style checks on every PR that block merging until completion, (2) comprehensive weekly security audits of the entire codebase, and (3) nightly test-case generation for recently changed modules. The Message Batches API offers 50% savings but processing can take up to 24 hours. You want to optimize API cost while maintaining an acceptable developer experience. Which combination correctly matches each task to an API approach?

**Which combination is correct?**

- A) Use the Message Batches API for all three tasks to maximize 50% savings, configuring the pipeline to poll for batch completion.
- B) Use synchronous calls for PR style checks; use the Message Batches API for weekly security audits and nightly test generation. **[CORRECT]**
- C) Use synchronous calls for all three tasks for consistent response times, relying on prompt caching to reduce costs across workloads.
- D) Use synchronous calls for PR style checks and nightly test generation; use the Message Batches API only for weekly security audits.

**Why B:** PR style checks block developers and require immediate responses via synchronous calls, while weekly security audits and nightly test generation are scheduled tasks with flexible deadlines that can tolerate up to a 24-hour batch window—capturing 50% savings for both.

---

### Question 20 (Scenario: Claude Code for Continuous Integration)

**Situation:** Your automated reviews find real issues, but developers report the feedback is not actionable. Findings include phrases like “complex ticket routing logic” or “potential null pointer” without specifying what exactly to change. When you add detailed instructions like “always include concrete fix suggestions,” the model still produces inconsistent output—sometimes detailed, sometimes vague. Which prompting technique most reliably produces consistently actionable feedback?

**Which prompting technique is most reliable?**

- A) Further refine instructions with more explicit requirements for each part of the feedback format (location, issue, severity, proposed fix).
- B) Expand the context window to include more surrounding codebase so the model has enough information to propose concrete fixes.
- C) Implement a two-pass approach where one prompt identifies issues and a second generates fixes, allowing specialization.
- D) Add 3–4 few-shot examples showing the exact required format: identified issue, location in code, concrete fix suggestion. **[CORRECT]**

**Why D:** Few-shot examples are the most effective technique for achieving consistent output format when instructions alone produce variable results. Providing 3–4 examples that show the exact desired structure (issue, location, concrete fix) gives the model a concrete pattern to follow, which is more reliable than abstract instructions.

---

### Question 21 (Scenario: Claude Code for Continuous Integration)

**Situation:** Your CI pipeline includes two Claude-based code review modes: a pre-merge-commit hook that blocks PR merge until completion, and a “deep analysis” that runs overnight, polls for batch completion, and posts detailed suggestions to the PR. You want to reduce API cost using the Message Batches API, which offers 50% savings but requires polling and can take up to 24 hours. Which mode should use batch processing?

**Which mode should use batch processing?**

- A) Only the pre-merge-commit hook.
- B) Only the deep analysis. **[CORRECT]**
- C) Both modes.
- D) Neither mode.

**Why B:** Deep analysis is an ideal candidate for batch processing because it already runs overnight, tolerates delay, and uses a polling model before publishing results—matching the asynchronous, polling-based architecture of the Message Batches API while capturing 50% savings.

---

### Question 22 (Scenario: Claude Code for Continuous Integration)

**Situation:** Your automated review analyzes comments and docstrings. The current prompt instructs Claude to “check that comments are accurate and up to date.” Findings often flag acceptable patterns (TODO markers, simple descriptions) while missing comments describing behavior the code no longer implements. What change addresses the root cause of this inconsistent analysis?

**What change addresses the root cause?**

- A) Include `git blame` data so Claude can identify comments that predate recent code changes.
- B) Add few-shot examples of misleading comments to help the model recognize similar patterns in the codebase.
- C) Filter TODO, FIXME, and descriptive comment patterns before analysis to reduce noise.
- D) Specify explicit criteria: flag comments only when the behavior they claim contradicts the code’s actual behavior. **[CORRECT]**

**Why D:** Explicit criteria—flagging comments only when claimed behavior contradicts actual code behavior—directly addresses the root cause by replacing a vague instruction with a precise definition of what constitutes a problem. This reduces false positives on acceptable patterns and misses of truly misleading comments.

---

### Question 23 (Scenario: Claude Code for Continuous Integration)

**Situation:** Your automated code review system shows inconsistent severity ratings—similar issues like null pointer risks are rated “critical” in some PRs but only “medium” in others. Developer surveys show growing distrust—many start dismissing findings without reading because “half are wrong.” High-false-positive categories erode trust in accurate categories. Which approach best restores developer trust while improving the system?

**Which approach best restores developer trust?**

- A) Temporarily disable high-false-positive categories (style, naming, documentation) and keep only high-precision categories while improving prompts. **[CORRECT]**
- B) Keep all categories enabled but display confidence scores with each finding so developers can decide what to investigate.
- C) Keep all categories enabled and add few-shot examples to improve accuracy for each category over the next few weeks.
- D) Apply a uniform strictness reduction across all categories to bring the overall false-positive rate down.

**Why A:** Temporarily disabling high-false-positive categories immediately stops trust erosion by removing noisy findings that cause developers to dismiss everything, while preserving value from high-precision categories like security and correctness. It also creates space to improve prompts for problematic categories before re-enabling them.

---

### Question 24 (Scenario: Claude Code for Continuous Integration)

**Situation:** Your automated review generates test-case suggestions for each PR. Reviewing a PR that adds course completion tracking, Claude suggests 10 test cases, but developer feedback shows that 6 duplicate scenarios already covered by the existing test suite. What change most effectively reduces duplicate suggestions?

**What change is most effective?**

- A) Include the existing test file in context so Claude can determine what scenarios are already covered. **[CORRECT]**
- B) Reduce the requested number of suggestions from 10 to 5, assuming Claude prioritizes the most valuable cases first.
- C) Add instructions directing Claude to focus exclusively on edge cases and error conditions rather than success paths.
- D) Implement post-processing that filters suggestions whose descriptions match existing test names via keyword overlap.

**Why A:** Including the existing test file fixes the root cause of duplication: Claude can only avoid suggesting already-covered scenarios if it knows what tests already exist. This gives Claude the information needed to propose genuinely new, valuable tests.

---

### Question 25 (Scenario: Claude Code for Continuous Integration)

**Situation:** After an initial automated review identifies 12 findings, a developer pushes new commits to address issues. Re-running review produces 8 findings, but developers report that 5 duplicate previous comments on code that was already fixed in the new commits. What is the most effective way to eliminate this redundant feedback while maintaining thoroughness?

**What is the most effective way to eliminate redundant feedback?**

- A) Run review only when the PR is created and in the final pre-merge state, skipping intermediate commits.
- B) Add a post-processing filter that removes findings that match previous ones by file paths and issue descriptions before posting comments.
- C) Restrict review scope to files changed in the most recent push, excluding files from earlier commits.
- D) Include previous review findings in context and instruct Claude to report only new or still-unresolved issues. **[CORRECT]**

**Why D:** Including prior review findings in context lets Claude distinguish new problems from those already addressed in recent commits. This preserves review thoroughness while using Claude’s reasoning to avoid redundant feedback on fixed code.

---

### Question 26 (Scenario: Claude Code for Continuous Integration)

**Situation:** Your pipeline script runs `claude "Analyze this pull request for security issues"`, but the job hangs indefinitely. Logs show Claude Code is waiting for interactive input. What is the correct approach to run Claude Code in an automated pipeline?

**What is the correct approach?**

- A) Add a `--batch` flag: `claude --batch "Analyze this pull request for security issues"`.
- B) Add the `-p` flag: `claude -p "Analyze this pull request for security issues"`. **[CORRECT]**
- C) Redirect stdin from `/dev/null`: `claude "Analyze this pull request for security issues" < /dev/null`.
- D) Set the environment variable `CLAUDE_HEADLESS=true` before running the command.

**Why B:** The `-p` (or `--print`) flag is the documented way to run Claude Code non-interactively. It processes the prompt, prints the result to stdout, and exits without waiting for user input—ideal for CI/CD pipelines.

---

### Question 27 (Scenario: Claude Code for Continuous Integration)

**Situation:** A pull request changes 14 files in an inventory tracking module. A single-pass review that analyzes all files together produces inconsistent results: detailed feedback on some files but shallow comments on others, missed obvious bugs, and contradictory feedback (a pattern is flagged in one file but identical code is approved in another file in the same PR). How should you restructure the review?

**How should you restructure the review?**

- A) Run three independent full-PR review passes and flag only issues that appear in at least two of the three runs.
- B) Split into focused passes: review each file individually for local issues, then run a separate integration-oriented pass to examine cross-file data flows. **[CORRECT]**
- C) Require developers to split large PRs into smaller submissions of 3–4 files before running automated review.
- D) Switch to a larger model with a bigger context window so it can pay sufficient attention to all 14 files in one pass.

**Why B:** Focused per-file passes address the root cause—attention dilution—by ensuring consistent depth and reliable local issue detection. A separate integration-oriented pass then covers cross-file concerns such as dependency and data-flow interactions.

---

### Question 28 (Scenario: Claude Code for Continuous Integration)

**Situation:** Your automated code review averages 15 findings per pull request, and developers report a 40% false-positive rate. The bottleneck is investigation time: developers must click into each finding to read Claude’s rationale before deciding whether to fix or dismiss it. Your CLAUDE.md already contains comprehensive rules for acceptable patterns, and stakeholders rejected any approach that filters findings before developers see them. What change best addresses investigation time?

**What change best addresses investigation time?**

- A) Require Claude to include its rationale and confidence estimate directly in each finding. **[CORRECT]**
- B) Add a post-processor that analyzes finding patterns and automatically suppresses those that match historical false-positive signatures.
- C) Categorize findings as “blocking issues” vs “suggestions,” with different review requirements by level.
- D) Configure Claude to show only high-confidence findings, filtering uncertain flags before developers see them.

**Why A:** Including rationale and confidence directly in each finding reduces investigation time by letting developers quickly triage without opening each finding. It satisfies the “no filtering” constraint because all findings remain visible while accelerating developer decision-making.

---

### Question 29 (Scenario: Claude Code for Continuous Integration)

**Situation:** Analysis of your automated code review shows large differences in false-positive rates by finding category: security/correctness findings have 8% false positives, performance findings 18%, style/naming findings 52%, and documentation findings 48%. Developer surveys show growing distrust—many start dismissing findings without reading because “half are wrong.” High-false-positive categories erode trust in accurate categories. Which approach best restores developer trust while improving the system?

**Which approach best restores developer trust?**

- A) Temporarily disable high-false-positive categories (style, naming, documentation) and keep only high-precision categories while improving prompts. **[CORRECT]**
- B) Keep all categories enabled but display confidence scores with each finding so developers can decide what to investigate.
- C) Keep all categories enabled and add few-shot examples to improve accuracy for each category over the next few weeks.
- D) Apply a uniform strictness reduction across all categories to bring the overall false-positive rate down.

**Why A:** Temporarily disabling high-false-positive categories immediately stops trust erosion by removing noisy findings that cause developers to dismiss everything, while preserving value from high-precision categories like security and correctness. It also creates space to improve prompts for problematic categories before re-enabling them.

---

### Question 30 (Scenario: Claude Code for Continuous Integration)

**Situation:** Your team wants to reduce API costs for automated analysis. Currently, synchronous Claude calls support two workflows: (1) a blocking pre-merge check that must complete before developers can merge, and (2) a technical debt report generated overnight for review the next morning. Your manager proposes moving both to the Message Batches API to save 50%. How should you evaluate this proposal?

**How should you evaluate this proposal?**

- A) Move both to batch processing with fallback to synchronous calls if batches take too long.
- B) Move both workflows to batch processing with status polling to verify completion.
- C) Use batch processing only for technical debt reports; keep synchronous calls for pre-merge checks. **[CORRECT]**
- D) Keep synchronous calls for both workflows to avoid issues with batch result ordering.

**Why C:** Message Batches API processing can take up to 24 hours with no latency SLA, which is acceptable for overnight technical debt reports but unacceptable for blocking pre-merge checks where developers wait. This matches each workflow to the right API based on latency requirements.

---

### Scenario: Code Generation with Claude Code

---

### Question 31 (Scenario: Code Generation with Claude Code)

**Situation:** You asked Claude Code to implement a function that transforms API responses into an internal normalized format. After two iterations, the output structure still doesn’t match expectations—some fields are nested differently and timestamps are formatted incorrectly. You described requirements in prose, but Claude interprets them differently each time.

**Which approach is most effective for the next iteration?**

- A) Write a JSON schema describing the expected output structure and validate Claude’s output against it after each iteration.
- B) Provide 2–3 concrete input-output examples showing the expected transformation for representative API responses. **[CORRECT]**
- C) Rewrite requirements with more technical precision, specifying exact field mappings, nesting rules, and timestamp format strings.
- D) Ask Claude to explain its current understanding of the requirements to identify where interpretations diverge.

**Why B:** Concrete input-output examples remove ambiguity inherent in prose descriptions by showing Claude the exact expected transformation results. This directly addresses the root cause—misinterpretation of textual requirements—by providing unambiguous patterns for field nesting and timestamp formatting.

---

### Question 32 (Scenario: Code Generation with Claude Code)

**Situation:** You need to add Slack as a new notification channel. The existing codebase has clear, established patterns for email, SMS, and push channels. However, Slack’s API offers fundamentally different integration approaches—incoming webhooks (simple, one-way), bot tokens (support delivery confirmation and programmatic control), or Slack Apps (two-way events, requires workspace approval). Your task says “add Slack support” without specifying integration method or requiring advanced features like delivery tracking.

**How should you approach this task?**

- A) Start in direct execution mode using incoming webhooks to match the existing one-way notification pattern.
- B) Switch to planning mode to explore integration options and architectural implications, then present a recommendation before implementation. **[CORRECT]**
- C) Start in direct execution mode by scaffolding a Slack channel class using existing patterns, deferring the integration method decision.
- D) Start in direct execution mode using a bot-token approach to ensure delivery confirmation is possible.

**Why B:** Slack integration has multiple valid approaches with significantly different architectural implications, and requirements are ambiguous. Planning mode lets you evaluate trade-offs among webhooks, bot tokens, and Slack Apps and align on an approach before implementation.

---

### Question 33 (Scenario: Code Generation with Claude Code)

**Situation:** Your CLAUDE.md file has grown to 400+ lines containing coding standards, testing conventions, a detailed PR review checklist, deployment instructions, and database migration procedures. You want Claude to always follow coding standards and testing conventions, but apply PR review, deploy, and migration guidance only when doing those tasks.

**Which restructuring approach is most effective?**

- A) Move all guidance into separate Skills files organized by workflow type, leaving only a brief project description in CLAUDE.md.
- B) Keep everything in CLAUDE.md but use `@import` syntax to organize into separately maintained files by category.
- C) Split CLAUDE.md into files under `.claude/rules/` with path-bound glob patterns so each rule loads only for the relevant file types.
- D) Keep universal standards in CLAUDE.md and create Skills for workflow-specific guidance (PR review, deploy, migrations) with trigger keywords. **[CORRECT]**

**Why D:** CLAUDE.md content loads in every session, ensuring coding standards and testing conventions always apply, while Skills are invoked on demand when Claude detects trigger keywords—ideal for workflow-specific guidance like PR review, deployment, and migrations.

---

### Question 34 (Scenario: Code Generation with Claude Code)

**Situation:** You’re tasked with restructuring your team’s monolithic application into microservices. This impacts changes across dozens of files and requires decisions about service boundaries and module dependencies.

**Which approach should you choose?**

- A) Switch to planning mode to explore the codebase, understand dependencies, and design the implementation approach before making changes. **[CORRECT]**
- B) Start in direct execution mode and switch to planning only after encountering unexpected complexity during implementation.
- C) Start in direct execution mode and make incremental changes, letting implementation reveal natural service boundaries.
- D) Use direct execution with detailed upfront instructions that specify each service structure.

**Why A:** Planning mode is the right strategy for complex architectural restructuring like splitting a monolith: it allows safe exploration and informed decisions about boundaries before committing to potentially expensive changes across many files.

---

### Question 35 (Scenario: Code Generation with Claude Code)

**Situation:** Your team created a `/analyze-codebase` skill that performs deep code analysis—dependency scanning, test coverage counts, and code quality metrics. After running the command, team members report Claude becomes less responsive in the session and loses the context of the original task.

**How do you most effectively fix this while keeping full analysis capabilities?**

- A) Add `context: fork` in the skill frontmatter to run the analysis in an isolated subagent context. **[CORRECT]**
- B) Add `model: haiku` in frontmatter to use a faster, cheaper model for analysis.
- C) Split the skill into three smaller skills, each producing less output.
- D) Add instructions to the skill to compress all results into a short summary before displaying them.

**Why A:** `context: fork` runs the analysis in an isolated subagent context so the large output does not pollute the main session’s context window and Claude does not lose track of the original task. It preserves full analysis capability while keeping the main session responsive.

---

### Question 36 (Scenario: Code Generation with Claude Code)

**Situation:** Your team uses a `/commit` skill in `.claude/skills/commit/SKILL.md`. A developer wants to customize it for their personal workflow (different commit message format, extra checks) without affecting teammates.

**What do you recommend?**

- A) Create a personal version under `~/.claude/skills/` with a different name, e.g., `/my-commit`.
- B) Add conditional logic based on username in the project skill frontmatter.
- C) Create a personal version at `~/.claude/skills/commit/SKILL.md` with the same name. **[CORRECT]**
- D) Set `override: true` in the personal skill frontmatter to prioritize it over the project version.

**Why C:** Personal skills take precedence over project skills with the same name. A personal skill at `~/.claude/skills/commit/SKILL.md` will override the team’s project skill, allowing the developer to customize their workflow while maintaining the familiar `/commit` command name for their personal use. This approach is better than option A because it preserves the original command name, improving the developer’s workflow without affecting teammates.

---

### Question 37 (Scenario: Code Generation with Claude Code)

**Situation:** Your team has used Claude Code for months. Recently, three developers report Claude follows the guidance “always include comprehensive error handling,” but a fourth developer who just joined says Claude does not follow it. All four work in the same repo and have up-to-date code.

**What is the most likely cause and fix?**

- A) The guidance lives in the original developers’ user-level `~/.claude/CLAUDE.md` files, not in the project `.claude/CLAUDE.md`. Move the instruction to the project-level file so all team members receive it. **[CORRECT]**
- B) The new developer’s `~/.claude/CLAUDE.md` contains conflicting instructions overriding project settings; they should delete the conflicting section.
- C) Claude Code learns per-user preferences over time; the new developer must repeat the requirement until Claude “remembers” it.
- D) Claude Code caches CLAUDE.md after first read; original developers use cached versions. Everyone should clear the Claude Code cache.

**Why A:** If the guidance was added only to the original developers’ user-level configs and not to the project-level `.claude/CLAUDE.md`, new team members won’t receive it. Moving it to the project-level configuration ensures all current and future team members automatically get the guidance.

---

### Question 38 (Scenario: Code Generation with Claude Code)

**Situation:** You find that including 2–3 full endpoint implementation examples as context significantly improves consistency when generating new API endpoints. However, this context is useful only when creating new endpoints—not when debugging, reviewing code, or other work in the API directory.

**Which configuration approach is most effective?**

- A) Add endpoint examples and pattern documentation to the project CLAUDE.md so they are always available.
- B) Manually reference endpoint examples in every generation request by copying code into the prompt.
- C) Configure path-specific rules in `.claude/rules/api/` that include endpoint examples and activate when working in the API directory.
- D) Create a skill that references the endpoint examples and contains pattern-following instructions, invoked on demand via a slash command. **[CORRECT]**

**Why D:** A skill invoked on demand loads the example context only when generating new endpoints, not during unrelated tasks like debugging or review. This keeps the main context clean while preserving high-quality generation when needed.

---

### Question 39 (Scenario: Code Generation with Claude Code)

**Situation:** Your team created a `/migration` skill that generates database migration files. It takes the migration name via `$ARGUMENTS`. In production you observe three issues: (1) developers often run the skill without arguments, causing poorly named files, (2) the skill sometimes uses database schema details from unrelated prior conversations, and (3) a developer accidentally ran destructive test cleanup when the skill had broad tool access.

**Which configuration approach fixes all three problems?**

- A) Use positional parameters `$1` and `$2` instead of `$ARGUMENTS` to enforce specific inputs, include explicit schema file references via `@` syntax for context control, and add a frontmatter description warning about destructive operations.
- B) Add `argument-hint` in frontmatter to request required parameters, use `context: fork` to isolate execution, and restrict `allowed-tools` to file-write operations. **[CORRECT]**
- C) Split into `/migration-create` and `/migration-apply` skills, add validation instructions to request migration name if missing, and use different `allowed-tools` scopes for each.
- D) Add validation instructions in the skill SKILL.md to ensure `$ARGUMENTS` is a valid name, add prompts to ignore prior conversation context, and list prohibited operations to avoid.

**Why B:** This uses three separate configuration features to address each problem: `argument-hint` improves argument entry and reduces missing arguments, `context: fork` prevents context leakage from prior conversations, and `allowed-tools` constrains the skill to safe file-writing operations, preventing destructive actions.

---

### Question 40 (Scenario: Code Generation with Claude Code)

**Situation:** Your codebase contains areas with different coding conventions: React components use functional style with hooks, API handlers use async/await with specific error handling, and database models follow the repository pattern. Test files are distributed across the codebase next to the code under test (e.g., `Button.test.tsx` next to `Button.tsx`), and you want all tests to follow the same conventions regardless of location.

**What is the most supported way to ensure Claude automatically applies the correct conventions when generating code?**

- A) Put all conventions in the root CLAUDE.md under headings for each area and rely on Claude to infer which section applies.
- B) Create skills in `.claude/skills/` for each code type, embedding conventions in each SKILL.md.
- C) Place a separate CLAUDE.md file in each subdirectory containing conventions for that area.
- D) Create rule files under `.claude/rules/` with YAML frontmatter specifying glob patterns to conditionally apply conventions based on file paths. **[CORRECT]**

**Why D:** `.claude/rules/` files with YAML frontmatter and glob patterns (e.g., `**/*.test.tsx`, `src/api/**/*.ts`) enable deterministic, path-based convention application regardless of directory structure. This is the most supported approach for cross-cutting patterns like distributed test files.

---

### Question 41 (Scenario: Code Generation with Claude Code)

**Situation:** You want to create a custom slash command `/review` that runs your team’s standard code review checklist. It should be available to every developer when they clone or update the repository.

**Where should you create the command file?**

- A) In `~/.claude/commands/` in each developer’s home directory.
- B) In the project repository under `.claude/commands/`. **[CORRECT]**
- C) In `.claude/config.json` as an array of commands.
- D) In the root project CLAUDE.md.

**Why B:** Putting custom slash commands under `.claude/commands/` inside the project repository ensures they are version-controlled and automatically available to every developer who clones or updates the repo. This is the intended location for project-level custom commands in Claude Code.

---

### Question 42 (Scenario: Code Generation with Claude Code)

**Situation:** Your team’s CLAUDE.md grew beyond 500 lines mixing TypeScript conventions, testing guidance, API patterns, and deployment procedures. Developers find it hard to locate and update the right sections.

**What approach does Claude Code support to organize project-level instructions into focused topical modules?**

- A) Define a `.claude/config.yaml` mapping file patterns to specific sections inside CLAUDE.md.
- B) Create separate Markdown files in `.claude/rules/`, each covering one topic (e.g., `testing.md`, `api-conventions.md`). **[CORRECT]**
- C) Split instructions into README.md files in relevant subdirectories that Claude automatically loads as instructions.
- D) Create multiple files named CLAUDE.md at different levels of the directory tree, each overriding parent instructions.

**Why B:** Claude Code supports a `.claude/rules/` directory where you can create separate Markdown files for topical guidance (e.g., `testing.md`, `api-conventions.md`), allowing teams to organize large instruction sets into focused, maintainable modules.

---

### Question 43 (Scenario: Code Generation with Claude Code)

**Situation:** You create a custom skill `/explore-alternatives` that your team uses to brainstorm and evaluate implementation approaches before choosing one. Developers report that after running the skill, subsequent Claude responses are influenced by the alternatives discussion—sometimes referencing rejected approaches or retaining exploration context that interferes with actual implementation.

**How should you most effectively configure this skill?**

- A) Use the `!` prefix in the skill to run exploration logic as a bash subprocess.
- B) Add `context: fork` in the skill frontmatter. **[CORRECT]**
- C) Split into two skills—`/explore-start` and `/explore-end`—to mark boundaries when exploration context should be discarded.
- D) Create the skill in `~/.claude/skills/` instead of `.claude/skills/`.

**Why B:** `context: fork` runs the skill in an isolated subagent context so exploration discussions do not pollute the main conversation history. This prevents rejected approaches and brainstorming context from influencing subsequent implementation work.

---

### Question 44 (Scenario: Code Generation with Claude Code)

**Situation:** Your team wants to add a GitHub MCP server for searching PRs and checking CI status via Claude Code. Each of six developers has their own personal GitHub access token. You want consistent tooling across the team without committing credentials to version control.

**Which configuration approach is most effective?**

- A) Have each developer add the server in user scope via `claude mcp add --scope user`.
- B) Create an MCP server wrapper that reads tokens from a `.env` file and proxies GitHub API calls, then add the wrapper to the project `.mcp.json`.
- C) Add the server to the project `.mcp.json` using environment variable substitution (`${GITHUB_TOKEN}`) for auth and document the required environment variable in the project README. **[CORRECT]**
- D) Configure the server in project scope with a placeholder token, then tell developers to override it in their local config.

**Why C:** A project `.mcp.json` with environment variable substitution is idiomatic: it provides a single version-controlled source of truth for MCP configuration while letting each developer supply credentials via environment variables. Documenting the variable makes onboarding easy without committing secrets.

---

### Question 45 (Scenario: Code Generation with Claude Code)

**Situation:** You’re adding error-handling wrappers around external API calls across a 120-file codebase. The work has three phases: (1) discover all call sites and patterns, (2) collaboratively design the error-handling approach, and (3) implement wrappers consistently. In Phase 1, Claude generates large output listing hundreds of call sites with context, quickly filling the context window before discovery finishes.

**Which approach is most effective to complete the task while maintaining implementation consistency?**

- A) Use an Explore subagent for Phase 1 to isolate verbose discovery output and return a summary, then continue Phases 2–3 in the main conversation. **[CORRECT]**
- B) Do all phases in the main conversation, periodically using `/compact` to reduce context usage while moving through files.
- C) Switch to headless mode with `--continue`, passing explicit context summaries between batch calls to maintain continuity.
- D) Define the error-handling pattern in CLAUDE.md, then process files in batches across multiple sessions relying on the shared memory file for consistency.

**Why A:** An Explore subagent isolates the verbose discovery output in a separate context and returns only a concise summary to the main conversation. This preserves the main context window for the collaborative design and consistent implementation phases where retained context is most valuable.

---

### Scenario: Customer Support Agent

---

### Question 46 (Scenario: Customer Support Agent)

**Situation:** While testing, you notice the agent often calls `get_customer` when users ask about order status, even though `lookup_order` would be more appropriate. What should you check first to address this problem?

**What should you check first?**

- A) Implement a preprocessing classifier to detect order-related requests and route them directly to `lookup_order`.
- B) Reduce the number of tools available to the agent to simplify choice.
- C) Add few-shot examples to the system prompt covering all possible order request patterns to improve tool selection.
- D) Check the tool descriptions to ensure they clearly differentiate each tool’s purpose. **[CORRECT]**

**Why D:** Tool descriptions are the primary input the model uses to decide which tool to call. When an agent consistently picks the wrong tool, the first diagnostic step is to verify that tool descriptions clearly separate each tool’s purpose and usage boundaries.

---

### Question 47 (Scenario: Customer Support Agent)

**Situation:** Your agent handles single-issue requests with 94% accuracy (e.g., “I need a refund for order #1234”). But when customers include multiple issues in one message (e.g., “I need a refund for order #1234 and also want to update the shipping address for order #5678”), tool selection accuracy drops to 58%. The agent usually solves only one issue or mixes parameters across requests. What approach most effectively improves reliability for multi-issue requests?

**What approach is most effective?**

- A) Implement a preprocessing layer that uses a separate model call to decompose multi-issue messages into separate requests, handle each independently, and merge results.
- B) Combine related tools into fewer universal tools.
- C) Add few-shot examples to the prompt demonstrating correct reasoning and tool sequencing for multi-issue requests. **[CORRECT]**
- D) Implement response validation that detects incomplete answers and automatically reprompts the agent to resolve missed issues.

**Why C:** Few-shot examples that demonstrate correct reasoning and tool sequencing for multi-issue requests are most effective because the agent already performs well on single issues—what it needs is guidance on the pattern for decomposing and routing multiple issues and keeping parameters separated.

---

### Question 48 (Scenario: Customer Support Agent)

**Situation:** Production logs show that for simple requests like “refund for order #1234,” your agent resolves the issue in 3–4 tool calls with 91% success. But for complex requests like “I was billed twice, my discount didn’t apply, and I want to cancel,” the agent averages 12+ tool calls with only 54% success—often investigating issues sequentially and fetching redundant customer data for each. What change most effectively improves handling of complex requests?

**What change is most effective?**

- A) Add explicit verification checkpoints between stages, requiring the agent to record progress after resolving each issue before moving to the next.
- B) Reduce the number of tools by combining `get_customer`, `lookup_order`, and billing-related tools into a single `investigate_issue` tool.
- C) Decompose the request into separate issues, then investigate each in parallel using shared customer context before synthesizing a final resolution. **[CORRECT]**
- D) Add few-shot examples to the system prompt demonstrating ideal tool-call sequences for various multi-faceted billing scenarios.

**Why C:** Decomposing into separate issues and investigating in parallel with shared customer context fixes both key problems: it eliminates redundant data retrieval by reusing shared context across issues and reduces total tool-call loops by parallelizing investigation before synthesizing a single resolution.

---

### Question 49 (Scenario: Customer Support Agent)

**Situation:** Your agent achieves 55% first-contact resolution, well below the 80% target. Logs show it escalates simple cases (standard replacements for damaged goods with photo proof) while trying to handle complex situations requiring policy exceptions autonomously. What is the most effective way to improve escalation calibration?

**What is the most effective way to improve escalation calibration?**

- A) Require the agent to self-rate confidence on a 1–10 scale before each response and automatically route to humans when confidence drops below a threshold.

- B) Deploy a separate classifier model trained on historical tickets to predict which requests need escalation before the main agent starts processing.
- C) Add explicit escalation criteria to the system prompt with few-shot examples showing when to escalate versus resolve autonomously. **[CORRECT]**
- D) Implement sentiment analysis to determine customer frustration level and automatically escalate past a negative sentiment threshold.

**Why C:** Explicit escalation criteria with few-shot examples directly address the root cause—unclear decision boundaries between simple and complex cases. It’s the most proportional, effective first intervention that teaches the agent when to escalate and when to resolve autonomously without extra infrastructure.

---

### Question 50 (Scenario: Customer Support Agent)

**Situation:** After calling `get_customer` and `lookup_order`, the agent has all available system data but still faces uncertainty. Which situation is the most justified trigger for calling `escalate_to_human`?

**Which situation is most justified for escalation?**

- A) A customer wants to cancel an order shipped yesterday and arriving tomorrow. The agent should escalate because the customer might change their mind after receiving the package.
- B) A customer claims they didn’t receive an order, but tracking shows it was delivered and signed for at their address three days ago. The agent should escalate because presenting contradictory evidence could harm the customer relationship.
- C) A customer requests competitor price matching. Your policies allow price adjustments for price drops on your own site within 14 days, but say nothing about competitor prices. The agent should escalate for policy interpretation. **[CORRECT]**
- D) A customer message contains both a billing question and a product return. The agent should escalate so a human can coordinate both issues in one interaction.

**Why C:** This is a genuine policy gap: company rules cover price drops on your own site but do not address competitor price matching. The agent must not invent policy and should escalate for human judgment on how to interpret or extend existing rules.

---

### Question 51 (Scenario: Customer Support Agent)

**Situation:** Production logs show that in 12% of cases your agent skips `get_customer` and calls `lookup_order` directly using only the customer-provided name, sometimes leading to misidentified accounts and incorrect refunds. What change most effectively fixes this reliability problem?

**What change is most effective?**

- A) Add few-shot examples showing that the agent always calls `get_customer` first, even when customers voluntarily provide order details.
- B) Implement a routing classifier that analyzes each request and enables only a subset of tools appropriate for that request type.
- C) Add a programmatic precondition that blocks `lookup_order` and `process_refund` until `get_customer` returns a verified customer identifier. **[CORRECT]**
- D) Strengthen the system prompt stating that customer verification via `get_customer` is mandatory before any order operations.

**Why C:** A programmatic precondition provides a deterministic guarantee that required sequencing is followed. It’s the most effective approach because it eliminates the possibility of skipping verification, regardless of LLM behavior.

---

### Question 52 (Scenario: Customer Support Agent)

**Situation:** Production metrics show that when resolving complex billing disputes or multi-order returns, customer satisfaction scores are 15% lower than for simple cases—even when the resolution is technically correct. Root-cause analysis shows the agent provides accurate solutions but inconsistently explains rationale: sometimes omitting relevant policy details, sometimes missing timeline info or next steps. The specific context gaps vary case by case. You want to improve solution quality without adding human oversight. What approach is most effective?

**What approach is most effective?**

- A) Add a self-critique stage where the agent evaluates a draft response for completeness—ensuring it resolves the customer’s issue, includes relevant context, and anticipates follow-up questions. **[CORRECT]**
- B) Add a confirmation stage where the agent asks “Does this fully resolve your issue?” before closing, allowing customers to request additional information if needed.
- C) Upgrade the model from Haiku to Sonnet for complex cases, routing based on a defined complexity metric.
- D) Implement few-shot examples in the system prompt showing complete explanations for five common complex case types, demonstrating how to include policy context, timelines, and next steps.

**Why A:** A self-critique stage (the evaluator-optimizer pattern) directly addresses inconsistent explanation completeness by forcing the agent to assess its own draft against concrete criteria—such as policy context, timelines, and next steps—before presenting it. This catches case-specific gaps without human oversight.

---

### Question 53 (Scenario: Customer Support Agent)

**Situation:** Production metrics show your agent averages 4+ API loops per resolution. Analysis reveals Claude often requests `get_customer` and `lookup_order` in separate sequential turns even when both are needed initially. What is the most effective way to reduce the number of loops?

**What is the most effective way to reduce loops?**

- A) Implement speculative execution that automatically calls likely-needed tools in parallel with any requested tool and returns all results regardless of what was requested.
- B) Increase `max_tokens` to give Claude more room to plan and naturally combine tool requests.
- C) Create composite tools like `get_customer_with_orders` that bundle common lookup combinations into single calls.
- D) Instruct Claude in the prompt to bundle tool requests into one turn and return all results together before the next API call. **[CORRECT]**

**Why D:** Prompting Claude to bundle related tool requests into a single turn leverages its native ability to request multiple tools at once. It directly fixes the sequential-call pattern with minimal architectural change.

---

### Question 54 (Scenario: Customer Support Agent)

**Situation:** Production logs show a pattern: customers reference specific amounts (e.g., “the 15% discount I mentioned”), but the agent responds with incorrect values. Investigation shows these details were mentioned 20+ turns ago and condensed into vague summaries like “promotional pricing was discussed.” What fix is most effective?

**What fix is most effective?**

- A) Increase the summarization threshold from 70% to 85% so conversations have more room before summarization triggers.
- B) Store full conversation history in external storage and implement retrieval when the agent detects references like “as I mentioned.”
- C) Extract transactional facts (amounts, dates, order numbers) into a persistent “case facts” block included in every prompt outside the summarized history. **[CORRECT]**
- D) Revise the summarization prompt to explicitly preserve all numbers, percentages, dates, and customer-stated expectations verbatim.

**Why C:** Summarization inherently loses precise details. Extracting transactional facts into a structured “case facts” block outside the summarized history preserves critical information so it’s reliably available in every prompt regardless of how many turns have been summarized.

---

### Question 55 (Scenario: Customer Support Agent)

**Situation:** Your `get_customer` tool returns all matches when searching by name. Currently, when there are multiple results, Claude picks the customer with the most recent order, but production data shows this selects the wrong account 15% of the time for ambiguous matches. How should you address this?

**How should you address this?**

- A) Implement a confidence scoring system that acts autonomously above 85% confidence and requests clarification below the threshold.
- B) Instruct Claude to request an additional identifier (email, phone, or order number) when `get_customer` returns multiple matches before taking any customer-specific action. **[CORRECT]**
- C) Modify `get_customer` to return only a single most-likely match based on a ranking algorithm, eliminating ambiguity.
- D) Add few-shot examples to the prompt demonstrating correct reasoning and tool sequencing for ambiguous matches.

**Why B:** Asking the user for an additional identifier is the most reliable way to resolve ambiguity because the user has definitive knowledge of their identity. One extra conversational turn is a small price to pay to eliminate a 15% error rate caused by choosing the wrong account.

---

### Question 56 (Scenario: Customer Support Agent)

**Situation:** Production logs show a consistent pattern: when customers include the word “account” in their message (e.g., “I want to check my account for an order I made yesterday”), the agent calls `get_customer` first 78% of the time. When customers phrase similar requests without “account” (e.g., “I want to check an order I made yesterday”), it calls `lookup_order` first 93% of the time. Tool descriptions are clear and unambiguous. What is the most likely root cause of this discrepancy?

**What is the most likely root cause?**

- A) The system prompt contains keyword-sensitive instructions that steer behavior based on terms like “account,” creating unintended tool-selection patterns. **[CORRECT]**
- B) The model’s base training creates associations between “account” terminology and customer-related operations that override tool descriptions.
- C) The model needs more training data on multi-concept messages and should be fine-tuned on examples containing both account and order terminology.
- D) Tool descriptions need additional negative examples specifying when NOT to use each tool to prevent this keyword-induced confusion.

**Why A:** The systematic keyword-driven pattern (78% vs 93%) strongly indicates explicit routing logic in the system prompt reacting to the word “account” and steering the agent toward customer-related tools. Since tool descriptions are already clear, the discrepancy points to prompt-level instructions creating unintended behavioral steering.

---

### Question 57 (Scenario: Customer Support Agent)

**Situation:** Production logs show the agent often calls `get_customer` when users ask about orders (e.g., “check my order #12345”) instead of calling `lookup_order`. Both tools have minimal descriptions (“Gets customer information” / “Gets order details”) and accept similar-looking identifier formats. What is the most effective first step to improve tool selection reliability?

**What is the most effective first step?**

- A) Implement a routing layer that analyzes user input before each turn and preselects the correct tool based on detected keywords and ID patterns.
- B) Combine both tools into a single `lookup_entity` that accepts any identifier and internally decides which backend to query.
- C) Add few-shot examples to the system prompt demonstrating correct tool selection patterns, with 5–8 examples routing order-related queries to `lookup_order`.
- D) Expand each tool’s description to include input formats, example queries, edge cases, and boundaries explaining when to use it versus similar tools. **[CORRECT]**

**Why D:** Expanding tool descriptions with input formats, example queries, edge cases, and clear boundaries directly fixes the root cause—minimal descriptions that don’t give the LLM enough information to distinguish similar tools. It’s a low-effort, high-impact first step that improves the primary mechanism the LLM uses for tool selection.

---

### Question 58 (Scenario: Customer Support Agent)

**Situation:** You are implementing the agent loop for your support agent. After each Claude API call, you must decide whether to continue the loop (run requested tools and call Claude again) or stop (present the final answer to the customer). What determines this decision?

**What determines this decision?**

- A) Check the `stop_reason` field in Claude’s response—continue if it is `tool_use` and stop if it is `end_turn`. **[CORRECT]**
- B) Parse Claude’s text for phrases like “I’m done” or “Can I help with anything else?”—natural language signals indicate task completion.
- C) Set a maximum iteration count (e.g., 10 calls) and stop when reached, regardless of whether Claude indicates more work is needed.
- D) Check whether the response contains assistant text content—if Claude generated explanatory text, the loop should terminate.

**Why A:** `stop_reason` is Claude’s explicit structured signal for loop control: `tool_use` indicates Claude wants to run a tool and receive results back, while `end_turn` indicates Claude has completed its response and the loop should end.

---

### Question 59 (Scenario: Customer Support Agent)

**Situation:** Production logs show the agent misinterprets outputs from your MCP tools: Unix timestamps from `get_customer`, ISO 8601 dates from `lookup_order`, and numeric status codes (1=pending, 2=shipped). Some tools are third-party MCP servers you cannot modify. Which approach to data format normalization is most maintainable?

**Which approach is most maintainable?**

- A) Use a PostToolUse hook to intercept tool outputs and apply formatting transformations before the agent processes them. **[CORRECT]**
- B) Modify tools you control to return human-readable formats and create wrappers for third-party tools.
- C) Create a `normalize_data` tool that the agent calls after every data retrieval to transform values.
- D) Add detailed format documentation to the system prompt explaining each tool’s data conventions.

**Why A:** A PostToolUse hook provides a centralized, deterministic point to intercept and normalize all tool outputs—including third-party MCP server data—before the agent processes them. It’s more maintainable because transformations live in code and apply uniformly, rather than relying on LLM interpretation.

---

### Question 60 (Scenario: Customer Support Agent)

**Situation:** Production logs show the agent sometimes chooses `get_customer` when `lookup_order` would be more appropriate, especially for ambiguous queries like “I need help with my recent purchase.” You decide to add few-shot examples to the system prompt to improve tool selection. Which approach most effectively addresses the problem?

**Which approach is most effective?**

- A) Add explicit “use when” and “don’t use when” guidance in each tool description covering ambiguous cases.
- B) Add examples grouped by tool—all `get_customer` scenarios together, then all `lookup_order` scenarios.
- C) Add 4–6 examples targeted at ambiguous scenarios, each with rationale for why one tool was chosen over plausible alternatives. **[CORRECT]**
- D) Add 10–15 examples of clear, unambiguous requests demonstrating correct tool choice for typical scenarios for each tool.

**Why C:** Targeting few-shot examples at the specific ambiguous scenarios where errors occur, with explicit rationale for why one tool is preferable to alternatives, teaches the model the comparative decision process needed for edge cases. This is more effective than generic examples or declarative rules.

---

---

## Practical Exercises

### Exercise 1: Multi-tool Agent with Escalation Logic

**Goal:** Design an agent loop with tool integration, structured error handling, and escalation.

**Steps:**
1. Define 3–4 MCP tools with detailed descriptions (include two similar tools to test tool selection)
2. Implement an agent loop checking `stop_reason` (`"tool_use"` / `"end_turn"`)
3. Add structured error responses: `errorCategory`, `isRetryable`, description
4. Implement an interceptor hook that blocks operations above a threshold and routes to escalation
5. Test with multi-aspect requests

**Domains:** 1 (Agent architecture), 2 (Tools and MCP), 5 (Context and reliability)

---

### Exercise 2: Configuring Claude Code for Team Development

**Goal:** Configure CLAUDE.md, custom commands, path-specific rules, and MCP servers.

**Steps:**
1. Create a project-level CLAUDE.md with universal standards
2. Create `.claude/rules/` files with YAML frontmatter for different code areas (`paths: ["src/api/**/*"]`, `paths: ["**/*.test.*"]`)
3. Create a project skill under `.claude/skills/` with `context: fork` and `allowed-tools`
4. Configure an MCP server in `.mcp.json` with environment variables + a personal override in `~/.claude.json`
5. Test planning mode vs direct execution on tasks of different complexity

**Domains:** 3 (Claude Code configuration), 2 (Tools and MCP)

---

### Exercise 3: Structured Data Extraction Pipeline

**Goal:** JSON schemas, `tool_use` for structured output, validation/retry loops, batch processing.

**Steps:**
1. Define an extraction tool with a JSON schema (required/optional fields, enums with "other", nullable fields)
2. Build a validation loop: on error, retry with the document, the incorrect extraction, and the specific validation error
3. Add few-shot examples for documents with different structures
4. Use batch processing via the Message Batches API: 100 documents, handle failures via `custom_id`
5. Route to humans: field-level confidence scores, document-type analysis

**Domains:** 4 (Prompt engineering), 5 (Context and reliability)

---

### Exercise 4: Designing and Debugging a Multi-agent Research Pipeline

**Goal:** Subagent orchestration, context passing, error propagation, synthesis with source tracking.

**Steps:**
1. A coordinator with 2+ subagents (`allowedTools` includes `"Task"`, context is passed explicitly in prompts)
2. Run subagents in parallel via multiple `Task` calls in a single response
3. Require structured subagent output: claim, quote, source URL, publication date
4. Simulate a subagent timeout: return structured error context to the coordinator and continue with partial results
5. Test with conflicting data: preserve both values with attribution; separate confirmed vs disputed findings

**Domains:** 1 (Agent architecture), 2 (Tools and MCP), 5 (Context and reliability)

---

## Exam Strategy

### Time Management
- Internal passer notes observed the real exam at **120 minutes**; the practice exam was observed at **60 questions in 90 minutes**
- Scenario-based questions: read the scenario once carefully, then answer all questions in that scenario
- Read carefully for wording like **most effective**, **first step**, and **best initial fix**
- If stuck: eliminate obvious distractors, then choose the most specific and proportionate fix

### Common Distractor Patterns
1. **Over-engineered** — correct technique but too much for the situation ("deploy a classifier" when "update the prompt" suffices)
2. **Probabilistic when deterministic needed** — "add instruction" when "use hook" is required
3. **Non-existent features** — `CLAUDE_HEADLESS=true`, `--batch` flag, `config.json commands array`
4. **Treats symptom, not cause** — larger context window for attention dilution, retry for absent information
5. **Wrong scope** — user-level config when project-level needed, `get_customer` when `lookup_order` is right

### Highest-Priority Concepts by Weight
1. **Domain 1 (27%):** Agentic loop, hub-and-spoke coordinator, context isolation, hooks vs prompts
2. **Domain 3 (20%):** CLAUDE.md hierarchy, skills frontmatter, `-p` flag, path-scoped rules
3. **Domain 4 (20%):** `tool_choice` options, nullable schema fields, batch API limitations, few-shot targeting
4. **Domain 2 (18%):** Tool descriptions as selection mechanism, `isError` structured errors, MCP scoping
5. **Domain 5 (15%):** Case facts pattern, escalation triggers, structured error propagation, provenance

### Most-Tested Distinctions
- Hooks (deterministic) vs prompt instructions (probabilistic)
- `tool_choice: "auto"` (may skip) vs `"any"` (must call) vs forced (must call specific)
- Batch API (no multi-turn tool calling, no latency SLA) vs synchronous
- User-level `CLAUDE.md` (not shared) vs project-level (version-controlled)
- Subagent context isolation (must pass explicitly) vs automatic inheritance (doesn't exist)
- Access failure vs valid empty result (different error handling)

---

## Pass Readiness

### Minimum Knowledge Required to Pass

If you cannot explain each of the following without looking, you are not ready yet:

- How the raw API loop uses `stop_reason`, and how that differs from using the Agent SDK
- Why tool descriptions are the primary selection mechanism, and when `input_examples` help
- The difference between `tool_choice: "auto"`, `"any"`, forced tool choice, and `"none"`
- Why strict schemas eliminate syntax errors but not semantic errors
- Why hooks/gates beat prompt instructions for compliance-critical workflows
- Why subagents do not inherit parent conversation history and what must be passed explicitly
- How MCP tools differ from MCP resources, and why resources help with context discovery
- How `CLAUDE.md`, `.claude/rules/`, skills, auto memory, and `/memory` fit together
- When to use plan mode, Explore, and independent review sessions
- When to use synchronous requests vs the Message Batches API
- How to preserve critical facts across long sessions and how `/compact` changes context
- When to escalate to a human, and why sentiment/confidence are weak proxies
- How to preserve claim-source mappings, dates, conflicts, and coverage gaps in synthesis output

### Must-Memorize Distinctions

- `CLAUDE.md` is not the system prompt; it is injected as context after the system prompt.
- `Task` and `Agent` refer to subagent spawning; exam wording may still use `Task`.
- `context: fork` isolates a skill invocation; `--fork-session` / `fork_session` concern session branching.
- `tool_choice: "any"` guarantees a tool call but not a semantically correct answer.
- `strict: true` plus tool use constrains schema adherence, not business correctness.
- `tool_choice: "none"` disables tool use even when tools are provided.
- `any` / forced tool choice do not allow a natural-language preamble before the tool call, and they are not compatible with extended thinking.
- If a raw API tool loop uses extended thinking, the returned `thinking` blocks must be preserved exactly when sending tool results back.
- Path-scoped rules and nested `CLAUDE.md` files do not automatically survive compaction; they reload only when relevant files are read again.
- A fresh independent review session is better than self-review in the same reasoning context.

### Most Likely Failure Modes for Claude Code Users

- Knowing the product workflow but not the abstract reason an architecture pattern is correct
- Preferring prompt tweaks when the question is really asking for deterministic enforcement
- Reaching for a bigger model or larger context instead of fixing decomposition, structure, or contracts
- Confusing “structured output” with “correct output”
- Assuming Claude Code behavior generalizes directly to the raw API without understanding the layer boundaries
- Remembering commands and file locations, but not the tradeoffs the exam asks you to judge

---

## Key Documentation Links

| Topic | URL |
|---|---|
| Claude API Messages | https://platform.claude.com/docs/en/api/messages |
| Agent loop internals | https://code.claude.com/docs/en/agent-sdk/agent-loop |
| Agent SDK overview | https://code.claude.com/docs/en/agent-sdk/overview |
| Agent SDK hooks | https://code.claude.com/docs/en/agent-sdk/hooks |
| Agent SDK subagents | https://code.claude.com/docs/en/agent-sdk/subagents |
| Session management | https://code.claude.com/docs/en/agent-sdk/sessions |
| Tool use overview | https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview |
| How tool use works | https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works |
| Message Batches API | https://platform.claude.com/docs/en/build-with-claude/message-batches |
| Batch processing guide | https://platform.claude.com/docs/en/build-with-claude/batch-processing |
| Prompt engineering overview | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview |
| Multishot prompting | https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/multishot-prompting |
| Claude prompting best practices | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices |
| Extended thinking | https://platform.claude.com/docs/en/build-with-claude/extended-thinking |
| Context windows | https://platform.claude.com/docs/en/build-with-claude/context-windows |
| CLAUDE.md / memory | https://code.claude.com/docs/en/memory |
| Skills | https://code.claude.com/docs/en/skills |
| Claude Code overview | https://code.claude.com/docs/en/overview |
| Claude Code headless/CI | https://code.claude.com/docs/en/headless |
| Claude Code GitHub Actions | https://code.claude.com/docs/en/github-actions |
| Claude Code GitLab CI/CD | https://code.claude.com/docs/en/gitlab-ci-cd |
| Claude Code CLI reference | https://code.claude.com/docs/en/cli-usage |
| MCP configuration | https://code.claude.com/docs/en/mcp |
| MCP architecture | https://modelcontextprotocol.io/docs/learn/architecture |
| MCP tools | https://modelcontextprotocol.io/docs/concepts/tools |
| MCP resources | https://modelcontextprotocol.io/docs/concepts/resources |
| MCP servers | https://modelcontextprotocol.io/docs/concepts/servers |
| Anthropic Cookbook | https://github.com/anthropics/anthropic-cookbook |
| Effective harnesses for long-running agents | https://www.anthropic.com/engineering |
| A statistical approach to model evaluations | https://www.anthropic.com/research/statistical-approach-to-model-evals |

---

## Appendix: Technologies and Concepts

| Technology | Key aspects |
|---|---|
| **Claude Agent SDK** | AgentDefinition, agent loops, `stop_reason`, hooks (PostToolUse), spawning subagents via Task, `allowedTools` |
| **Model Context Protocol (MCP)** | MCP servers, tools, resources, `isError`, tool descriptions, `.mcp.json`, environment variables |
| **Claude Code** | CLAUDE.md hierarchy, `.claude/rules/` with glob patterns, `.claude/commands/`, `.claude/skills/` with SKILL.md, planning mode, `/compact`, `--resume`, `fork_session` |
| **Claude Code CLI** | `-p` / `--print`, `--append-system-prompt`, `--output-format json`, `--json-schema`, `--bare` |
| **Claude API** | `tool_use` with JSON schemas, `tool_choice` ("auto"/"any"/forced), `stop_reason`, `max_tokens`, system prompts |
| **Message Batches API** | 50% savings, up to 24-hour window, `custom_id`, no multi-turn tool calling |
| **JSON Schema** | Required vs optional, nullable fields, enum types, "other" + detail, strict mode |
| **Pydantic** | Schema validation, semantic errors, validation/retry loops |
| **Built-in tools** | Read, Write, Edit, Bash, Grep, Glob — purpose and selection criteria |
| **Few-shot prompting** | Targeted examples for ambiguous situations, generalization to new patterns |
| **Prompt chaining** | Sequential decomposition into focused passes |
| **Context window** | Token budgets, progressive summarization, "lost in the middle", scratchpad files |
| **Session management** | Resume, `fork_session`, named sessions, context isolation |
| **Confidence calibration** | Field-level scoring, calibration on labeled sets, stratified sampling |

---

## Out-of-Scope Topics

The following adjacent topics will **NOT** be on the exam:

- Fine-tuning Claude models or training custom models
- Claude API authentication, billing, or account management
- Detailed implementation in specific programming languages or frameworks (beyond what’s needed for tool/schema configuration)
- Deploying or hosting MCP servers (infrastructure, networking, container orchestration)
- Claude’s internal architecture, training process, or model weights
- Constitutional AI, RLHF, or safety training methodologies
- Embedding models or vector database implementation details
- Computer use (browser automation, desktop interaction)
- Image analysis capabilities (Vision)
- Streaming API or server-sent events
- Rate limiting, quotas, or detailed API cost calculations
- OAuth, API key rotation, or authentication protocol details
- Cloud-provider-specific configurations (AWS, GCP, Azure)
- Performance benchmarks or model comparison metrics
- Prompt caching implementation details (beyond knowing it exists)
- Token counting algorithms or tokenization specifics

---

## Preparation Recommendations

1. **Build an agent with the Claude Agent SDK** — implement a full agent loop with tool calling, error handling, and session management. Practice subagents and explicit context passing.

2. **Configure Claude Code for a real project** — use CLAUDE.md hierarchy, path-specific rules in `.claude/rules/`, skills with `context: fork` and `allowed-tools`, and MCP server integration.

3. **Design and test MCP tools** — write descriptions that differentiate similar tools, return structured errors with categories and retry flags, and test against ambiguous user requests.

4. **Build a data extraction pipeline** — use `tool_use` with JSON schemas, validation/retry loops, optional/nullable fields, and batch processing via the Message Batches API.

5. **Practice prompt engineering** — add few-shot examples for ambiguous scenarios, explicit review criteria, and multi-pass architectures for large code reviews.

6. **Study context management patterns** — extract facts from verbose outputs, use scratchpad files, and delegate discovery to subagents to handle context limits.

7. **Understand escalation and human-in-the-loop** — when to escalate (policy gaps, explicit user request, inability to make progress) and confidence-based routing workflows.

8. **Take a practice exam** before the real one. It uses the same scenarios and format.

## Final Exam Tips, Flashcards, and Callouts

> This appendix incorporates internal study materials and notes from exam passers compiled in April 2026. Treat exam logistics here as observed guidance, not permanent policy; operational details can change between exam versions.

### Observed Exam Logistics and Reality Checks

- The exam is scenario-based. Do not study it like a vocabulary test; study it like an architecture judgment test.
- One internal passer note observed the real exam at **120 minutes**, while the practice test gave **90 minutes for 60 questions**. Train your pacing, but expect the real exam to feel deeper and broader.
- One internal note observed a proctored setup requiring `proctorfree-client.dmg`, a laptop with admin privileges, and a single-screen setup. Treat that as an operational heads-up, not a guaranteed permanent requirement.
- One passer observed results taking several days, with exam instructions warning that results may take up to a week.
- One passer observed at least one question containing strikethrough text, suggesting the question bank may still be evolving.
- One passer observed an additional scenario framing, `Conversational AI Assistance`, that did not appear in the practice exam. Do not overfit your preparation to only the six practice-scenario labels.
- One internal note warned against rushing the exam purely because of fee-window timing; it also reported a possible **6-month retake wait** after failure. The practical lesson is simple: do not sit the exam unprepared.

### Common Exam Trap Decision Flows

- **Tool selection problem:** first improve tool descriptions with formats, examples, and boundaries; if ambiguity remains, add targeted few-shot examples; then audit the system prompt for keyword-sensitive steering. Do not start with a routing classifier, preprocessing layer, or tool consolidation.
- **Output inconsistency:** inconsistent format points to few-shot examples; inconsistent completeness points to evaluator-optimizer / self-critique; inconsistent classification points to explicit criteria with concrete examples; inconsistent transformation logic points to concrete input/output examples.
- **Context-size problem:** if upstream outputs are too large, return structured findings instead of verbose content; if tool results bloat context, trim fields aggressively; if long sessions degrade, use scratchpads, `/compact`, and subagent delegation; if critical facts get lost, preserve them in a persistent facts block.

### Quick Flashcards

| Prompt | Answer |
|---|---|
| When does the agentic loop terminate? | When `stop_reason = "end_turn"` at the raw API layer; continue looping on `"tool_use"` |
| Do subagents inherit coordinator context? | No — context must be passed explicitly in each subagent prompt |
| How do you spawn parallel subagents? | Emit multiple `Task` / `Agent` tool calls in a **single** coordinator response |
| Does the Batch API support iterative tool calling? | No — it is asynchronous fire-and-forget, not a multi-turn tool loop |
| First step when tool selection is wrong? | Fix tool descriptions first |
| How do you organize a huge `CLAUDE.md`? | Split it into focused `.claude/rules/` files |
| How do you isolate a skill from main-session context? | Use `context: fork` in `SKILL.md` frontmatter |
| CLI equivalent study point for session forking? | `--fork-session` |
| Claude Code non-interactive CI mode? | `claude -p` / `claude --print` |
| True CLI-side system prompt customization? | `--append-system-prompt` / `--append-system-prompt-file`, not `CLAUDE.md` |
| How do you reduce hallucination in extraction schemas? | Make fields optional / nullable when source docs may not contain them |
| How do you stabilize severity classifications? | Use explicit severity criteria with concrete examples, not vague prose |
| How do you enforce required tool ordering? | Programmatic gates / hooks, not prompt instructions alone |
| What is `PostToolUse` for? | Normalizing heterogeneous tool outputs before Claude reasons over them |
| What does `tool_choice: "any"` guarantee? | Claude must call a tool, not return free-form prose |
| Which `tool_choice` values work with extended thinking? | `auto` and `none` only |
| When should you use the Message Batches API? | For non-blocking, latency-tolerant jobs like overnight reports, weekly audits, and nightly generation tasks |
| System prompt vs user prompt? | System prompt sets behavior and constraints; user prompt is the actual request |

### Ultra-High-Yield Mental Models

- LLMs are probabilistic; production systems must add deterministic controls.
- Tokens are not the solution; structure is.
- A bigger model is not a substitute for better architecture.
- Explicit contracts such as tools, schemas, and structured outputs beat vague natural-language instructions.
- Attention dilution is a quality issue, not just a capacity issue.

### High-Yield Lifecycle Hooks to Remember

| Hook | What to remember |
|---|---|
| `PreToolUse` | Deterministic enforcement point before a tool executes |
| `PostToolUse` | Normalize outputs, enforce policy, and log after tool execution |
| `PreCompact` | Persist critical state before context compaction |
| `SubagentStop` | Validate subagent output and preserve isolated context before integration |
| `SessionStart` | Inject environment defaults, initialize telemetry, or load startup context |

### Skill Frontmatter and CLI Command Callouts

| Item | Why it matters |
|---|---|
| `context: fork` | Isolates verbose or exploratory skill execution |
| `allowed-tools` | Enforces least privilege for a skill |
| `disable-model-invocation` | Prevents automatic model-triggered skill invocation |
| `user-invocable` | Controls whether the skill appears in the slash-command menu |
| `argument-hint` | Makes required parameters explicit during invocation |
| `/compact` | Reduce context usage during long investigations |
| `/context` | Inspect memory / context utilization |
| `/branch [name]` | Create a branch from the current session baseline |
| `/effort [level]` | Trade off speed, cost, and reasoning depth |
| `claude -p` | Non-interactive execution for CI/CD |

### Additional High-Yield Internal Notes

- Tool descriptions are the primary fix for mis-selection; few-shot examples are a secondary fix when descriptions are already good but edge cases still fail.
- Fresh session plus a structured summary can be more reliable than resuming with stale tool results.
- Batch processing is for non-blocking workloads only; up to 24-hour latency makes it a bad fit for pre-merge or interactive workflows.
- Internal study materials use both **few-shot** and **multishot** terminology; treat them as the same family of example-driven prompting techniques.

### Anti-Patterns vs Production Standards

| Anti-pattern | Better production pattern |
|---|---|
| Prompt-based routing for required sequences | Programmatic intercepts and prerequisite gates |
| Monolithic tools with vague descriptions | Granular, single-purpose tools with clear boundaries and explicit differentiation from similar tools |
| Daisy-chaining raw transcripts between agents | Structured upstream outputs first; for larger systems use shared scratchpads, manifests, or shared vector stores / semantic search instead of passing raw logs |
| Expanding enums forever without escape hatches | Add `"other"` plus a detail field, and `"unclear"` where appropriate |
| Silent error suppression | Structured error categories, retryability, and recovery context |
| Procedural micromanagement of subagents | Goal-oriented delegation with explicit quality criteria |

---

*Version 3.0 — Reorganized and deduplicated April 2026. This guide now keeps one consistent study flow while retaining the full question bank, exercises, appendices, and unique internal high-yield notes.*
