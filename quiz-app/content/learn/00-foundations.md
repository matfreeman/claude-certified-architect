---
taskStatement: "0.0"
domain: 0
title: "Cross-Domain Foundations"
minutes: 12
concepts: [stop_reason, system prompt, context window, message roles, tool_choice, max_tokens]
docLinks:
  - text: "Claude API docs"
    url: "https://platform.claude.com/docs/en/"
---

## How to read this exam

The exam tests **architectural judgment**, not feature recall. For every question, ask yourself four things:

> **1. What layer is the problem at?**
> Prompt problem · Tool-definition problem · Workflow/orchestration problem · Deterministic enforcement problem
>
> **2. What scope is the question asking for?**
> First fix · Ultimate system design · Root cause · Immediate symptom
>
> **3. Is the best answer lighter than the distractors?**
> Correct answers are almost always the *lightest* effective fix. Distractors are plausible but too heavy, too vague, or at the wrong layer.
>
> **4. Does the situation require a guarantee or a suggestion?**
> Financial consequences, security, compliance → hooks/programmatic enforcement (deterministic).
> Style, preferences, soft guidelines → prompt instructions (probabilistic).

Memorise these four questions. Every domain tests them.

---

## 9 concepts to master before anything else

If these are shaky, you are not ready — even if you are productive in Claude Code day to day.

| Concept | One-line definition |
|---|---|
| `stop_reason` | The signal that tells your loop what to do next. `"tool_use"` = execute tools. `"end_turn"` = done. |
| `tool_choice` | Controls whether Claude *may* call a tool (`auto`), *must* call one (`any`), or *must* call a specific one. |
| Hooks vs prompts | Hooks = deterministic guarantees. Prompts = probabilistic compliance (~85–95%). Use hooks when you need certainty. |
| Subagent context isolation | A subagent sees only what you explicitly put in its prompt. It does NOT inherit the coordinator's history. |
| MCP `isError` flag | How MCP tools signal failures. Transient errors are retryable. Business/validation errors are not. |
| MCP tools vs resources | Tools = callable functions. Resources = content catalogs exposed upfront. |
| CLAUDE.md vs rules vs skills | CLAUDE.md = always-loaded instructions. Rules = conditional by path. Skills = invocable workflows with frontmatter. |
| Batch vs synchronous | Batch API = async, 50% cheaper, 24h SLA, no multi-turn. Synchronous = real-time, supports conversation. |
| Escalation & provenance | Know when to escalate (explicit request, policy gap, ambiguity). Know how to attribute claims to sources. |

---

## Cross-Domain Foundations

These concepts appear across all 5 domains. Read this before any domain lesson.

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

**Fields worth memorising:**
- `model`: which Claude model to use
- `max_tokens`: output cap
- `system`: behavior, constraints, and role
- `messages`: the current conversation history
- `tools`: the available structured tools
- `tool_choice`: whether Claude may skip tools, must call a tool, or must call a specific tool

**Message roles:**
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

> **Exam distinction:** if you're using the Agent SDK, the SDK drives the loop for you. If you're reasoning about the Messages API directly, you own the loop.

### System prompt vs user prompt

| Prompt type | Purpose |
|---|---|
| System prompt | Sets behavior, role, constraints, escalation rules, and output expectations |
| User prompt | The actual task or request for the current interaction |

**Important nuance:** system prompt wording can accidentally bias tool selection. A keyword-heavy instruction like "always verify customer records first" can make Claude overuse `get_customer` even when `lookup_order` is the better first tool.

### Context window fundamentals

Everything below consumes context:
- system prompt
- `CLAUDE.md` and rules
- tool definitions
- prior conversation turns
- tool inputs and outputs

**Context failure modes (tested across all domains):**
- *Lost in the middle*: important mid-input findings get underweighted
- *Tool result bloat*: 40 returned fields when only 5 matter
- *Progressive summarization loss*: dates, percentages, IDs, and customer expectations get blurred

**First-line mitigations:**
- Put key findings at the beginning or end of long prompts
- Trim tool outputs before they accumulate
- Preserve critical facts in a structured facts block
- Prefer structured upstream outputs over passing raw transcripts downstream
