import { useEffect, useMemo, useState } from 'react'
import type { Domain } from '../types'

interface Props {
  domains: Domain[]
  onHome: () => void
}

const SECTIONS = [
  { id: 'overview', label: 'Exam' },
  { id: 'foundations', label: 'Foundations' },
  { id: 'd1', label: 'D1 · Agentic' },
  { id: 'd2', label: 'D2 · Tools/MCP' },
  { id: 'd3', label: 'D3 · Claude Code' },
  { id: 'd4', label: 'D4 · Prompting' },
  { id: 'd5', label: 'D5 · Context' },
  { id: 'distinctions', label: 'Distinctions' },
  { id: 'flows', label: 'Decision flows' },
  { id: 'distractors', label: 'Distractors' },
  { id: 'flashcards', label: 'Flashcards' },
]

export default function Cheatsheet({ domains, onHome }: Props) {
  const [active, setActive] = useState<string>('overview')
  const domainById = useMemo(() => new Map(domains.map((d) => [d.id, d])), [domains])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const d = (id: number) => domainById.get(id)!

  return (
    <div className="cheatsheet">
      <header className="cheatsheet-header">
        <div className="section-inner">
          <button className="btn-ghost" onClick={onHome}>← Home</button>
          <div className="badge-row" style={{ justifyContent: 'flex-start', marginTop: 12 }}>
            <span className="badge badge-cert">VISUAL CHEATSHEET</span>
            <span className="badge badge-v">All 5 domains · scannable</span>
          </div>
          <h1 className="cheatsheet-title">Claude Certified Architect — Cheatsheet</h1>
          <p className="cheatsheet-desc">
            A condensed, scannable reference for everything tested on the exam. Use it for last-mile
            review before sitting the exam. Color stripes match each domain.
          </p>
        </div>
      </header>

      <nav className="cheatsheet-nav" aria-label="Cheatsheet sections">
        <div className="cheatsheet-nav-inner">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`cheat-nav-chip ${active === s.id ? 'is-active' : ''}`}
              onClick={() => scrollTo(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="cheatsheet-main">
        {/* ─── Overview ───────────────────────────────────────────────── */}
        <section id="overview" className="cheat-section">
          <h2 className="cheat-section-title">Exam at a glance</h2>
          <div className="cheat-stat-grid">
            <StatCard label="Pass score" value="720" suffix="/ 1000" />
            <StatCard label="Format" value="MCQ" suffix="1 correct, 3 distractors" />
            <StatCard label="Practice" value="60q" suffix="in 90 minutes" />
            <StatCard label="Real exam" value="120m" suffix="observed" />
            <StatCard label="Scenarios" value="4 of 6" suffix="per sitting" />
            <StatCard label="Penalty" value="None" suffix="answer everything" />
          </div>

          <h3 className="cheat-h3">Domain weighting</h3>
          <div className="weight-bars">
            {domains.map((dom) => (
              <div key={dom.id} className="weight-bar-row">
                <div className="weight-bar-label">
                  <span className="weight-bar-id" style={{ color: dom.color }}>D{dom.id}</span>
                  <span className="weight-bar-name">{dom.shortName}</span>
                </div>
                <div className="weight-bar-track">
                  <div
                    className="weight-bar-fill"
                    style={{ width: `${dom.weight * 3}%`, background: dom.color }}
                  >
                    <span className="weight-bar-pct">{dom.weight}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h3 className="cheat-h3">Scenarios → primary domains</h3>
          <div className="scenario-map-grid">
            {[
              { name: 'Customer Support Resolution Agent', icon: '🎧', domains: [1, 2, 5] },
              { name: 'Code Generation with Claude Code', icon: '💻', domains: [3, 5] },
              { name: 'Multi-Agent Research System', icon: '🔬', domains: [1, 2, 5] },
              { name: 'Developer Productivity with Claude', icon: '⚡', domains: [2, 3, 1] },
              { name: 'Claude Code for CI/CD', icon: '🔄', domains: [3, 4] },
              { name: 'Structured Data Extraction', icon: '📊', domains: [4, 5] },
            ].map((s) => (
              <div key={s.name} className="scenario-map-card">
                <div className="scenario-map-head">
                  <span className="scenario-icon">{s.icon}</span>
                  <span className="scenario-map-name">{s.name}</span>
                </div>
                <div className="scenario-map-doms">
                  {s.domains.map((id) => (
                    <span
                      key={id}
                      className="dom-pill"
                      style={{ color: d(id).color, background: d(id).bgColor }}
                    >
                      D{id}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Foundations ────────────────────────────────────────────── */}
        <section id="foundations" className="cheat-section">
          <h2 className="cheat-section-title">Cross-Domain Foundations</h2>

          <div className="cheat-grid-2">
            <Card title="API request anatomy">
              <Code>{`{
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  system: "...",      // role + constraints
  messages: [...],    // conversation so far
  tools: [...],       // structured tools
  tool_choice: "auto" // skip / must / specific
}`}</Code>
              <p className="cheat-note">
                Messages API does <strong>not persist state</strong> — your app resends history every call.
              </p>
            </Card>

            <Card title="stop_reason cheat (raw API)">
              <Table
                head={['Value', 'Meaning', 'Action']}
                rows={[
                  ['tool_use', 'Wants tool calls', 'Execute, append, loop'],
                  ['end_turn', 'Done', 'Exit, present answer'],
                  ['max_tokens', 'Output truncated', 'Retry / resume'],
                  ['stop_sequence', 'Custom stop hit', 'App-specific'],
                  ['pause_turn', 'Server tool boundary', 'Re-send to continue'],
                ]}
              />
              <p className="cheat-note">
                With Agent SDK, the loop is driven for you — read <code>ResultMessage.subtype</code>.
              </p>
            </Card>

            <Card title="System vs user prompt">
              <Table
                head={['Prompt', 'Purpose']}
                rows={[
                  ['system', 'Behavior, role, constraints, escalation rules'],
                  ['user', 'The actual current request'],
                ]}
              />
              <p className="cheat-note warn">
                Watch for <strong>keyword-heavy</strong> system prompts that bias tool choice
                ("always verify customer first" → over-uses get_customer).
              </p>
            </Card>

            <Card title="Context window — what consumes it">
              <ul className="cheat-list">
                <li>System prompt</li>
                <li>CLAUDE.md + rules</li>
                <li>Tool definitions</li>
                <li>Every conversation turn</li>
                <li>All tool inputs <em>and</em> outputs</li>
              </ul>
              <div className="callout">
                <strong>Failure modes:</strong> lost-in-the-middle · tool result bloat ·
                progressive summarization loss
              </div>
              <div className="callout callout-good">
                <strong>Mitigations:</strong> key facts at start/end · trim outputs · persistent
                facts block · structured upstream outputs
              </div>
            </Card>
          </div>
        </section>

        {/* ─── Domain 1 ───────────────────────────────────────────────── */}
        <DomainSection id="d1" domain={d(1)}>
          <div className="cheat-grid-2">
            <Card title="1.1 Agentic loop">
              <ol className="cheat-list cheat-list-num">
                <li>Claude receives prompt + tools + history</li>
                <li>Responds: tool calls OR final answer</li>
                <li>If tool calls → execute, append results, repeat</li>
                <li>If no tool calls → <code>end_turn</code></li>
              </ol>
              <div className="callout warn">
                <strong>Anti-patterns:</strong> parsing "Task complete" text · using max_turns as
                primary exit · hardcoding tool sequences
              </div>
            </Card>

            <Card title="1.2 Coordinator-subagent (hub & spoke)">
              <div className="diagram">
                <div className="diagram-node diagram-node-center">Coordinator</div>
                <div className="diagram-arrows">
                  <div className="diagram-leaf">Web Search</div>
                  <div className="diagram-leaf">Doc Analyzer</div>
                  <div className="diagram-leaf">Synthesizer</div>
                </div>
              </div>
              <p className="cheat-note">
                Subagents <strong>never talk to each other</strong>. Everything routes via the coordinator.
              </p>
              <div className="callout warn">
                <strong>Trap:</strong> narrow decomposition (missed subtopics) — root cause is the
                coordinator, not the subagents.
              </div>
            </Card>

            <Card title="1.3 Subagent context — pass everything">
              <div className="vs-grid">
                <div className="vs-cell vs-bad">
                  <strong>WRONG</strong>
                  <Code small>{`prompt = "Synthesize the findings"`}</Code>
                  <p>Subagent has no access to parent context.</p>
                </div>
                <div className="vs-cell vs-good">
                  <strong>RIGHT</strong>
                  <Code small>{`prompt = f"""
Synthesize:
## Web results
{web_results}
## Docs
{doc_findings}
"""`}</Code>
                </div>
              </div>
              <p className="cheat-note">
                Coordinator must include <code>"Agent"</code> in <code>allowedTools</code>.
                Spawn parallel by emitting multiple Agent calls in <strong>one</strong> response.
              </p>
            </Card>

            <Card title="1.4 Enforcement vs guidance">
              <Table
                head={['Approach', 'Reliability', 'Use when']}
                rows={[
                  ['Hooks / gates', 'Deterministic', 'Money, security, compliance'],
                  ['Prompt', 'Probabilistic ~85–95%', 'Style, soft preferences'],
                ]}
              />
              <p className="cheat-note">
                Structured handoff to humans must include the full case context — they don't see
                the transcript.
              </p>
            </Card>

            <Card title="1.5 Hooks — Pre/PostToolUse">
              <Table
                head={['Hook', 'Use for']}
                rows={[
                  ['PreToolUse', 'Block / allow / rewrite tool call'],
                  ['PostToolUse', 'Normalize / annotate result'],
                  ['PreCompact', 'Persist critical state pre-compact'],
                  ['SubagentStop', 'Validate subagent output'],
                  ['SessionStart', 'Inject env defaults / telemetry'],
                ]}
              />
              <Code small>{`HookMatcher(matcher="process_refund",
  hooks=[enforce_refund_policy])
# matcher: "Bash" | "Write|Edit" | "^mcp__"`}</Code>
              <div className="callout">
                <code>permissionDecision: "deny"</code> <strong>always</strong> blocks. Prompts only
                <em> usually</em> work.
              </div>
            </Card>

            <Card title="1.6 Decomposition patterns">
              <Table
                head={['Pattern', 'When']}
                rows={[
                  ['Prompt chaining (fixed)', 'Predictable multi-aspect (code review)'],
                  ['Dynamic adaptive', 'Open-ended investigation'],
                ]}
              />
              <p className="cheat-note">
                Reviewing 14 files together → <strong>attention dilution</strong>. Per-file local
                pass + separate cross-file integration pass.
              </p>
            </Card>

            <Card title="1.7 Sessions: continue / resume / fork">
              <Table
                head={['Operation', 'What it does']}
                rows={[
                  ['continue', 'Reopen most recent session in cwd'],
                  ['resume=id', 'Reopen specific session by ID'],
                  ['fork_session=True', 'Branch a copy of history'],
                  ['persistSession:false', 'TS-only, in-memory only'],
                ]}
              />
              <p className="cheat-note">
                Sessions persist <strong>conversation</strong>, not <strong>filesystem</strong>.
                Capture <code>ResultMessage.session_id</code>. Sessions live under
                <code>~/.claude/projects/&lt;encoded-cwd&gt;/&lt;id&gt;.jsonl</code>.
              </p>
            </Card>
          </div>
        </DomainSection>

        {/* ─── Domain 2 ───────────────────────────────────────────────── */}
        <DomainSection id="d2" domain={d(2)}>
          <div className="cheat-grid-2">
            <Card title="2.1 Tool descriptions = selection mechanism">
              <p>Claude reads <strong>descriptions, not code</strong>, to pick a tool.</p>
              <div className="vs-grid">
                <div className="vs-cell vs-bad">
                  <strong>BAD</strong>
                  <Code small>{`"Analyzes content"
"Analyzes documents"`}</Code>
                </div>
                <div className="vs-cell vs-good">
                  <strong>GOOD</strong>
                  <Code small>{`"Use when: web HTML/text
Input: raw HTML or text
Output: title, author, date
Do NOT use for: PDFs
→ use extract_document"`}</Code>
                </div>
              </div>
              <p className="cheat-note">
                Add <code>input_examples</code> for nested or format-sensitive schemas.
              </p>
            </Card>

            <Card title="2.2 isError + structured metadata">
              <Table
                head={['Category', 'Retry?', 'Why']}
                rows={[
                  ['transient', 'Yes (backoff)', 'Network, timeout'],
                  ['validation', 'No', 'Fix the input'],
                  ['business', 'No', 'Policy violation'],
                  ['permission', 'No', 'Escalate'],
                ]}
              />
              <Code small>{`{
  isError: true,
  content: [{
    text: "Order lookup failed: ...",
    errorCategory: "transient",
    isRetryable: true,
    retryAfterMs: 2000,
    partialResults: null
  }]
}`}</Code>
              <div className="callout warn">
                Access failure ≠ valid empty result. Empty result is <strong>not</strong> an error.
              </div>
            </Card>

            <Card title="2.3 tool_choice configurations">
              <Table
                head={['Value', 'Behavior']}
                rows={[
                  ['"auto"', 'Claude decides — may return prose'],
                  ['"any"', 'MUST call a tool (any tool)'],
                  ['{type:"tool", name}', 'MUST call this specific tool'],
                  ['"none"', 'Disables tool calls entirely'],
                ]}
              />
              <p className="cheat-note warn">
                <strong>Extended thinking</strong>: only <code>auto</code> and <code>none</code> are
                compatible. <code>any</code> / forced disallow natural-language preamble too.
              </p>
              <p className="cheat-note">
                <strong>18 tools &gt;&gt; 4–5</strong>: too many degrades selection. Apply principle
                of least privilege per subagent.
              </p>
            </Card>

            <Card title="2.4 MCP — primitives & layers">
              <Table
                head={['Primitive', 'What', 'Controlled by']}
                rows={[
                  ['Tools', 'Executable actions', 'Model'],
                  ['Resources', 'Stable context / catalogs', 'Application'],
                  ['Prompts', 'User-invoked templates', 'User'],
                ]}
              />
              <div className="callout">
                <strong>Need action →</strong> tool · <strong>stable context →</strong> resource ·
                <strong> reusable workflow →</strong> prompt
              </div>
              <Table
                head={['Layer', 'Role']}
                rows={[
                  ['Data', 'JSON-RPC, lifecycle, capabilities, prims'],
                  ['Transport', 'stdio (local) / Streamable HTTP (remote)'],
                ]}
              />
              <p className="cheat-note">
                Roots are <strong>not</strong> a hard security boundary. Don't write logs to stdout
                on stdio servers — use stderr.
              </p>
            </Card>

            <Card title="MCP scoping in Claude Code">
              <Table
                head={['Scope', 'File', 'Shared?']}
                rows={[
                  ['Project (team)', '.mcp.json', 'Yes — git'],
                  ['User (cross-project)', '~/.claude.json', 'No'],
                  ['Local (per-project private)', '~/.claude.json (project block)', 'No'],
                ]}
              />
              <Code small>{`{ "mcpServers": {
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": { "GITHUB_TOKEN": "\${GITHUB_TOKEN}" }
  }
}}`}</Code>
              <p className="cheat-note">
                Use Inspector first when debugging. Prefer community servers for standard
                integrations; build custom for internal/constrained workflows.
              </p>
            </Card>

            <Card title="2.5 Built-in tools selection">
              <Table
                head={['Task', 'Tool']}
                rows={[
                  ['Find files by name/extension', 'Glob'],
                  ['Search file contents (regex)', 'Grep'],
                  ['Read full file', 'Read'],
                  ['Targeted edit on unique anchor', 'Edit'],
                  ['Edit fails (no unique anchor)', 'Read → Write'],
                  ['Run a shell command', 'Bash'],
                ]}
              />
              <Code small>{`**/*.test.tsx        // all tests
src/api/**/*         // under src/api
src/**/*.{ts,tsx}    // TS/TSX under src`}</Code>
            </Card>
          </div>
        </DomainSection>

        {/* ─── Domain 3 ───────────────────────────────────────────────── */}
        <DomainSection id="d3" domain={d(3)}>
          <div className="cheat-grid-2">
            <Card title="3.1 CLAUDE.md hierarchy (most-specific wins)">
              <Table
                head={['Level', 'Location', 'Shared?']}
                rows={[
                  ['Managed policy', '/Library/Application Support/ClaudeCode/CLAUDE.md', 'Org via MDM'],
                  ['Project', './CLAUDE.md', 'Yes (git)'],
                  ['Local', './CLAUDE.local.md', 'No'],
                  ['User', '~/.claude/CLAUDE.md', 'No'],
                ]}
              />
              <div className="callout warn">
                User-level <strong>NOT shared</strong> with teammates. If new team-mate isn't
                getting instructions → move to project level.
              </div>
              <p className="cheat-note">
                Files concatenate (not override). Delivered as context <em>after</em> system prompt
                — for true CLI system-prompt edits use <code>--append-system-prompt</code>. Use
                <code>@path</code> imports. Target &lt;200 lines per file.
              </p>
            </Card>

            <Card title="What survives /compact">
              <Table
                head={['Item', 'After compaction']}
                rows={[
                  ['System prompt + output style', 'Unchanged'],
                  ['Project CLAUDE.md + unscoped rules', 'Re-injected'],
                  ['Auto memory', 'Re-injected'],
                  ['Rules with paths: frontmatter', 'LOST until matching read'],
                  ['Nested CLAUDE.md', 'LOST until subdir read'],
                  ['Skills bodies', 'Re-injected (token-capped)'],
                ]}
              />
            </Card>

            <Card title="3.2 Skills frontmatter">
              <Code small>{`---
name: review-pr
description: Reviews PR — auto-invoke when reviewing
argument-hint: [PR number]
context: fork
allowed-tools: Read Grep Glob Bash(gh pr *)
disable-model-invocation: false
---`}</Code>
              <Table
                head={['Field', 'Why']}
                rows={[
                  ['context: fork', 'Isolate verbose / exploratory output'],
                  ['allowed-tools', 'Pre-approve, least privilege'],
                  ['argument-hint', 'Tab-completion guidance'],
                  ['disable-model-invocation', 'Manual-only invocation'],
                  ['user-invocable: false', 'Hidden from / menu'],
                ]}
              />
            </Card>

            <Card title="3.3 Path-scoped rules">
              <Code small>{`---
paths:
  - "**/*.test.tsx"
  - "**/*.spec.ts"
---
# Testing conventions ...`}</Code>
              <p className="cheat-note">
                Cover files spread across many directories — directory-level CLAUDE.md can't.
                Path rules <strong>do not survive /compact</strong> until a matching file is read again.
              </p>
            </Card>

            <Card title="3.4 Plan mode vs direct execution">
              <Table
                head={['Use plan mode', 'Direct execution']}
                rows={[
                  ['Architectural / cross-cutting changes', 'Single-file bug with clear stack trace'],
                  ['Library migration spanning 45+ files', 'Adding a date validation conditional'],
                  ['Multiple valid approaches', 'Well-understood, scoped change'],
                ]}
              />
              <Code small>{`options = ClaudeAgentOptions(
  permission_mode="plan"
)`}</Code>
              <p className="cheat-note">
                Use the <strong>Explore</strong> subagent when discovery output is verbose — main
                agent receives the summary, not the transcript.
              </p>
            </Card>

            <Card title="3.5 Iterative refinement">
              <ul className="cheat-list">
                <li>Vague prose fails → give 2–3 input/output examples</li>
                <li>Test-driven loop: tests first → implement → share failures → iterate</li>
                <li>Interview pattern in unfamiliar domains: ask before implementing</li>
                <li>Interacting issues → one detailed message; independent → sequential</li>
              </ul>
            </Card>

            <Card title="3.6 CI/CD — headless">
              <Code small>{`# Non-interactive (the only correct way)
claude -p "Review the PR" \\
  --output-format json \\
  --json-schema '{...}'

# Identical behavior across CI machines
claude --bare -p "..." --allowedTools "Read"`}</Code>
              <p className="cheat-note">
                <code>--output-format json --json-schema</code> returns metadata + result in
                <code>structured_output</code>. Use <strong>independent session</strong> for
                reviewing own-generated code.
              </p>
              <p className="cheat-note">
                GitHub Actions / GitLab / raw CLI all reduce to: non-interactive invocation,
                explicit tool/permission control, repo-scoped context.
              </p>
            </Card>

            <Card title="Useful slash & CLI commands">
              <Table
                head={['Command', 'Purpose']}
                rows={[
                  ['/memory', 'Inspect / toggle loaded memory'],
                  ['/context', 'See context utilization'],
                  ['/compact', 'Compress conversation to summary'],
                  ['/branch [name]', 'Branch the session'],
                  ['/effort [level]', 'Trade speed vs reasoning depth'],
                  ['claude -p / --print', 'Non-interactive (CI)'],
                  ['--append-system-prompt', 'CLI-side system prompt addition'],
                  ['--fork-session', 'Branch a session at the CLI'],
                  ['--bare', 'Skip auto-discovery (hooks/skills/MCP/CLAUDE.md)'],
                ]}
              />
            </Card>
          </div>
        </DomainSection>

        {/* ─── Domain 4 ───────────────────────────────────────────────── */}
        <DomainSection id="d4" domain={d(4)}>
          <div className="cheat-grid-2">
            <Card title="4.1 Vague vs explicit criteria">
              <div className="vs-grid">
                <div className="vs-cell vs-bad">
                  <strong>FAILS</strong>
                  <ul className="cheat-list">
                    <li>"Be conservative"</li>
                    <li>"Only high-confidence"</li>
                    <li>"Focus on important issues"</li>
                  </ul>
                </div>
                <div className="vs-cell vs-good">
                  <strong>WORKS</strong>
                  <ul className="cheat-list">
                    <li>Categorical lists with examples</li>
                    <li>Severity criteria w/ code samples</li>
                    <li>Explicit "do NOT report" list</li>
                  </ul>
                </div>
              </div>
              <p className="cheat-note">
                One high-FP category undermines trust in <em>all</em> findings — isolate or disable
                while improving prompts.
              </p>
            </Card>

            <Card title="4.2 Few-shot prompting">
              <p>Most effective for:</p>
              <ul className="cheat-list">
                <li>Consistent output format</li>
                <li>Disambiguating tool selection</li>
                <li>Reducing hallucination in extraction</li>
                <li>Distinguishing acceptable vs genuine issues</li>
              </ul>
              <div className="callout">
                Target <strong>2–4 examples</strong>. &gt;6–8 adds tokens without benefit. Focus on
                <em> ambiguous </em> cases.
              </div>
            </Card>

            <Card title="4.3 Schema patterns">
              <Code small>{`{ "type": ["string", "null"] }   // nullable: prevent hallucination

{ "enum": ["invoice","receipt","other"] }
{ "type": ["string","null"],
  "description": "Required when type=other" }

{ "enum": ["positive","negative","neutral","unclear"] }`}</Code>
              <div className="callout">
                Schemas guarantee: ✅ syntax · ✅ required fields · ✅ enum values<br />
                Do NOT guarantee: ❌ semantic correctness · ❌ correct field placement
              </div>
            </Card>

            <Card title="4.4 Validation + retry loop">
              <ol className="cheat-list cheat-list-num">
                <li>Run extraction</li>
                <li>Schema validate (free)</li>
                <li>Semantic validate (sums, dependencies)</li>
                <li>If fail → retry with original doc + failed extraction + specific errors</li>
              </ol>
              <Table
                head={['Issue', 'Retry helps?']}
                rows={[
                  ['Format mismatch', '✅'],
                  ['Wrong field placement', '✅'],
                  ['Information absent from doc', '❌ — can’t fabricate'],
                  ['External resource not provided', '❌'],
                ]}
              />
            </Card>

            <Card title="4.5 Batch vs synchronous">
              <Table
                head={['Property', 'Batch', 'Synchronous']}
                rows={[
                  ['Cost', '50% cheaper', 'Standard'],
                  ['Latency SLA', 'None (≤24h)', 'Sub-second'],
                  ['Multi-turn tools', '❌ Not supported', '✅'],
                  ['Use for', 'Overnight / nightly / weekly', 'Pre-merge, interactive'],
                ]}
              />
              <p className="cheat-note">
                Use <code>custom_id</code> to correlate request/response. Test on 10–20 sample docs
                before batching thousands.
              </p>
            </Card>

            <Card title="4.6 Multi-instance / multi-pass">
              <div className="callout warn">
                Same session reviewing its own output retains "why I did it this way" reasoning →
                use a <strong>fresh independent session</strong>.
              </div>
              <p className="cheat-note">
                Large PR (14 files): per-file local pass + cross-file integration pass.
                Confidence-scored findings → high → auto-comment, medium → human queue, low →
                discard or separate review.
              </p>
            </Card>
          </div>
        </DomainSection>

        {/* ─── Domain 5 ───────────────────────────────────────────────── */}
        <DomainSection id="d5" domain={d(5)}>
          <div className="cheat-grid-2">
            <Card title="5.1 Conversation context">
              <ul className="cheat-list">
                <li><strong>Lost-in-the-middle</strong>: put key facts at start/end</li>
                <li><strong>Progressive summarization</strong>: loses numbers, dates, expectations</li>
                <li>Persistent <strong>case facts block</strong> outside summarized history</li>
                <li>Trim 40-field tool outputs → keep only relevant fields</li>
              </ul>
              <Code small>{`prompt = f"""
## Active Case Facts (do not summarize)
{json.dumps(case_facts)}

## Conversation Summary
{summary}

## Current Message
{message}
"""`}</Code>
            </Card>

            <Card title="5.2 Escalation triggers">
              <Table
                head={['Escalate when…', 'Do NOT escalate']}
                rows={[
                  ['Customer explicitly asks for human', 'Standard returns within policy'],
                  ['Policy gap (silent on situation)', 'Order status lookup'],
                  ['No progress after reasonable attempts', 'Billing question with clear answer'],
                  ['Exception beyond agent authority', '—'],
                ]}
              />
              <div className="callout warn">
                <strong>Unreliable proxies</strong>: sentiment, self-reported confidence. Multiple
                customer matches → <em>ask for identifier</em>, never select by heuristic.
              </div>
            </Card>

            <Card title="5.3 Error propagation in multi-agent">
              <p>Subagent errors should include:</p>
              <ul className="cheat-list">
                <li>type (transient / validation / business / permission)</li>
                <li>attempted query</li>
                <li>partial results</li>
                <li>suggested alternatives</li>
                <li>retry recommended?</li>
              </ul>
              <div className="callout warn">
                Anti: silently returning <code>{`{results:[]}`}</code> · aborting whole workflow ·
                generic "Operation failed".
              </div>
            </Card>

            <Card title="5.4 Large codebase exploration">
              <ul className="cheat-list">
                <li><strong>Scratchpad files</strong> for persisting key findings</li>
                <li>Delegate verbose discovery to subagents — receive summary</li>
                <li>Avoid daisy-chaining raw transcripts between agents</li>
                <li><code>/compact</code> to free space mid-investigation</li>
                <li>State manifests for crash recovery</li>
              </ul>
            </Card>

            <Card title="5.5 Confidence calibration">
              <div className="callout warn">
                <strong>Aggregate accuracy lies.</strong> 97% overall can hide 65% on
                non-English / 78% on handwritten.
              </div>
              <p className="cheat-note">
                <strong>Stratified sampling</strong> — sample <em>high-confidence</em> too
                (systematic errors won't show in low-confidence queue). Use <strong>field-level</strong>
                confidence, not one overall score. Recalibrate quarterly.
              </p>
            </Card>

            <Card title="5.6 Provenance & synthesis">
              <p>Every finding needs:</p>
              <ul className="cheat-list">
                <li>claim text</li>
                <li>source URL + title + author</li>
                <li><strong>publication_date</strong> (temporal analysis)</li>
                <li>evidence excerpt</li>
                <li>confidence</li>
              </ul>
              <p className="cheat-note">
                Conflicting stats → <strong>preserve both</strong> with attribution; never pick one.
                Distinguish well-established vs contested, mark coverage gaps.
              </p>
            </Card>
          </div>
        </DomainSection>

        {/* ─── Distinctions ──────────────────────────────────────────── */}
        <section id="distinctions" className="cheat-section">
          <h2 className="cheat-section-title">Must-memorize distinctions</h2>
          <div className="distinct-grid">
            {DISTINCTIONS.map((dis) => (
              <div key={dis.left} className="distinct-card">
                <div className="distinct-row">
                  <div className="distinct-side distinct-a">
                    <span className="distinct-label">{dis.left}</span>
                    <span className="distinct-detail">{dis.leftDetail}</span>
                  </div>
                  <div className="distinct-vs">vs</div>
                  <div className="distinct-side distinct-b">
                    <span className="distinct-label">{dis.right}</span>
                    <span className="distinct-detail">{dis.rightDetail}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Decision flows ───────────────────────────────────────── */}
        <section id="flows" className="cheat-section">
          <h2 className="cheat-section-title">Decision flows</h2>
          <div className="cheat-grid-2">
            <Card title="Tool selection problem">
              <ol className="cheat-list cheat-list-num">
                <li>Improve tool descriptions (formats, examples, boundaries)</li>
                <li>If ambiguity remains → add targeted few-shot examples</li>
                <li>Audit system prompt for keyword-sensitive steering</li>
                <li>Last resort: tool consolidation / classifier</li>
              </ol>
            </Card>
            <Card title="Output inconsistency">
              <Table
                head={['Symptom', 'Fix']}
                rows={[
                  ['Inconsistent format', 'Few-shot examples'],
                  ['Inconsistent completeness', 'Evaluator-optimizer / self-critique'],
                  ['Inconsistent classification', 'Explicit criteria + concrete examples'],
                  ['Inconsistent transformation', 'Concrete input/output examples'],
                ]}
              />
            </Card>
            <Card title="Context-size problem">
              <Table
                head={['Symptom', 'Fix']}
                rows={[
                  ['Upstream outputs too large', 'Return structured findings, not prose'],
                  ['Tool results bloat context', 'Trim fields aggressively'],
                  ['Long sessions degrade', 'Scratchpads + /compact + subagents'],
                  ['Critical facts get lost', 'Persistent facts block'],
                ]}
              />
            </Card>
            <Card title="When not to retry">
              <ul className="cheat-list">
                <li>Information absent from source</li>
                <li>External resource not provided</li>
                <li>Validation error (fix the input instead)</li>
                <li>Business / permission errors</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* ─── Distractor patterns ──────────────────────────────────── */}
        <section id="distractors" className="cheat-section">
          <h2 className="cheat-section-title">Common distractor patterns</h2>
          <div className="cheat-grid-2">
            {DISTRACTORS.map((dt) => (
              <div key={dt.title} className="distractor-card">
                <div className="distractor-tag">{dt.tag}</div>
                <h4>{dt.title}</h4>
                <p>{dt.body}</p>
              </div>
            ))}
          </div>

          <h3 className="cheat-h3">Anti-patterns vs production patterns</h3>
          <div className="cheat-grid-2">
            {ANTI_PATTERNS.map(([anti, prod]) => (
              <div key={anti} className="vs-card">
                <div className="vs-bad">
                  <span className="vs-tag">Anti-pattern</span>
                  <p>{anti}</p>
                </div>
                <div className="vs-good">
                  <span className="vs-tag">Production</span>
                  <p>{prod}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Flashcards ──────────────────────────────────────────── */}
        <section id="flashcards" className="cheat-section">
          <h2 className="cheat-section-title">Quick flashcards</h2>
          <div className="flash-grid">
            {FLASHCARDS.map(([q, a]) => (
              <Flashcard key={q} q={q} a={a} />
            ))}
          </div>

          <h3 className="cheat-h3">Ultra-high-yield mental models</h3>
          <ul className="mental-models">
            <li>LLMs are probabilistic; production systems must add deterministic controls.</li>
            <li>Tokens are not the solution; <strong>structure</strong> is.</li>
            <li>A bigger model is not a substitute for better architecture.</li>
            <li>Explicit contracts (tools, schemas, structured outputs) beat vague NL instructions.</li>
            <li>Attention dilution is a quality issue, not just a capacity issue.</li>
          </ul>
        </section>
      </main>

      <footer className="cheatsheet-footer">
        <div className="section-inner">
          <button className="btn btn-secondary" onClick={onHome}>← Back to home</button>
        </div>
      </footer>
    </div>
  )
}

/* ─── Sub-components ────────────────────────────────────────────────── */

function DomainSection({
  id,
  domain,
  children,
}: {
  id: string
  domain: Domain
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="cheat-section cheat-section-domain"
      style={
        {
          '--domain-color': domain.color,
          '--domain-bg': domain.bgColor,
        } as React.CSSProperties
      }
    >
      <div className="domain-section-head">
        <span className="domain-stripe" />
        <div>
          <div className="domain-section-meta">
            <span className="domain-section-id" style={{ color: domain.color }}>
              Domain {domain.id}
            </span>
            <span className="domain-section-weight">{domain.weight}%</span>
          </div>
          <h2 className="cheat-section-title cheat-section-title-tight">{domain.name}</h2>
          <p className="domain-section-desc">{domain.description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="cheat-card">
      <h3 className="cheat-card-title">{title}</h3>
      <div className="cheat-card-body">{children}</div>
    </div>
  )
}

function StatCard({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="cheat-stat">
      <div className="cheat-stat-value">{value}</div>
      {suffix && <div className="cheat-stat-suffix">{suffix}</div>}
      <div className="cheat-stat-label">{label}</div>
    </div>
  )
}

function Code({ children, small }: { children: string; small?: boolean }) {
  return <pre className={`cheat-code ${small ? 'cheat-code-sm' : ''}`}><code>{children}</code></pre>
}

function Table({ head, rows }: { head: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="cheat-table-wrap">
      <table className="cheat-table">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Flashcard({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      className={`flashcard ${open ? 'is-open' : ''}`}
      onClick={() => setOpen((o) => !o)}
      type="button"
    >
      <div className="flashcard-q">{q}</div>
      <div className="flashcard-a">{open ? a : 'Tap to reveal →'}</div>
    </button>
  )
}

/* ─── Data ──────────────────────────────────────────────────────────── */

const DISTINCTIONS = [
  { left: 'Hooks', leftDetail: 'Deterministic — always blocks/transforms', right: 'Prompts', rightDetail: 'Probabilistic — usually works' },
  { left: 'tool_choice: "auto"', leftDetail: 'May skip tool, return prose', right: 'tool_choice: "any"', rightDetail: 'Must call a tool (any tool)' },
  { left: 'Forced tool', leftDetail: '{type:"tool",name} — guaranteed specific', right: 'tool_choice: "none"', rightDetail: 'Disables tool calls entirely' },
  { left: 'Batch API', leftDetail: '50% off · ≤24h · no multi-turn tools', right: 'Synchronous', rightDetail: 'Sub-second · supports tool loops' },
  { left: 'User CLAUDE.md', leftDetail: '~/.claude/ — NOT shared', right: 'Project CLAUDE.md', rightDetail: './CLAUDE.md — version-controlled' },
  { left: 'Subagent context', leftDetail: 'Must pass explicitly in prompt', right: 'Inheritance', rightDetail: 'Does not exist for subagents' },
  { left: 'Access failure', leftDetail: 'isError:true — retry / alternative', right: 'Empty result', rightDetail: 'isError:false — tell user' },
  { left: 'context: fork', leftDetail: 'Skill in isolated subagent', right: '--fork-session', rightDetail: 'CLI session branch' },
  { left: 'CLAUDE.md', leftDetail: 'Context after system prompt', right: '--append-system-prompt', rightDetail: 'True system prompt addition' },
  { left: 'Task tool', leftDetail: 'Old name (still in some docs)', right: 'Agent tool', rightDetail: 'Renamed in Claude Code v2.1.63' },
  { left: 'Self-review', leftDetail: 'Retains generation reasoning', right: 'Independent review', rightDetail: 'Fresh session, fresh judgment' },
  { left: 'Plan mode', leftDetail: 'Multi-file architectural decisions', right: 'Direct execution', rightDetail: 'Clear-scope, single-file changes' },
] as const

const DISTRACTORS = [
  { tag: 'Trap 1', title: 'Over-engineered', body: 'Correct technique but too heavy for the situation. "Deploy a classifier" when "update the prompt" suffices.' },
  { tag: 'Trap 2', title: 'Probabilistic when deterministic needed', body: '"Add an instruction" when the answer requires a hook / gate.' },
  { tag: 'Trap 3', title: 'Non-existent features', body: 'Made-up flags like CLAUDE_HEADLESS=true, --batch flag, config.json commands array.' },
  { tag: 'Trap 4', title: 'Treats symptom, not cause', body: 'Larger context window for attention dilution. Retry for absent information.' },
  { tag: 'Trap 5', title: 'Wrong scope', body: 'User-level config when project-level needed. Wrong tool (get_customer when lookup_order is right).' },
  { tag: 'Trap 6', title: 'Narrow decomposition', body: 'Coordinator splits "AI in creative industries" into only visual arts subtopics — root cause is the coordinator, not subagents.' },
] as const

const ANTI_PATTERNS: [string, string][] = [
  ['Prompt-based routing for required sequences', 'Programmatic intercepts and prerequisite gates (hooks)'],
  ['Monolithic tools with vague descriptions', 'Granular single-purpose tools with explicit boundaries'],
  ['Daisy-chaining raw transcripts between agents', 'Structured upstream outputs; scratchpads / manifests / shared retrieval'],
  ['Expanding enums forever', 'Add "other" + detail field; "unclear" where appropriate'],
  ['Silent error suppression ({results: []})', 'Structured error categories, retryability, recovery context'],
  ['Procedural micromanagement of subagents', 'Goal-oriented delegation with explicit quality criteria'],
  ['Sentiment-based escalation', 'Explicit escalation criteria with few-shot examples'],
  ['Aggregate accuracy alone for QA', 'Stratified sampling per document type AND field segment'],
]

const FLASHCARDS: [string, string][] = [
  ['When does the agentic loop terminate?', 'When stop_reason = "end_turn" at the raw API layer; continue looping on "tool_use".'],
  ['Do subagents inherit coordinator context?', 'No — context must be passed explicitly in each subagent prompt.'],
  ['How do you spawn parallel subagents?', 'Emit multiple Task / Agent tool calls in a single coordinator response.'],
  ['Does the Batch API support iterative tool calling?', 'No — fire-and-forget, not a multi-turn tool loop.'],
  ['First step when tool selection is wrong?', 'Fix tool descriptions first.'],
  ['How do you organize a huge CLAUDE.md?', 'Split into focused .claude/rules/ files.'],
  ['How do you isolate a skill from main-session context?', 'Use context: fork in SKILL.md frontmatter.'],
  ['CLI equivalent for session forking?', '--fork-session.'],
  ['Claude Code non-interactive CI mode?', 'claude -p / claude --print.'],
  ['True CLI-side system prompt customization?', '--append-system-prompt(-file), not CLAUDE.md.'],
  ['Reduce hallucination in extraction schemas?', 'Make absent-data fields optional / nullable.'],
  ['Stabilize severity classifications?', 'Explicit severity criteria with concrete examples (not vague prose).'],
  ['Enforce required tool ordering?', 'Programmatic gates / hooks, not prompt instructions.'],
  ['What is PostToolUse for?', 'Normalizing heterogeneous tool outputs before Claude reasons over them.'],
  ['What does tool_choice: "any" guarantee?', 'Claude must call a tool, not return free-form prose.'],
  ['Which tool_choice values work with extended thinking?', 'auto and none only.'],
  ['When to use Message Batches API?', 'Non-blocking, latency-tolerant jobs (overnight, weekly, nightly).'],
  ['System vs user prompt?', 'System sets behavior + constraints; user is the actual current request.'],
  ['Roots in MCP — security boundary?', 'No. Roots are coordination hints; OS perms / sandboxing enforce security.'],
  ['Local stdio MCP server logging?', 'Log to stderr — stdout is the protocol channel.'],
  ['Why publication_date in subagent output?', 'Prevents two same-topic studies from looking like a contradiction.'],
  ['Multiple matches on get_customer?', 'Ask for additional identifier — never select by heuristic.'],
]
