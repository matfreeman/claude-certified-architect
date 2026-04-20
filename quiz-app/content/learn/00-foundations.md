---
taskStatement: "0.0"
domain: 0
title: "Cross-Domain Foundations"
minutes: 10
concepts: [stop_reason, system prompt, context window, message roles, tool_choice, max_tokens]
docLinks:
  - text: "Claude API docs"
    url: "https://platform.claude.com/docs/en/"
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
