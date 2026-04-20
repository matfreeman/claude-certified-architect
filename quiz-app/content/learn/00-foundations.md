---
taskStatement: "0.0"
domain: 0
title: "Cross-Domain Foundations"
minutes: 15
concepts: [Messages API, stop_reason, system prompt, tool_choice, context window]
docLinks:
  - text: "Messages API overview"
    url: "https://platform.claude.com/docs/en/api/messages"
  - text: "Tool use guide"
    url: "https://platform.claude.com/docs/en/build-with-claude/tool-use"
---

## What is this section?

Before diving into any specific domain, you need a working mental model of how Claude works at the API layer. Every domain — agentic loops, tool design, Claude Code config, prompt engineering, context management — builds on these fundamentals.

Read this lesson first. Then read the official docs linked above. Then come back and work through the domains in order.

---

## The Claude Platform: Three Layers

Understanding Claude as a platform means understanding three distinct layers. The exam tests all three, and distractors often put the right answer at the wrong layer.

```
┌─────────────────────────────────────────┐
│           Your Application              │
│   (orchestration, state, UI logic)      │
├─────────────────────────────────────────┤
│           Agent SDK / Claude Code       │
│   (manages loops, tools, sessions)      │
├─────────────────────────────────────────┤
│           Messages API                  │
│   (stateless: one request → one reply)  │
└─────────────────────────────────────────┘
```

- **Messages API** — the raw HTTP layer. Stateless: Claude remembers nothing between calls. You send the full conversation history every time.
- **Agent SDK / Claude Code** — sits on top of the API and manages the tool-call loop, sessions, hooks, and subagents for you.
- **Your application** — orchestrates everything: decides when to call Claude, what context to include, how to handle results.

Most exam questions hinge on which layer a problem belongs to, and which layer is the lightest place to fix it.

---

## The Messages API

A single Messages API request looks like this:

```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 1024,
  "system": "You are a helpful assistant.",
  "messages": [
    { "role": "user",      "content": "Find the bug in auth.py" },
    { "role": "assistant", "content": "I'll read the file now." }
  ],
  "tools": [ ],
  "tool_choice": { "type": "auto" }
}
```

The key fields to know:

| Field | What it does |
|---|---|
| `model` | Which Claude model to use |
| `max_tokens` | Hard cap on output length |
| `system` | Claude's role, constraints, and output expectations — set once per session |
| `messages` | The full conversation so far — you must resend this on every call |
| `tools` | The structured tools Claude can call |
| `tool_choice` | Whether Claude *may* use a tool, *must* use one, or *must* use a specific one |

**Claude has no memory between calls.** Your application is responsible for maintaining and sending the conversation history.

---

## `stop_reason` — the loop control signal

Every API response includes a `stop_reason` that tells you what happened and what to do next.

```
Request → Claude responds
              │
              ├─ stop_reason: "tool_use"    → Execute the tools, append results, call again
              ├─ stop_reason: "end_turn"    → Claude is done. Use the result.
              ├─ stop_reason: "max_tokens"  → Output was cut off. Handle or retry.
              └─ stop_reason: "pause_turn"  → SDK loop hit a boundary. Re-send to continue.
```

If you are using the **Agent SDK**, you do not check `stop_reason` yourself for tool calls — the SDK handles that loop internally. You only inspect the final `ResultMessage` subtype (`success`, `error_max_turns`, etc.).

If you are working directly with the **Messages API**, you own the loop and must handle `stop_reason` yourself.

---

## System prompt vs user prompt

| | System prompt | User prompt |
|---|---|---|
| **Purpose** | Role, constraints, output format, escalation rules | The actual task for this interaction |
| **When it applies** | Every turn in the conversation | The specific request right now |
| **Exam trap** | Keyword-heavy system prompts can accidentally bias tool selection | Putting policy constraints here instead of in the system prompt |

A system prompt saying "always verify customer records first" can make Claude overuse `get_customer` even when a different tool is the right first step. Be precise.

---

## `tool_choice` — controlling tool use

| Value | Behaviour |
|---|---|
| `"auto"` (default) | Claude decides — may respond in text without calling a tool |
| `"any"` | Claude *must* call at least one tool — no plain-text responses |
| `{ "type": "tool", "name": "x" }` | Claude *must* call tool `x` specifically |
| `"none"` | Tools are defined but Claude cannot call them |

Use `"any"` when you need guaranteed structured output instead of prose. Use a forced tool when you need a specific extraction step to run first.

---

## The context window

Everything in a request consumes context space:

```
[ system prompt ] + [ CLAUDE.md + rules ] + [ tool definitions ]
+ [ conversation history ] + [ tool inputs and outputs ]
= total context used
```

**Why this matters:** as conversations grow, tool outputs accumulate. If you don't trim them, you'll hit the context limit — and Claude will start losing important information from the middle of long inputs (the "lost in the middle" effect).

First-line mitigations:
- Trim tool outputs to just the fields you need before appending them
- Put the most important findings at the start or end of long prompts
- Extract critical facts into a persistent structured block rather than leaving them buried in conversation history

---

## 📖 Go deeper

Now read the official documentation for the core concepts above. These pages are short and precise:

- **[Messages API overview](https://platform.claude.com/docs/en/api/messages)** — request structure, response shape, all fields explained
- **[Tool use guide](https://platform.claude.com/docs/en/build-with-claude/tool-use)** — how tools work, `tool_choice`, handling tool results

Come back after reading. The domain lessons build directly on this.

---

## Exam tips

- Questions will mix API-layer and SDK-layer concepts. Always identify which layer the scenario is describing before choosing an answer.
- `stop_reason: "tool_use"` in a question about the Messages API means "execute and continue". In an SDK context it's handled for you.
- System prompt wording that inadvertently biases tool selection is a common question — the fix is always in the system prompt, not in the tools.
- "Lightest effective fix" is the consistent pattern for correct answers across all domains.
