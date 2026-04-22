---
id: "exercise-2"
title: "Configure Claude Code for a Team Development Workflow"
minutes: 40
domains: [2, 3]
taskStatements: ["2.4", "3.1", "3.2", "3.3", "3.4"]
prerequisites: ["0.0", "2.4", "3.1", "3.2", "3.3", "3.4"]
deliverables:
  - "A project-level CLAUDE.md with reusable standards"
  - "At least 2 path-scoped rule files"
  - "One project skill or slash command"
  - "An MCP config split between shared and personal scope"
  - "A short note on whether the chosen MCP server exposes tools, resources, prompts, or some combination"
concepts: [CLAUDE.md hierarchy, path rules, skills, MCP configuration, plan mode]
docLinks:
  - text: "Memory and CLAUDE.md"
    url: "https://code.claude.com/docs/en/memory"
  - text: "Skills"
    url: "https://code.claude.com/docs/en/skills"
  - text: "MCP in Claude Code"
    url: "https://code.claude.com/docs/en/mcp"
  - text: "MCP architecture overview"
    url: "https://modelcontextprotocol.io/docs/learn/architecture"
  - text: "Understanding MCP servers"
    url: "https://modelcontextprotocol.io/docs/learn/server-concepts"
  - text: "MCP Inspector"
    url: "https://modelcontextprotocol.io/docs/tools/inspector"
completionMode: "self_attest"
---

## Goal

Set up a Claude Code project so a team can share standards, invoke reusable workflows, and load the right conventions only when relevant files are being edited.

## Why this matters for the exam

The exam repeatedly tests **where configuration belongs** and **when a lighter-weight pattern is better than a heavier one**. This lab gives you practice with the hierarchy and scoping decisions behind Claude Code workflows.

## What to build

Create a small project structure that includes:

- a project-level `CLAUDE.md`
- focused rule files in `.claude/rules/`
- one reusable project skill or slash command
- shared MCP config plus a personal override

## Suggested steps

1. Write a project-level `CLAUDE.md` with universal coding and testing standards.
2. Split specialized rules into path-scoped files for at least two file patterns.
3. Create a skill with `context: fork` and explicit `allowed-tools`.
4. Configure one shared MCP server in `.mcp.json`.
5. Document one personal-only server or override in `~/.claude.json`.
6. Inspect the chosen MCP server and record whether it exposes tools, resources, prompts, or some combination.
7. For one common team workflow, decide whether a resource or prompt would be better than adding another tool.
8. Try at least three tasks and decide whether each should use direct execution or plan mode.

## Deliverables

- Final folder structure
- Example rule frontmatter with glob paths
- Skill frontmatter showing isolation and tool restrictions
- A short MCP capability note: tools vs resources vs prompts for the chosen server
- A short decision log explaining when you chose plan mode vs direct execution

## Self-review checklist

- Are team-wide defaults in project scope rather than personal scope?
- Are path-specific rules solving a real token or relevance problem?
- Does the skill use `context: fork` only when isolation is actually valuable?
- Is the MCP split clear between shared and personal configuration?
- Did you identify the right MCP primitive for the workflow instead of treating every integration need as a tool?
- Could another developer clone the repo and benefit from the setup immediately?

## Related domains

- Domain 2: MCP integration
- Domain 3: Claude Code configuration, skills, path rules, and planning mode
