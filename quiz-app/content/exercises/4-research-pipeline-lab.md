---
id: "exercise-4"
title: "Design and Debug a Multi-Agent Research Pipeline"
minutes: 55
domains: [1, 2, 5]
taskStatements: ["1.2", "1.3", "2.3", "5.3", "5.6"]
prerequisites: ["0.0", "1.2", "1.3", "2.3", "5.3", "5.6"]
deliverables:
  - "A coordinator-subagent design with explicit context passing"
  - "Parallel subagent execution plan"
  - "Structured subagent outputs with provenance fields"
  - "An error propagation strategy with partial-result handling"
concepts: [subagents, explicit context passing, tool distribution, error propagation, provenance]
docLinks:
  - text: "Subagents"
    url: "https://code.claude.com/docs/en/agent-sdk/subagents"
  - text: "MCP introduction"
    url: "https://modelcontextprotocol.io/introduction"
  - text: "Context windows"
    url: "https://platform.claude.com/docs/en/build-with-claude/context-windows"
completionMode: "self_attest"
---

## Goal

Build a research workflow where a coordinator delegates to multiple subagents, preserves provenance, and still produces a useful final answer when one part of the system fails.

## Why this matters for the exam

This is one of the clearest "architect" exercises in the course. It tests whether you understand not just how to split work, but how to preserve context quality, reduce duplication, and avoid hiding uncertainty in the final synthesis.

## Recommended scenario

Use a multi-source research question such as:

- compare vendor capabilities
- synthesize research findings
- investigate an industry trend across multiple source types

## Suggested steps

1. Define a coordinator and at least two specialized subagents.
2. Make the coordinator pass all required context explicitly rather than relying on inheritance.
3. Restrict tool access by role so each subagent has the smallest useful set.
4. Have the coordinator emit multiple subagent calls in parallel where possible.
5. Require subagents to return structured outputs that include claim, evidence, source, and publication date.
6. Simulate a failure in one subagent and decide whether the coordinator should retry, proceed with partial results, or stop.
7. Render the final output so confirmed findings, conflicts, and gaps are visible.

## Deliverables

- Coordinator brief
- Subagent definitions and tool scopes
- Structured output shape for findings
- Example final report format showing attribution and coverage gaps

## Self-review checklist

- Does every subagent receive the context it needs explicitly?
- Are parallel calls used only where tasks are truly independent?
- Can the coordinator make recovery decisions from the error payload alone?
- Is provenance preserved through synthesis rather than flattened away?
- Does the final report expose uncertainty instead of smoothing it over?

## Related domains

- Domain 1: coordination, delegation, context passing
- Domain 2: tool scoping and distribution
- Domain 5: error propagation and provenance
