# Question Authoring PRD — Claude Certified Architect Foundations

## 1. Objective

Produce **100+ high-quality, scenario-based multiple-choice questions per exam domain** (500+ total) for the Claude Certified Architect — Foundations practice exam. Every question must:

- Be grounded in a **realistic production scenario** drawn from the exam guide
- Map to a **specific Task Statement** from the exam content outline
- Include **verified, deep-linked documentation references** so students can study the exact source material
- Test **practical judgment about tradeoffs**, not rote memorization

---

## 2. Exam Structure Reference

| Domain | Weight | Target Qs (min) |
|--------|--------|-----------------|
| 1: Agentic Architecture & Orchestration | 27% | 100 |
| 2: Tool Design & MCP Integration | 18% | 100 |
| 3: Claude Code Configuration & Workflows | 20% | 100 |
| 4: Prompt Engineering & Structured Output | 20% | 100 |
| 5: Context Management & Reliability | 15% | 100 |

### Exam Scenarios (questions must be mapped to one)

1. **Customer Support Resolution Agent** — Agent SDK, MCP tools, escalation
2. **Code Generation with Claude Code** — Claude Code config, workflows
3. **Multi-Agent Research System** — Orchestration, subagents, synthesis
4. **Developer Productivity with Claude** — Built-in tools, MCP, codebase exploration
5. **Claude Code for Continuous Integration** — CI/CD, `-p` flag, structured output
6. **Structured Data Extraction** — JSON schemas, tool_use, batch processing

---

## 3. Question Schema (YAML)

Every question is stored in `quiz-app/content/questions/domain-{N}.yaml` and must conform to this schema:

```yaml
- id: <string>             # Unique ID. Format: d{domain}_{topic}_{seq} e.g. d1_hooks_02
  scenario: <string>       # One of the 6 exam scenarios (exact name match)
  taskStatement: <string>  # Task statement number e.g. "1.4", "2.1"
  question: |              # Multi-line scenario + question stem
    <scenario context — 2-4 sentences setting up a realistic production situation>
    <specific observable problem or decision point>
    <clear question asking for the best action/root cause/approach>
  options:
    A: <string>            # The correct answer (or a distractor)
    B: <string>
    C: <string>
    D: <string>
  correct: <A|B|C|D>       # Single correct answer
  explanation: |            # Multi-line explanation
    <Why the correct answer is correct — cite the specific concept>
    <Why each distractor is wrong — specific reason per option>
  docLink:                  # Primary documentation reference for the concept tested
    text: <string>          # Human-readable link text
    url: <string>           # Verified, active URL (see Section 6)
  optionLinks:              # One doc link per option — where the student would learn about that concept
    A:
      text: <string>
      url: <string>
    B:
      text: <string>
      url: <string>
    C:
      text: <string>
      url: <string>
    D:
      text: <string>
      url: <string>
```

---

## 4. Question Quality Requirements

### 4.1 Scenario Realism

- Every question must open with a **concrete production context** (what you're building, what's observed, what metric is affected)
- Use **specific, measurable details**: "12% of cases", "14 files across the stock tracking module", "40% latency increase"
- Avoid abstract phrasing like "Which approach is best for handling errors?" — instead paint the scene first

### 4.2 Correct Answer Criteria

- The correct answer must be **unambiguously the best choice** — not just "a good idea"
- It must address the **root cause**, not a symptom
- It must be the **proportionate response** — not over-engineered for the problem described
- It must align with documented best practices from Anthropic's official documentation

### 4.3 Distractor Design

Each of the 3 distractors must be:

- **Plausible** — a candidate with partial knowledge might choose it
- **Wrong for a specific, articulable reason** — not obviously absurd
- Drawn from one of these distractor archetypes:
  1. **Addresses a different problem** — correct technique, wrong situation (e.g., sentiment analysis for complexity-based escalation)
  2. **Over-engineered** — valid approach but disproportionate as a first step (e.g., ML classifier when prompt optimization hasn't been tried)
  3. **Probabilistic where deterministic is needed** — prompt-based fix when programmatic enforcement is required
  4. **Treats symptom, not cause** — workaround that doesn't fix the underlying issue (e.g., larger context window for attention dilution)
  5. **Anti-pattern** — explicitly documented bad practice (e.g., arbitrary iteration caps as primary stopping mechanism)
  6. **Non-existent feature** — references a flag, API, or config that doesn't exist (e.g., `CLAUDE_HEADLESS=true`)

### 4.4 Explanation Standards

The explanation must:
- State **why the correct answer works** — reference the specific concept/mechanism
- State **why each distractor is wrong** — one sentence per distractor minimum
- Never use "obviously wrong" or "clearly incorrect" — explain the reasoning gap

### 4.5 Difficulty Distribution

Target across each domain's 100 questions:
- **30% Foundational** — tests knowledge of a single concept (e.g., "What does stop_reason: tool_use mean?")
- **50% Applied** — tests application of a concept to a scenario (e.g., "Your agent skips verification in 12%...")
- **20% Analysis** — tests judgment across multiple competing concerns (e.g., "85% simple fact-checks, 15% complex...")

### 4.6 Task Statement Coverage

- Every Task Statement in the exam guide must have **at least 8 questions**
- Track coverage with a matrix: `{domain}.{taskStatement}` -> count
- Prioritize under-represented task statements in each authoring batch

---

## 5. Authoring Pipeline — Step by Step

### Phase 1: Research & Source Documentation

**Goal:** For the target Task Statement, find the exact documentation pages that teach the tested concept.

**Actions:**

1. **Read the Task Statement** from `exam-guide.md` — extract every "Knowledge of" and "Skills in" bullet
2. **Search primary documentation** for each concept. The three documentation sites are:

   | Site | Base URL | Content |
   |------|----------|---------|
   | Claude Code Docs | `https://code.claude.com/docs/en/` | Claude Code, Agent SDK, hooks, skills, MCP config, sessions |
   | Anthropic Platform Docs | `https://platform.claude.com/docs/en/` | Claude API, tool_use, prompt engineering, batch processing, context windows |
   | MCP Specification | `https://modelcontextprotocol.io/` | MCP protocol, server/client concepts, architecture |

3. **Find the specific page** that covers the concept. Use the documentation indexes:
   - Claude Code: `https://code.claude.com/docs/llms.txt`
   - MCP: `https://modelcontextprotocol.io/llms.txt`
   - Platform: `https://platform.claude.com/docs/llms.txt`

4. **Verify the URL is live** — fetch the page and confirm it contains the relevant concept. Never use a generic landing page when a specific deep link exists.

**Key URL Mappings (verified April 2026):**

| Concept | Correct URL |
|---------|-------------|
| Agentic loops / stop_reason | `https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview` |
| How tool use works (loop details) | `https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works` |
| Tool definitions & schemas | `https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview` |
| Handling stop reasons | `https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons` |
| tool_choice configuration | `https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview` |
| Prompt engineering overview | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview` |
| Prompting best practices | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices` |
| Batch processing / Message Batches API | `https://platform.claude.com/docs/en/build-with-claude/batch-processing` |
| Context windows | `https://platform.claude.com/docs/en/build-with-claude/context-windows` |
| Extended thinking | `https://platform.claude.com/docs/en/build-with-claude/extended-thinking` |
| Streaming | `https://platform.claude.com/docs/en/build-with-claude/streaming` |
| Agent SDK overview | `https://code.claude.com/docs/en/agent-sdk/overview` |
| Agent SDK hooks | `https://code.claude.com/docs/en/agent-sdk/hooks` |
| Agent SDK subagents | `https://code.claude.com/docs/en/agent-sdk/subagents` |
| Agent SDK sessions | `https://code.claude.com/docs/en/agent-sdk/sessions` |
| Agent SDK custom tools | `https://code.claude.com/docs/en/agent-sdk/custom-tools` |
| Agent SDK MCP integration | `https://code.claude.com/docs/en/agent-sdk/mcp` |
| Agent SDK permissions | `https://code.claude.com/docs/en/agent-sdk/permissions` |
| Agent SDK structured output | `https://code.claude.com/docs/en/agent-sdk/structured-outputs` |
| Agent loop internals | `https://code.claude.com/docs/en/agent-sdk/agent-loop` |
| Claude Code — CLAUDE.md / memory | `https://code.claude.com/docs/en/memory` |
| Claude Code — skills | `https://code.claude.com/docs/en/skills` |
| Claude Code — slash commands | `https://code.claude.com/docs/en/commands` |
| Claude Code — hooks guide | `https://code.claude.com/docs/en/hooks-guide` |
| Claude Code — hooks reference | `https://code.claude.com/docs/en/hooks` |
| Claude Code — MCP configuration | `https://code.claude.com/docs/en/mcp` |
| Claude Code — subagents | `https://code.claude.com/docs/en/sub-agents` |
| Claude Code — GitHub Actions | `https://code.claude.com/docs/en/github-actions` |
| Claude Code — CLI reference | `https://code.claude.com/docs/en/cli-reference` |
| Claude Code — settings | `https://code.claude.com/docs/en/settings` |
| Claude Code — permissions | `https://code.claude.com/docs/en/permissions` |
| Claude Code — .claude directory | `https://code.claude.com/docs/en/claude-directory` |
| Claude Code — best practices | `https://code.claude.com/docs/en/best-practices` |
| Claude Code — context window | `https://code.claude.com/docs/en/context-window` |
| Claude Code — common workflows | `https://code.claude.com/docs/en/common-workflows` |
| Claude Code — headless / programmatic | `https://code.claude.com/docs/en/headless` |
| MCP — introduction | `https://modelcontextprotocol.io/introduction` |
| MCP — architecture | `https://modelcontextprotocol.io/docs/learn/architecture` |
| MCP — server concepts | `https://modelcontextprotocol.io/docs/learn/server-concepts` |
| MCP — client concepts | `https://modelcontextprotocol.io/docs/learn/client-concepts` |
| MCP — build a server | `https://modelcontextprotocol.io/docs/develop/build-server` |
| MCP — build a client | `https://modelcontextprotocol.io/docs/develop/build-client` |

### Phase 2: Scenario Construction

**Goal:** Build a realistic production scenario that naturally requires the tested concept.

**Actions:**

1. **Select an exam scenario** from the 6 available (match the domain)
2. **Define the observable problem** — what metric is off? What behavior is unexpected? What decision must be made?
3. **Add specific details** — numbers, file counts, tool names, error messages, log observations
4. **Ensure the scenario cannot be answered by rote** — the student must reason about tradeoffs

**Scenario Templates:**

- **Diagnostic**: "Production data shows X. Investigation reveals Y. What is the root cause?"
- **Architecture Decision**: "You need to design X. Requirement A and B are in tension. Which approach..."
- **Fix/Remediation**: "Your system exhibits behavior X (with metrics). What change most effectively..."
- **Configuration**: "Your team needs X capability. Which configuration/location/setting..."

### Phase 3: Question Drafting

**Goal:** Write the question stem, 4 options, correct answer, and explanation.

**Actions:**

1. **Write the question stem** following the scenario template
2. **Write the correct answer first** — ensure it directly addresses root cause
3. **Write 3 distractors** — each from a different distractor archetype (Section 4.3)
4. **Randomize option placement** — correct answer should NOT always be A. Distribute roughly evenly across A/B/C/D
5. **Write the explanation** covering correct answer + each distractor
6. **Assign documentation links** — `docLink` for the primary concept, `optionLinks` for each option's learning path

### Phase 4: Quality Validation Checklist

Before adding any question to the bank, verify:

- [ ] **Unique concept**: not a duplicate or near-duplicate of an existing question
- [ ] **Scenario realism**: opens with concrete production context, not abstract theory
- [ ] **Single best answer**: correct answer is unambiguously best, not "also correct"
- [ ] **Distractor quality**: each distractor is plausible and wrong for a stated reason
- [ ] **Root cause focus**: correct answer addresses root cause, not symptom
- [ ] **Proportionate response**: correct answer is right-sized (not over-engineered)
- [ ] **Explanation completeness**: explains correct + each distractor individually
- [ ] **Doc links verified**: every URL resolves to a live page with relevant content
- [ ] **Doc links specific**: no generic landing pages; links go to the specific concept page
- [ ] **Task statement aligned**: question tests a specific Knowledge/Skill from the task statement
- [ ] **ID unique**: question ID doesn't conflict with existing IDs in the domain file
- [ ] **YAML valid**: question parses as valid YAML with no syntax errors

---

## 6. Documentation Link Standards

### Rules

1. **Every URL must be verified live** before inclusion — fetch the page and confirm it loads
2. **Use the most specific page available** — not a parent/overview page when a dedicated page exists
3. **`docLink`** points to the primary concept the question tests
4. **`optionLinks`** point to where a student would learn about each option's concept (even distractors)
5. **Never fabricate URLs** — if a specific page doesn't exist, use the nearest real parent page
6. **Prefer deep sections** — append `#section-anchor` when the concept is in a subsection of a larger page

### URL Verification Process

For each URL in a question:
1. Fetch the page with `curl -sL <url> | head -50` or WebFetch
2. Confirm the page returns 200 (not 404 or redirect to generic page)
3. Confirm the page content covers the concept being linked
4. If the URL redirects, use the final destination URL

### Deprecated/Changed URL Patterns

The existing question bank uses some URLs that may be outdated. When authoring new questions:

| Old Pattern | Current Pattern |
|-------------|-----------------|
| `https://code.claude.com/docs/en/agent-sdk/overview` (generic) | Use specific sub-pages: `/hooks`, `/subagents`, `/sessions`, `/agent-loop` |
| `https://code.claude.com/docs` (bare) | Use specific pages: `/en/memory`, `/en/skills`, `/en/mcp`, etc. |
| `https://platform.claude.com/docs/en/build-with-claude/tool-use` | Now: `/docs/en/agents-and-tools/tool-use/overview` |
| `https://platform.claude.com/docs/en/build-with-claude/overview` (generic) | Use specific pages: `/context-windows`, `/batch-processing`, `/streaming`, etc. |

---

## 7. ID Naming Convention

Format: `d{domain}_{concept}_{sequence}`

- `d1_loop_01` — Domain 1, agentic loop concept, sequence 01
- `d2_iserror_03` — Domain 2, isError concept, sequence 03
- `d3_rules_02` — Domain 3, path-specific rules concept, sequence 02
- `d4_fewshot_05` — Domain 4, few-shot prompting concept, sequence 05
- `d5_litm_01` — Domain 5, lost-in-the-middle concept, sequence 01

Check existing IDs in each domain file before assigning to avoid conflicts.

---

## 8. Coverage Tracking

Maintain a coverage matrix. Current state (as of initial authoring):

### Domain 1 — Agentic Architecture & Orchestration (10 existing Qs)

| Task Statement | Description | Existing Qs | Target |
|---------------|-------------|-------------|--------|
| 1.1 | Agentic loop lifecycle | 1 | 12+ |
| 1.2 | Multi-agent coordinator patterns | 2 | 12+ |
| 1.3 | Subagent invocation & context | 2 | 12+ |
| 1.4 | Multi-step workflows & enforcement | 1 | 12+ |
| 1.5 | Agent SDK hooks | 1 | 12+ |
| 1.6 | Task decomposition strategies | 1 | 12+ |
| 1.7 | Session state & resumption | 2 | 12+ |

### Domain 2 — Tool Design & MCP Integration (7 existing Qs)

| Task Statement | Description | Existing Qs | Target |
|---------------|-------------|-------------|--------|
| 2.1 | Tool interface design | 1 | 12+ |
| 2.2 | Structured error responses | 2 | 12+ |
| 2.3 | Tool distribution & tool_choice | 2 | 12+ |
| 2.4 | MCP server configuration | 1 | 12+ |
| 2.5 | Built-in tools | 1 | 12+ |

### Domain 3 — Claude Code Configuration & Workflows (7 existing Qs)

| Task Statement | Description | Existing Qs | Target |
|---------------|-------------|-------------|--------|
| 3.1 | CLAUDE.md hierarchy | 1 | 12+ |
| 3.2 | Custom commands & skills | 2 | 12+ |
| 3.3 | Path-specific rules | 1 | 12+ |
| 3.4 | Plan mode vs direct execution | 2 | 12+ |
| 3.5 | Iterative refinement | 0 | 12+ |
| 3.6 | CI/CD integration | 1 | 12+ |

### Domain 4 — Prompt Engineering & Structured Output (8 existing Qs)

| Task Statement | Description | Existing Qs | Target |
|---------------|-------------|-------------|--------|
| 4.1 | Explicit criteria & precision | 2 | 12+ |
| 4.2 | Few-shot prompting | 1 | 12+ |
| 4.3 | Structured output via tool_use | 1 | 12+ |
| 4.4 | Validation & retry loops | 1 | 12+ |
| 4.5 | Batch processing strategies | 2 | 12+ |
| 4.6 | Multi-instance review | 1 | 12+ |

### Domain 5 — Context Management & Reliability (8 existing Qs)

| Task Statement | Description | Existing Qs | Target |
|---------------|-------------|-------------|--------|
| 5.1 | Conversation context management | 2 | 12+ |
| 5.2 | Escalation & ambiguity resolution | 2 | 12+ |
| 5.3 | Error propagation | 1 | 12+ |
| 5.4 | Large codebase context management | 1 | 12+ |
| 5.5 | Human review & confidence calibration | 1 | 12+ |
| 5.6 | Information provenance | 1 | 12+ |

---

## 9. Batch Authoring Instructions for Agents

When assigned a batch of questions to write, follow this exact workflow:

### Input

You will receive:
- A target domain (1-5)
- A target task statement (e.g., "3.5")
- A target count (e.g., "write 10 questions")
- The exam guide (`exam-guide.md`) for reference
- The existing question file (`quiz-app/content/questions/domain-{N}.yaml`)

### Workflow

1. **Read the exam guide** — extract all Knowledge/Skill bullets for the target task statement
2. **Read existing questions** — understand what's already covered; avoid duplicates
3. **Research documentation** — for each Knowledge/Skill bullet:
   a. Search the appropriate documentation site
   b. Find the specific page that covers this concept
   c. Verify the URL is live and contains the concept
   d. Record the URL for use in questions
4. **Plan questions** — for each Knowledge/Skill bullet, plan 2-3 questions testing different aspects:
   - One foundational question testing the concept directly
   - One applied question embedding the concept in a scenario
   - One analysis question requiring tradeoff judgment
5. **Draft questions** — write each question following the schema and quality requirements
6. **Self-validate** — run through the Quality Validation Checklist (Section 4) for each question
7. **Assign IDs** — check existing IDs, assign non-conflicting IDs following the naming convention
8. **Append to domain file** — add questions to the YAML file

### Output

- Updated `quiz-app/content/questions/domain-{N}.yaml` with new questions appended
- Summary of what was added: count, task statements covered, any coverage gaps remaining

---

## 10. Common Pitfalls to Avoid

1. **Testing recall instead of judgment** — "What flag runs Claude Code non-interactively?" is low-value. Instead: "Your CI pipeline hangs when running Claude Code. Logs show it's waiting for input. What's the fix?"
2. **Obvious distractors** — avoid answers that are clearly absurd or off-topic
3. **Multiple correct answers** — if two options could both work, sharpen the scenario to make one clearly better
4. **Generic doc links** — linking to `https://code.claude.com/docs` instead of the specific page about the concept
5. **Unstable URLs** — always verify links are current. Documentation URLs change.
6. **Scenario-free questions** — every question needs production context, not "Which of the following..."
7. **Inconsistent YAML** — watch for unescaped special characters in YAML strings, especially `:`, `#`, `"`, `'`
8. **ID collisions** — always check existing IDs before assigning new ones

---

## 11. URL Verification Command

Before submitting any batch of questions, run this verification against every URL in the batch:

```bash
curl -sL -o /dev/null -w "%{http_code}" "<URL>"
```

All URLs must return HTTP 200. If a URL returns 301/302, follow the redirect and use the final destination URL. If a URL returns 404, find an alternative page using the llms.txt indexes.

---

## 12. Lessons from Initial Authoring (to refine iteratively)

### What worked well
- **Targeting under-represented task statements first** ensures coverage improves with each batch
- **Verifying URLs with curl before writing questions** prevents dead links from accumulating
- **The "other + detail string" enum pattern** (D4 Task 4.3) produced an excellent applied question because the exam guide explicitly calls this out
- **The interview pattern** (D3 Task 3.5) maps cleanly to the best-practices docs, making for strong doc link quality
- **Existing question bank as negative examples** — reading what's already covered prevents duplicate angles

### Refinements for future batches
- **The platform docs restructured** — old paths like `/build-with-claude/tool-use` now redirect to `/agents-and-tools/tool-use/overview`. Always use the current canonical path.
- **Some generic links in the existing bank need updating** — bare `https://code.claude.com/docs` should be replaced with specific pages. Budget link-fixing time into each batch.
- **YAML quoting matters** — option text containing colons, quotes, or hash symbols must be properly quoted. Validate with `yaml.safe_load()` after every batch.
- **Correct answer placement** — track the distribution of correct answers (A/B/C/D) across each domain to ensure roughly even distribution. The existing bank skews toward A and B.
- **doc links should reference the deepest specific section** — e.g., `https://code.claude.com/docs/en/agent-sdk/hooks` is better than `/agent-sdk/overview` when the concept is hooks specifically
