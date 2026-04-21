---
id: "exercise-1"
title: "Build a Multi-Tool Agent with Escalation Logic"
minutes: 45
domains: [1, 2, 5]
taskStatements: ["1.1", "1.4", "2.1", "2.2", "5.2"]
prerequisites: ["0.0", "1.1", "1.4", "2.1", "2.2", "5.2"]
deliverables:
  - "At least 3 differentiated MCP tools with precise descriptions and boundaries"
  - "An agent loop that handles tool_use vs end_turn correctly"
  - "Structured tool errors with retryability and category metadata"
  - "A deterministic escalation or compliance gate"
concepts: [agentic loop, hooks, structured errors, escalation, tool design]
docLinks:
  - text: "Tool use overview"
    url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview"
  - text: "Hooks guide"
    url: "https://code.claude.com/docs/en/agent-sdk/hooks"
  - text: "Handling stop reasons"
    url: "https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons"
completionMode: "self_attest"
---

## Goal

Design a realistic customer-facing agent that can use tools, recover from errors, and escalate to a human when it should not proceed autonomously.

## Why this matters for the exam

This lab reinforces one of the exam's most common architectural themes: **probabilistic model behavior needs deterministic system controls**. It forces you to combine loop handling, tool design, structured error signaling, and escalation logic in one workflow.

## Recommended scenario

Use a customer support or operations scenario where the agent may need to:

- look up an account or order
- validate customer details
- perform or deny an action
- escalate when policy or authority limits are hit

## What to build

Create a small agent workflow with at least three tools. A good baseline set is:

1. `lookup_customer`
2. `lookup_order`
3. `request_refund`
4. `escalate_to_human`

At least two tools should be similar enough that their descriptions need real care to avoid ambiguity.

## Suggested steps

1. Define the tool interfaces with names, descriptions, expected inputs, and clear boundaries.
2. Implement the loop logic so the application continues on `tool_use` and exits on `end_turn`.
3. Return structured MCP-style errors for validation, transient, or permission failures.
4. Add a deterministic gate that blocks unsafe downstream actions until prerequisites are satisfied.
5. Test with edge cases:
   - explicit request for a human
   - missing customer identity
   - transient dependency failure
   - business rule violation

## Deliverables

- Tool definitions with differentiated descriptions
- A short explanation of your loop control logic
- Example structured error payloads
- Evidence of deterministic escalation or blocking logic

## Self-review checklist

- Does the loop use `stop_reason`, not text heuristics, to decide whether to continue?
- Can the agent distinguish between similar tools from their descriptions alone?
- Are structured errors rich enough for recovery decisions?
- Is escalation triggered by explicit criteria rather than sentiment or guesswork?
- Is any safety-critical step enforced in code rather than only in prompts?

## Related domains

- Domain 1: agent loops and workflow enforcement
- Domain 2: tool design and MCP-style error handling
- Domain 5: escalation patterns
