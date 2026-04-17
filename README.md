# Claude Certified Architect – Study Quiz

An interactive study quiz for the [Claude Certified Architect: Foundations](https://anthropic.com) certification exam. 40 scenario-based multiple-choice questions across all 5 exam domains, with detailed explanations and direct links to the official Claude documentation.

**Live site:** https://matfreeman.github.io/claude-certified-architect/

## Exam domains

| Domain | Weight |
|---|---|
| 1. Agentic Architecture & Orchestration | 27% |
| 2. Tool Design & MCP Integration | 18% |
| 3. Claude Code Configuration & Workflows | 20% |
| 4. Prompt Engineering & Structured Output | 20% |
| 5. Context Management & Reliability | 15% |

## Adding or editing questions

Questions live in [`quiz-app/content/questions/`](quiz-app/content/questions/), one YAML file per domain:

```
quiz-app/content/questions/
  domain-1.yaml   ← Agentic Architecture & Orchestration
  domain-2.yaml   ← Tool Design & MCP Integration
  domain-3.yaml   ← Claude Code Configuration & Workflows
  domain-4.yaml   ← Prompt Engineering & Structured Output
  domain-5.yaml   ← Context Management & Reliability
```

To add a question, append to the relevant file:

```yaml
- id: d1_my_new_question
  taskStatement: "1.2"
  question: |
    Your question text here...
  options:
    A: "Option A"
    B: "Option B"
    C: "Option C"
    D: "Option D"
  correct: B
  explanation: |
    Why B is correct...
  docLink:
    text: "Relevant docs"
    url: "https://code.claude.com/docs/..."
  optionLinks:
    A:
      text: "Docs for option A"
      url: "https://..."
    B:
      text: "Docs for option B"
      url: "https://..."
```

Push to `main` and GitHub Actions will rebuild and redeploy automatically.

## Stack

- React 18 + TypeScript + Vite
- Questions in YAML, loaded at build time via `import.meta.glob`
- No external CSS frameworks — custom properties for light/dark theming
- Deployed to GitHub Pages via GitHub Actions
