# Coverage Report — Claude Certified Architect Question Bank

**Generated:** auto | **Total Questions:** 91 | **Total Testable Concepts:** 240

## Domain 1: Agentic Architecture & Orchestration (27%)

**Progress:** 22/100 (22%) `████░░░░░░░░░░░░░░░░`

| Task Statement | Title | Qs | Concepts | Coverage | Priority |
|---|---|---|---|---|---|
| 1.1 | Agentic loop lifecycle | 3 | 6 | 75% | 🟡 HIGH |
| 1.2 | Multi-agent coordinator-subagent patterns | 4 | 8 | 75% | 🟢 MEDIUM |
| 1.3 | Subagent invocation, context passing, spawning | 3 | 8 | 56% | 🟡 HIGH |
| 1.4 | Multi-step workflows with enforcement and handoff | 3 | 6 | 75% | 🟡 HIGH |
| 1.5 | Agent SDK hooks for interception and normalization | 3 | 6 | 75% | 🟡 HIGH |
| 1.6 | Task decomposition strategies | 3 | 6 | 75% | 🟡 HIGH |
| 1.7 | Session state, resumption, forking | 3 | 8 | 56% | 🟡 HIGH |

<details>
<summary>Uncovered concepts in Domain 1</summary>

**1.1: Agentic loop lifecycle**

- [ ] K: Agentic loop lifecycle: stop_reason (tool_use vs end_turn), executing tools, returning results
- [ ] K: Tool results appended to conversation history for next-action reasoning
- [ ] K: Model-driven decision-making vs pre-configured decision trees or tool sequences
- [ ] S: Loop control flow: continue on stop_reason=tool_use, terminate on end_turn
- [ ] S: Adding tool results to conversation context between iterations
- [ ] S: Avoiding anti-patterns: parsing NL for termination, arbitrary iteration caps, checking text content as completion indicator

**1.2: Multi-agent coordinator-subagent patterns**

- [ ] K: Hub-and-spoke architecture: coordinator manages inter-subagent communication
- [ ] K: Subagents operate with isolated context — no automatic inheritance
- [ ] K: Coordinator role: task decomposition, delegation, result aggregation, dynamic subagent selection
- [ ] K: Risks of overly narrow task decomposition leading to incomplete coverage
- [ ] S: Coordinator dynamically selects which subagents to invoke based on query requirements
- [ ] S: Partitioning research scope across subagents to minimize duplication
- [ ] S: Iterative refinement loops: coordinator evaluates synthesis for gaps, re-delegates
- [ ] S: Routing all subagent communication through coordinator for observability

**1.3: Subagent invocation, context passing, spawning**

- [ ] K: Task tool as mechanism for spawning subagents; allowedTools must include Task
- [ ] K: Subagent context must be explicitly provided — no automatic parent context inheritance
- [ ] K: AgentDefinition configuration: descriptions, system prompts, tool restrictions
- [ ] K: Fork-based session management for exploring divergent approaches
- [ ] S: Including complete prior findings directly in subagent prompts
- [ ] S: Structured data formats separating content from metadata for attribution
- [ ] S: Spawning parallel subagents via multiple Task tool calls in single response
- [ ] S: Coordinator prompts specify goals/quality criteria rather than procedural steps

**1.4: Multi-step workflows with enforcement and handoff**

- [ ] K: Programmatic enforcement (hooks, prerequisite gates) vs prompt-based guidance
- [ ] K: When deterministic compliance is required, prompt instructions have non-zero failure rate
- [ ] K: Structured handoff protocols: customer details, root cause, recommended actions
- [ ] S: Programmatic prerequisites blocking downstream tools until prerequisites complete
- [ ] S: Decomposing multi-concern requests, investigating each in parallel, synthesizing unified resolution
- [ ] S: Compiling structured handoff summaries for human agents lacking conversation access

**1.5: Agent SDK hooks for interception and normalization**

- [ ] K: PostToolUse hooks intercepting tool results for transformation
- [ ] K: Hook patterns intercepting outgoing tool calls to enforce compliance
- [ ] K: Hooks for deterministic guarantees vs prompts for probabilistic compliance
- [ ] S: PostToolUse hooks normalizing heterogeneous data formats (timestamps, status codes)
- [ ] S: Tool call interception hooks blocking policy-violating actions, redirecting to alternatives
- [ ] S: Choosing hooks over prompt-based enforcement for guaranteed compliance

**1.6: Task decomposition strategies**

- [ ] K: Fixed sequential pipelines (prompt chaining) vs dynamic adaptive decomposition
- [ ] K: Prompt chaining: sequential steps (per-file analysis then cross-file integration)
- [ ] K: Adaptive investigation plans generating subtasks based on discoveries
- [ ] S: Selecting decomposition pattern appropriate to workflow type
- [ ] S: Splitting large reviews into per-file + cross-file integration passes
- [ ] S: Decomposing open-ended tasks: map structure, identify high-impact, create adaptive plan

**1.7: Session state, resumption, forking**

- [ ] K: Named session resumption with --resume <session-name>
- [ ] K: fork_session for independent branches from shared analysis baseline
- [ ] K: Informing agent about file changes when resuming after modifications
- [ ] K: New session with structured summary more reliable than resuming with stale tool results
- [ ] S: Using --resume with session names across work sessions
- [ ] S: Using fork_session for parallel exploration branches
- [ ] S: Choosing between resumption (valid context) and fresh start (stale context)
- [ ] S: Informing resumed session about specific file changes for targeted re-analysis

</details>

## Domain 2: Tool Design & MCP Integration (18%)

**Progress:** 14/100 (14%) `██░░░░░░░░░░░░░░░░░░`

| Task Statement | Title | Qs | Concepts | Coverage | Priority |
|---|---|---|---|---|---|
| 2.1 | Tool interface design with clear descriptions | 3 | 8 | 56% | 🟡 HIGH |
| 2.2 | Structured error responses for MCP tools | 3 | 8 | 56% | 🟡 HIGH |
| 2.3 | Tool distribution and tool_choice configuration | 2 | 9 | 33% | 🟡 HIGH |
| 2.4 | MCP server integration in Claude Code and agent workflows | 3 | 9 | 50% | 🟡 HIGH |
| 2.5 | Built-in tools (Read, Write, Edit, Bash, Grep, Glob) | 3 | 9 | 50% | 🟡 HIGH |

<details>
<summary>Uncovered concepts in Domain 2</summary>

**2.1: Tool interface design with clear descriptions**

- [ ] K: Tool descriptions as primary mechanism for LLM tool selection
- [ ] K: Including input formats, example queries, edge cases, boundaries in descriptions
- [ ] K: Ambiguous/overlapping descriptions cause misrouting
- [ ] K: System prompt wording impact on tool selection (keyword-sensitive associations)
- [ ] S: Writing descriptions that differentiate purpose, inputs, outputs, boundaries
- [ ] S: Renaming tools and updating descriptions to eliminate functional overlap
- [ ] S: Splitting generic tools into purpose-specific tools with defined contracts
- [ ] S: Reviewing system prompts for keyword-sensitive instructions overriding descriptions

**2.2: Structured error responses for MCP tools**

- [ ] K: MCP isError flag pattern for communicating tool failures
- [ ] K: Distinction: transient/validation/business/permission errors
- [ ] K: Uniform error responses prevent appropriate recovery decisions
- [ ] K: Retryable vs non-retryable errors; structured metadata prevents wasted retries
- [ ] S: Returning structured error metadata: errorCategory, isRetryable, human-readable descriptions
- [ ] S: Including retriable:false and customer-friendly explanations for business rule violations
- [ ] S: Local error recovery in subagents; propagate only unresolvable errors with partial results
- [ ] S: Distinguishing access failures from valid empty results

**2.3: Tool distribution and tool_choice configuration**

- [ ] K: Too many tools (18 vs 4-5) degrades tool selection reliability
- [ ] K: Agents with out-of-specialization tools tend to misuse them
- [ ] K: Scoped tool access: role-relevant tools + limited cross-role for high-frequency needs
- [ ] K: tool_choice options: auto, any, forced tool selection
- [ ] S: Restricting subagent tool sets to role-relevant tools
- [ ] S: Replacing generic tools with constrained alternatives
- [ ] S: Providing scoped cross-role tools for high-frequency needs
- [ ] S: Using forced tool_choice to ensure specific tool called first
- [ ] S: Setting tool_choice:any to guarantee tool call over conversational text

**2.4: MCP server integration in Claude Code and agent workflows**

- [ ] K: MCP server scoping: project-level (.mcp.json) vs user-level (~/.claude.json)
- [ ] K: Environment variable expansion in .mcp.json for credential management
- [ ] K: Tools from all configured MCP servers discovered at connection time
- [ ] K: MCP resources for exposing content catalogs to reduce exploratory tool calls
- [ ] S: Configuring shared MCP servers in .mcp.json with env var expansion
- [ ] S: Configuring personal MCP servers in ~/.claude.json
- [ ] S: Enhancing MCP tool descriptions to prevent agent preferring built-in tools
- [ ] S: Choosing community MCP servers over custom for standard integrations
- [ ] S: Exposing content catalogs as MCP resources

**2.5: Built-in tools (Read, Write, Edit, Bash, Grep, Glob)**

- [ ] K: Grep for content search (file contents, patterns)
- [ ] K: Glob for file path pattern matching (name/extension)
- [ ] K: Read/Write for full file ops; Edit for targeted modifications
- [ ] K: Read+Write fallback when Edit fails on non-unique text matches
- [ ] S: Selecting Grep for searching code content across codebase
- [ ] S: Selecting Glob for finding files by naming patterns
- [ ] S: Using Read+Write fallback when Edit cannot find unique anchor
- [ ] S: Building codebase understanding incrementally: Grep entry points then Read to trace
- [ ] S: Tracing function usage across wrapper modules

</details>

## Domain 3: Claude Code Configuration & Workflows (20%)

**Progress:** 15/100 (15%) `███░░░░░░░░░░░░░░░░░`

| Task Statement | Title | Qs | Concepts | Coverage | Priority |
|---|---|---|---|---|---|
| 3.1 | CLAUDE.md hierarchy, scoping, modular organization | 3 | 8 | 56% | 🟡 HIGH |
| 3.2 | Custom slash commands and skills | 3 | 9 | 50% | 🟡 HIGH |
| 3.3 | Path-specific rules for conditional convention loading | 2 | 6 | 50% | 🟡 HIGH |
| 3.4 | Plan mode vs direct execution | 2 | 8 | 38% | 🟡 HIGH |
| 3.5 | Iterative refinement techniques | 2 | 9 | 33% | 🟡 HIGH |
| 3.6 | CI/CD pipeline integration | 3 | 9 | 50% | 🟡 HIGH |

<details>
<summary>Uncovered concepts in Domain 3</summary>

**3.1: CLAUDE.md hierarchy, scoping, modular organization**

- [ ] K: CLAUDE.md hierarchy: user-level, project-level, directory-level
- [ ] K: User-level settings not shared via version control
- [ ] K: @import syntax for referencing external files
- [ ] K: .claude/rules/ directory for topic-specific rule files
- [ ] S: Diagnosing configuration hierarchy issues (e.g., instructions in user-level not project-level)
- [ ] S: Using @import to selectively include standards files per package
- [ ] S: Splitting large CLAUDE.md into focused files in .claude/rules/
- [ ] S: Using /memory command to verify which memory files are loaded

**3.2: Custom slash commands and skills**

- [ ] K: Project-scoped commands (.claude/commands/) vs user-scoped (~/.claude/commands/)
- [ ] K: Skills in .claude/skills/ with SKILL.md frontmatter: context:fork, allowed-tools, argument-hint
- [ ] K: context:fork runs skills in isolated sub-agent context
- [ ] K: Personal skill customization in ~/.claude/skills/
- [ ] S: Creating project-scoped slash commands in .claude/commands/
- [ ] S: Using context:fork to isolate verbose or exploratory skill output
- [ ] S: Configuring allowed-tools in skill frontmatter to restrict tool access
- [ ] S: Using argument-hint to prompt for required parameters
- [ ] S: Choosing between skills (on-demand) and CLAUDE.md (always-loaded)

**3.3: Path-specific rules for conditional convention loading**

- [ ] K: .claude/rules/ files with YAML frontmatter paths fields with glob patterns
- [ ] K: Path-scoped rules load only when editing matching files (reduce token usage)
- [ ] K: Glob-pattern rules advantage over directory-level CLAUDE.md for cross-directory conventions
- [ ] S: Creating .claude/rules/ files with YAML frontmatter path scoping
- [ ] S: Using glob patterns for file-type conventions regardless of directory
- [ ] S: Choosing path-specific rules over subdirectory CLAUDE.md for cross-codebase conventions

**3.4: Plan mode vs direct execution**

- [ ] K: Plan mode for complex: large-scale changes, multiple approaches, architectural decisions
- [ ] K: Direct execution for simple, well-scoped changes
- [ ] K: Plan mode enables safe exploration before committing to changes
- [ ] K: Explore subagent for isolating verbose discovery output
- [ ] S: Selecting plan mode for architectural implications (restructuring, migrations, integration choices)
- [ ] S: Selecting direct execution for clear-scope changes (single-file bug fix, adding a conditional)
- [ ] S: Using Explore subagent for verbose discovery to prevent context exhaustion
- [ ] S: Combining plan mode for investigation with direct execution for implementation

**3.5: Iterative refinement techniques**

- [ ] K: Concrete input/output examples as most effective for communicating transformations
- [ ] K: Test-driven iteration: writing test suites first, iterating via test failures
- [ ] K: Interview pattern: Claude asks questions to surface unanticipated considerations
- [ ] K: When to provide all issues in single message (interacting) vs sequential (independent)
- [ ] S: Providing 2-3 concrete input/output examples for transformation consistency
- [ ] S: Writing test suites before implementation, iterating by sharing test failures
- [ ] S: Using interview pattern for design discovery in unfamiliar domains
- [ ] S: Providing specific test cases with input/expected output for edge case fixing
- [ ] S: Addressing interacting issues in single message vs sequential for independent issues

**3.6: CI/CD pipeline integration**

- [ ] K: -p (--print) flag for non-interactive mode in automated pipelines
- [ ] K: --output-format json and --json-schema for structured CI output
- [ ] K: CLAUDE.md as mechanism for providing project context to CI-invoked Claude Code
- [ ] K: Session context isolation: same session less effective at reviewing its own changes
- [ ] S: Running Claude Code in CI with -p flag
- [ ] S: Using --output-format json with --json-schema for machine-parseable findings
- [ ] S: Including prior review findings to report only new/unaddressed issues
- [ ] S: Providing existing test files in context to avoid duplicate test suggestions
- [ ] S: Documenting testing standards in CLAUDE.md for test generation quality

</details>

## Domain 4: Prompt Engineering & Structured Output (20%)

**Progress:** 20/100 (20%) `████░░░░░░░░░░░░░░░░`

| Task Statement | Title | Qs | Concepts | Coverage | Priority |
|---|---|---|---|---|---|
| 4.1 | Explicit criteria for precision and reduced false positives | 4 | 6 | 100% | 🟢 MEDIUM |
| 4.2 | Few-shot prompting for consistency and quality | 3 | 9 | 50% | 🟡 HIGH |
| 4.3 | Structured output via tool_use and JSON schemas | 4 | 10 | 60% | 🟢 MEDIUM |
| 4.4 | Validation, retry, and feedback loops | 3 | 8 | 56% | 🟡 HIGH |
| 4.5 | Batch processing strategies | 3 | 8 | 56% | 🟡 HIGH |
| 4.6 | Multi-instance and multi-pass review architectures | 3 | 6 | 75% | 🟡 HIGH |

<details>
<summary>Uncovered concepts in Domain 4</summary>

**4.1: Explicit criteria for precision and reduced false positives**

- [ ] K: Explicit criteria over vague instructions (specific categorical vs 'be conservative')
- [ ] K: General instructions fail to improve precision vs specific categorical criteria
- [ ] K: High false positive rates undermine developer trust in all findings
- [ ] S: Writing specific review criteria defining which issues to report vs skip
- [ ] S: Temporarily disabling high false-positive categories while improving prompts
- [ ] S: Defining explicit severity criteria with concrete code examples per level

**4.2: Few-shot prompting for consistency and quality**

- [ ] K: Few-shot examples as most effective for consistently formatted, actionable output
- [ ] K: Few-shot examples for demonstrating ambiguous-case handling
- [ ] K: Few-shot enables generalization to novel patterns beyond pre-specified cases
- [ ] K: Few-shot effectiveness for reducing hallucination in extraction tasks
- [ ] S: Creating 2-4 targeted few-shot examples for ambiguous scenarios with reasoning
- [ ] S: Including few-shot examples demonstrating desired output format
- [ ] S: Few-shot examples distinguishing acceptable patterns from genuine issues
- [ ] S: Few-shot for varied document structures (citations, methodologies, formats)
- [ ] S: Few-shot showing correct extraction from varied formats to fix empty/null fields

**4.3: Structured output via tool_use and JSON schemas**

- [ ] K: tool_use with JSON schemas as most reliable for guaranteed schema-compliant output
- [ ] K: tool_choice: auto vs any vs forced — behavioral distinctions
- [ ] K: Strict schemas eliminate syntax errors but NOT semantic errors
- [ ] K: Schema design: required vs optional, enum with other+detail, extensible categories
- [ ] S: Defining extraction tools with JSON schemas, extracting from tool_use response
- [ ] S: Setting tool_choice:any when multiple schemas exist and document type unknown
- [ ] S: Forcing specific tool with tool_choice for mandatory extraction before enrichment
- [ ] S: Designing optional/nullable fields to prevent fabrication of absent values
- [ ] S: Adding 'unclear' enum values and 'other'+detail for extensible categorization
- [ ] S: Including format normalization rules alongside strict output schemas

**4.4: Validation, retry, and feedback loops**

- [ ] K: Retry-with-error-feedback: appending validation errors to guide correction
- [ ] K: Retries ineffective when information is absent from source (vs format/structural errors)
- [ ] K: Feedback loops tracking detected_pattern for dismissal pattern analysis
- [ ] K: Semantic validation errors (values don't sum) vs schema syntax errors (eliminated by tool_use)
- [ ] S: Follow-up requests with original document, failed extraction, specific validation errors
- [ ] S: Identifying when retries will be ineffective (absent info) vs effective (format mismatches)
- [ ] S: Adding detected_pattern fields for false positive pattern analysis
- [ ] S: Self-correction: calculated_total vs stated_total, conflict_detected booleans

**4.5: Batch processing strategies**

- [ ] K: Message Batches API: 50% cost savings, up to 24-hour processing, no latency SLA
- [ ] K: Appropriate for non-blocking, latency-tolerant workloads; inappropriate for blocking workflows
- [ ] K: Batch API does not support multi-turn tool calling within single request
- [ ] K: custom_id fields for correlating batch request/response pairs
- [ ] S: Matching API approach to latency requirements: sync for blocking, batch for overnight
- [ ] S: Calculating batch submission frequency based on SLA constraints
- [ ] S: Handling batch failures: resubmit only failed documents by custom_id with modifications
- [ ] S: Prompt refinement on sample set before batch-processing large volumes

**4.6: Multi-instance and multi-pass review architectures**

- [ ] K: Self-review limitations: retained reasoning context makes self-questioning less likely
- [ ] K: Independent review instances (without prior context) more effective than self-review
- [ ] K: Multi-pass: per-file local analysis + cross-file integration to avoid attention dilution
- [ ] S: Using second independent Claude instance for review without generator's context
- [ ] S: Splitting large reviews into per-file passes + cross-file integration passes
- [ ] S: Running verification passes with model self-reported confidence for calibrated routing

</details>

## Domain 5: Context Management & Reliability (15%)

**Progress:** 20/100 (20%) `████░░░░░░░░░░░░░░░░`

| Task Statement | Title | Qs | Concepts | Coverage | Priority |
|---|---|---|---|---|---|
| 5.1 | Conversation context management across long interactions | 4 | 10 | 60% | 🟢 MEDIUM |
| 5.2 | Escalation and ambiguity resolution patterns | 3 | 9 | 50% | 🟡 HIGH |
| 5.3 | Error propagation across multi-agent systems | 3 | 8 | 56% | 🟡 HIGH |
| 5.4 | Context management in large codebase exploration | 3 | 9 | 50% | 🟡 HIGH |
| 5.5 | Human review workflows and confidence calibration | 3 | 8 | 56% | 🟡 HIGH |
| 5.6 | Information provenance and multi-source synthesis | 4 | 9 | 67% | 🟢 MEDIUM |

<details>
<summary>Uncovered concepts in Domain 5</summary>

**5.1: Conversation context management across long interactions**

- [ ] K: Progressive summarization risks: condensing numerical values, dates, expectations
- [ ] K: Lost-in-the-middle effect: models underweight information in middle of long inputs
- [ ] K: Tool results accumulate and consume tokens disproportionately
- [ ] K: Complete conversation history in subsequent API requests for coherence
- [ ] S: Extracting transactional facts into persistent 'case facts' block outside summarized history
- [ ] S: Extracting structured issue data into separate context layer for multi-issue sessions
- [ ] S: Trimming verbose tool outputs to only relevant fields before context accumulation
- [ ] S: Placing key findings summaries at beginning + explicit section headers for position effects
- [ ] S: Requiring subagents to include metadata in structured outputs for downstream synthesis
- [ ] S: Modifying upstream agents to return structured data instead of verbose content for limited context budgets

**5.2: Escalation and ambiguity resolution patterns**

- [ ] K: Appropriate escalation triggers: customer requests human, policy gaps, inability to progress
- [ ] K: Escalating immediately on explicit customer demand vs offering resolution for straightforward issues
- [ ] K: Sentiment-based escalation and self-reported confidence are unreliable proxies
- [ ] K: Multiple customer matches require clarification, not heuristic selection
- [ ] S: Adding explicit escalation criteria with few-shot examples to system prompt
- [ ] S: Honoring explicit customer requests for human agents immediately
- [ ] S: Acknowledging frustration while offering resolution when within capability
- [ ] S: Escalating when policy is ambiguous or silent on specific request
- [ ] S: Asking for additional identifiers when multiple matches, not selecting by heuristics

**5.3: Error propagation across multi-agent systems**

- [ ] K: Structured error context enabling intelligent coordinator recovery
- [ ] K: Distinction: access failures (timeouts) vs valid empty results (no matches)
- [ ] K: Generic error statuses hide valuable context from coordinator
- [ ] K: Silently suppressing errors or terminating entire workflows are both anti-patterns
- [ ] S: Returning structured error context: failure type, what attempted, partial results, alternatives
- [ ] S: Distinguishing access failures from valid empty results in error reporting
- [ ] S: Subagents implement local recovery; propagate only unresolvable errors with attempts + partials
- [ ] S: Structuring synthesis output with coverage annotations for gap reporting

**5.4: Context management in large codebase exploration**

- [ ] K: Context degradation: inconsistent answers, referencing 'typical patterns' instead of specifics
- [ ] K: Scratchpad files for persisting key findings across context boundaries
- [ ] K: Subagent delegation for isolating verbose exploration output
- [ ] K: Structured state persistence for crash recovery: agent exports state, coordinator loads manifest
- [ ] S: Spawning subagents for specific investigation questions while main agent coordinates
- [ ] S: Maintaining scratchpad files recording key findings, referencing for subsequent questions
- [ ] S: Summarizing key findings from one phase before spawning sub-agents for next phase
- [ ] S: Crash recovery using structured agent state exports (manifests)
- [ ] S: Using /compact to reduce context during extended exploration

**5.5: Human review workflows and confidence calibration**

- [ ] K: Aggregate accuracy metrics may mask poor performance on specific types/fields
- [ ] K: Stratified random sampling for measuring error rates in high-confidence extractions
- [ ] K: Field-level confidence scores calibrated using labeled validation sets
- [ ] K: Validate accuracy by document type and field before automating
- [ ] S: Implementing stratified random sampling for ongoing error rate measurement
- [ ] S: Analyzing accuracy by document type and field for segment-level validation
- [ ] S: Having models output field-level confidence scores, calibrating with validation sets
- [ ] S: Routing low-confidence/ambiguous extractions to human review

**5.6: Information provenance and multi-source synthesis**

- [ ] K: Source attribution lost during summarization without claim-source mappings
- [ ] K: Structured claim-source mappings that synthesis agent must preserve and merge
- [ ] K: Handling conflicting statistics: annotate conflicts with source attribution
- [ ] K: Temporal data: requiring publication/collection dates to prevent misinterpretation
- [ ] S: Requiring subagents to output structured claim-source mappings preserved through synthesis
- [ ] S: Structuring reports distinguishing well-established from contested findings
- [ ] S: Completing analysis with conflicting values annotated, letting coordinator reconcile
- [ ] S: Requiring publication/data collection dates in structured outputs
- [ ] S: Rendering different content types appropriately (tables, prose, lists) in synthesis

</details>

## Summary & Next Steps

| Metric | Value |
|---|---|
| Total questions | 91 |
| Total testable concepts | 240 |
| Target total questions | 500 |
| Remaining to write | 409 |

### Authoring Priority Queue

Task statements sorted by urgency (fewest questions first):

| Priority | Task | Title | Current Qs | Concepts | Gap |
|---|---|---|---|---|---|
| 1 | 2.3 | Tool distribution and tool_choice configuration | 2 | 9 | +6 needed |
| 2 | 3.5 | Iterative refinement techniques | 2 | 9 | +6 needed |
| 3 | 3.4 | Plan mode vs direct execution | 2 | 8 | +6 needed |
| 4 | 3.3 | Path-specific rules for conditional convention loading | 2 | 6 | +6 needed |
| 5 | 2.4 | MCP server integration in Claude Code and agent workflows | 3 | 9 | +5 needed |
| 6 | 2.5 | Built-in tools (Read, Write, Edit, Bash, Grep, Glob) | 3 | 9 | +5 needed |
| 7 | 3.2 | Custom slash commands and skills | 3 | 9 | +5 needed |
| 8 | 3.6 | CI/CD pipeline integration | 3 | 9 | +5 needed |
| 9 | 4.2 | Few-shot prompting for consistency and quality | 3 | 9 | +5 needed |
| 10 | 5.2 | Escalation and ambiguity resolution patterns | 3 | 9 | +5 needed |
| 11 | 5.4 | Context management in large codebase exploration | 3 | 9 | +5 needed |
| 12 | 1.3 | Subagent invocation, context passing, spawning | 3 | 8 | +5 needed |
| 13 | 1.7 | Session state, resumption, forking | 3 | 8 | +5 needed |
| 14 | 2.1 | Tool interface design with clear descriptions | 3 | 8 | +5 needed |
| 15 | 2.2 | Structured error responses for MCP tools | 3 | 8 | +5 needed |
| 16 | 3.1 | CLAUDE.md hierarchy, scoping, modular organization | 3 | 8 | +5 needed |
| 17 | 4.4 | Validation, retry, and feedback loops | 3 | 8 | +5 needed |
| 18 | 4.5 | Batch processing strategies | 3 | 8 | +5 needed |
| 19 | 5.3 | Error propagation across multi-agent systems | 3 | 8 | +5 needed |
| 20 | 5.5 | Human review workflows and confidence calibration | 3 | 8 | +5 needed |
| 21 | 1.1 | Agentic loop lifecycle | 3 | 6 | +5 needed |
| 22 | 1.4 | Multi-step workflows with enforcement and handoff | 3 | 6 | +5 needed |
| 23 | 1.5 | Agent SDK hooks for interception and normalization | 3 | 6 | +5 needed |
| 24 | 1.6 | Task decomposition strategies | 3 | 6 | +5 needed |
| 25 | 4.6 | Multi-instance and multi-pass review architectures | 3 | 6 | +5 needed |
| 26 | 4.3 | Structured output via tool_use and JSON schemas | 4 | 10 | +4 needed |
| 27 | 5.1 | Conversation context management across long interactions | 4 | 10 | +4 needed |
| 28 | 5.6 | Information provenance and multi-source synthesis | 4 | 9 | +4 needed |
| 29 | 1.2 | Multi-agent coordinator-subagent patterns | 4 | 8 | +4 needed |
| 30 | 4.1 | Explicit criteria for precision and reduced false positives | 4 | 6 | +4 needed |

