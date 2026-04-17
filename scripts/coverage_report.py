#!/usr/bin/env python3
"""
Coverage Report Generator for Claude Certified Architect Question Bank.

Parses the exam guide to extract every testable concept (Knowledge/Skill bullet),
maps existing questions against them, and produces a gap analysis report.

Usage:
    uv run python scripts/coverage_report.py
    uv run python scripts/coverage_report.py --format markdown > COVERAGE.md
"""

import re
import sys
import yaml
from pathlib import Path

# ─── Exam guide structure: every testable bullet extracted ───

EXAM_CONCEPTS = {
    "1.1": {
        "title": "Agentic loop lifecycle",
        "knowledge": [
            "Agentic loop lifecycle: stop_reason (tool_use vs end_turn), executing tools, returning results",
            "Tool results appended to conversation history for next-action reasoning",
            "Model-driven decision-making vs pre-configured decision trees or tool sequences",
        ],
        "skills": [
            "Loop control flow: continue on stop_reason=tool_use, terminate on end_turn",
            "Adding tool results to conversation context between iterations",
            "Avoiding anti-patterns: parsing NL for termination, arbitrary iteration caps, checking text content as completion indicator",
        ],
    },
    "1.2": {
        "title": "Multi-agent coordinator-subagent patterns",
        "knowledge": [
            "Hub-and-spoke architecture: coordinator manages inter-subagent communication",
            "Subagents operate with isolated context — no automatic inheritance",
            "Coordinator role: task decomposition, delegation, result aggregation, dynamic subagent selection",
            "Risks of overly narrow task decomposition leading to incomplete coverage",
        ],
        "skills": [
            "Coordinator dynamically selects which subagents to invoke based on query requirements",
            "Partitioning research scope across subagents to minimize duplication",
            "Iterative refinement loops: coordinator evaluates synthesis for gaps, re-delegates",
            "Routing all subagent communication through coordinator for observability",
        ],
    },
    "1.3": {
        "title": "Subagent invocation, context passing, spawning",
        "knowledge": [
            "Task tool as mechanism for spawning subagents; allowedTools must include Task",
            "Subagent context must be explicitly provided — no automatic parent context inheritance",
            "AgentDefinition configuration: descriptions, system prompts, tool restrictions",
            "Fork-based session management for exploring divergent approaches",
        ],
        "skills": [
            "Including complete prior findings directly in subagent prompts",
            "Structured data formats separating content from metadata for attribution",
            "Spawning parallel subagents via multiple Task tool calls in single response",
            "Coordinator prompts specify goals/quality criteria rather than procedural steps",
        ],
    },
    "1.4": {
        "title": "Multi-step workflows with enforcement and handoff",
        "knowledge": [
            "Programmatic enforcement (hooks, prerequisite gates) vs prompt-based guidance",
            "When deterministic compliance is required, prompt instructions have non-zero failure rate",
            "Structured handoff protocols: customer details, root cause, recommended actions",
        ],
        "skills": [
            "Programmatic prerequisites blocking downstream tools until prerequisites complete",
            "Decomposing multi-concern requests, investigating each in parallel, synthesizing unified resolution",
            "Compiling structured handoff summaries for human agents lacking conversation access",
        ],
    },
    "1.5": {
        "title": "Agent SDK hooks for interception and normalization",
        "knowledge": [
            "PostToolUse hooks intercepting tool results for transformation",
            "Hook patterns intercepting outgoing tool calls to enforce compliance",
            "Hooks for deterministic guarantees vs prompts for probabilistic compliance",
        ],
        "skills": [
            "PostToolUse hooks normalizing heterogeneous data formats (timestamps, status codes)",
            "Tool call interception hooks blocking policy-violating actions, redirecting to alternatives",
            "Choosing hooks over prompt-based enforcement for guaranteed compliance",
        ],
    },
    "1.6": {
        "title": "Task decomposition strategies",
        "knowledge": [
            "Fixed sequential pipelines (prompt chaining) vs dynamic adaptive decomposition",
            "Prompt chaining: sequential steps (per-file analysis then cross-file integration)",
            "Adaptive investigation plans generating subtasks based on discoveries",
        ],
        "skills": [
            "Selecting decomposition pattern appropriate to workflow type",
            "Splitting large reviews into per-file + cross-file integration passes",
            "Decomposing open-ended tasks: map structure, identify high-impact, create adaptive plan",
        ],
    },
    "1.7": {
        "title": "Session state, resumption, forking",
        "knowledge": [
            "Named session resumption with --resume <session-name>",
            "fork_session for independent branches from shared analysis baseline",
            "Informing agent about file changes when resuming after modifications",
            "New session with structured summary more reliable than resuming with stale tool results",
        ],
        "skills": [
            "Using --resume with session names across work sessions",
            "Using fork_session for parallel exploration branches",
            "Choosing between resumption (valid context) and fresh start (stale context)",
            "Informing resumed session about specific file changes for targeted re-analysis",
        ],
    },
    "2.1": {
        "title": "Tool interface design with clear descriptions",
        "knowledge": [
            "Tool descriptions as primary mechanism for LLM tool selection",
            "Including input formats, example queries, edge cases, boundaries in descriptions",
            "Ambiguous/overlapping descriptions cause misrouting",
            "System prompt wording impact on tool selection (keyword-sensitive associations)",
        ],
        "skills": [
            "Writing descriptions that differentiate purpose, inputs, outputs, boundaries",
            "Renaming tools and updating descriptions to eliminate functional overlap",
            "Splitting generic tools into purpose-specific tools with defined contracts",
            "Reviewing system prompts for keyword-sensitive instructions overriding descriptions",
        ],
    },
    "2.2": {
        "title": "Structured error responses for MCP tools",
        "knowledge": [
            "MCP isError flag pattern for communicating tool failures",
            "Distinction: transient/validation/business/permission errors",
            "Uniform error responses prevent appropriate recovery decisions",
            "Retryable vs non-retryable errors; structured metadata prevents wasted retries",
        ],
        "skills": [
            "Returning structured error metadata: errorCategory, isRetryable, human-readable descriptions",
            "Including retriable:false and customer-friendly explanations for business rule violations",
            "Local error recovery in subagents; propagate only unresolvable errors with partial results",
            "Distinguishing access failures from valid empty results",
        ],
    },
    "2.3": {
        "title": "Tool distribution and tool_choice configuration",
        "knowledge": [
            "Too many tools (18 vs 4-5) degrades tool selection reliability",
            "Agents with out-of-specialization tools tend to misuse them",
            "Scoped tool access: role-relevant tools + limited cross-role for high-frequency needs",
            "tool_choice options: auto, any, forced tool selection",
        ],
        "skills": [
            "Restricting subagent tool sets to role-relevant tools",
            "Replacing generic tools with constrained alternatives",
            "Providing scoped cross-role tools for high-frequency needs",
            "Using forced tool_choice to ensure specific tool called first",
            "Setting tool_choice:any to guarantee tool call over conversational text",
        ],
    },
    "2.4": {
        "title": "MCP server integration in Claude Code and agent workflows",
        "knowledge": [
            "MCP server scoping: project-level (.mcp.json) vs user-level (~/.claude.json)",
            "Environment variable expansion in .mcp.json for credential management",
            "Tools from all configured MCP servers discovered at connection time",
            "MCP resources for exposing content catalogs to reduce exploratory tool calls",
        ],
        "skills": [
            "Configuring shared MCP servers in .mcp.json with env var expansion",
            "Configuring personal MCP servers in ~/.claude.json",
            "Enhancing MCP tool descriptions to prevent agent preferring built-in tools",
            "Choosing community MCP servers over custom for standard integrations",
            "Exposing content catalogs as MCP resources",
        ],
    },
    "2.5": {
        "title": "Built-in tools (Read, Write, Edit, Bash, Grep, Glob)",
        "knowledge": [
            "Grep for content search (file contents, patterns)",
            "Glob for file path pattern matching (name/extension)",
            "Read/Write for full file ops; Edit for targeted modifications",
            "Read+Write fallback when Edit fails on non-unique text matches",
        ],
        "skills": [
            "Selecting Grep for searching code content across codebase",
            "Selecting Glob for finding files by naming patterns",
            "Using Read+Write fallback when Edit cannot find unique anchor",
            "Building codebase understanding incrementally: Grep entry points then Read to trace",
            "Tracing function usage across wrapper modules",
        ],
    },
    "3.1": {
        "title": "CLAUDE.md hierarchy, scoping, modular organization",
        "knowledge": [
            "CLAUDE.md hierarchy: user-level, project-level, directory-level",
            "User-level settings not shared via version control",
            "@import syntax for referencing external files",
            ".claude/rules/ directory for topic-specific rule files",
        ],
        "skills": [
            "Diagnosing configuration hierarchy issues (e.g., instructions in user-level not project-level)",
            "Using @import to selectively include standards files per package",
            "Splitting large CLAUDE.md into focused files in .claude/rules/",
            "Using /memory command to verify which memory files are loaded",
        ],
    },
    "3.2": {
        "title": "Custom slash commands and skills",
        "knowledge": [
            "Project-scoped commands (.claude/commands/) vs user-scoped (~/.claude/commands/)",
            "Skills in .claude/skills/ with SKILL.md frontmatter: context:fork, allowed-tools, argument-hint",
            "context:fork runs skills in isolated sub-agent context",
            "Personal skill customization in ~/.claude/skills/",
        ],
        "skills": [
            "Creating project-scoped slash commands in .claude/commands/",
            "Using context:fork to isolate verbose or exploratory skill output",
            "Configuring allowed-tools in skill frontmatter to restrict tool access",
            "Using argument-hint to prompt for required parameters",
            "Choosing between skills (on-demand) and CLAUDE.md (always-loaded)",
        ],
    },
    "3.3": {
        "title": "Path-specific rules for conditional convention loading",
        "knowledge": [
            ".claude/rules/ files with YAML frontmatter paths fields with glob patterns",
            "Path-scoped rules load only when editing matching files (reduce token usage)",
            "Glob-pattern rules advantage over directory-level CLAUDE.md for cross-directory conventions",
        ],
        "skills": [
            "Creating .claude/rules/ files with YAML frontmatter path scoping",
            "Using glob patterns for file-type conventions regardless of directory",
            "Choosing path-specific rules over subdirectory CLAUDE.md for cross-codebase conventions",
        ],
    },
    "3.4": {
        "title": "Plan mode vs direct execution",
        "knowledge": [
            "Plan mode for complex: large-scale changes, multiple approaches, architectural decisions",
            "Direct execution for simple, well-scoped changes",
            "Plan mode enables safe exploration before committing to changes",
            "Explore subagent for isolating verbose discovery output",
        ],
        "skills": [
            "Selecting plan mode for architectural implications (restructuring, migrations, integration choices)",
            "Selecting direct execution for clear-scope changes (single-file bug fix, adding a conditional)",
            "Using Explore subagent for verbose discovery to prevent context exhaustion",
            "Combining plan mode for investigation with direct execution for implementation",
        ],
    },
    "3.5": {
        "title": "Iterative refinement techniques",
        "knowledge": [
            "Concrete input/output examples as most effective for communicating transformations",
            "Test-driven iteration: writing test suites first, iterating via test failures",
            "Interview pattern: Claude asks questions to surface unanticipated considerations",
            "When to provide all issues in single message (interacting) vs sequential (independent)",
        ],
        "skills": [
            "Providing 2-3 concrete input/output examples for transformation consistency",
            "Writing test suites before implementation, iterating by sharing test failures",
            "Using interview pattern for design discovery in unfamiliar domains",
            "Providing specific test cases with input/expected output for edge case fixing",
            "Addressing interacting issues in single message vs sequential for independent issues",
        ],
    },
    "3.6": {
        "title": "CI/CD pipeline integration",
        "knowledge": [
            "-p (--print) flag for non-interactive mode in automated pipelines",
            "--output-format json and --json-schema for structured CI output",
            "CLAUDE.md as mechanism for providing project context to CI-invoked Claude Code",
            "Session context isolation: same session less effective at reviewing its own changes",
        ],
        "skills": [
            "Running Claude Code in CI with -p flag",
            "Using --output-format json with --json-schema for machine-parseable findings",
            "Including prior review findings to report only new/unaddressed issues",
            "Providing existing test files in context to avoid duplicate test suggestions",
            "Documenting testing standards in CLAUDE.md for test generation quality",
        ],
    },
    "4.1": {
        "title": "Explicit criteria for precision and reduced false positives",
        "knowledge": [
            "Explicit criteria over vague instructions (specific categorical vs 'be conservative')",
            "General instructions fail to improve precision vs specific categorical criteria",
            "High false positive rates undermine developer trust in all findings",
        ],
        "skills": [
            "Writing specific review criteria defining which issues to report vs skip",
            "Temporarily disabling high false-positive categories while improving prompts",
            "Defining explicit severity criteria with concrete code examples per level",
        ],
    },
    "4.2": {
        "title": "Few-shot prompting for consistency and quality",
        "knowledge": [
            "Few-shot examples as most effective for consistently formatted, actionable output",
            "Few-shot examples for demonstrating ambiguous-case handling",
            "Few-shot enables generalization to novel patterns beyond pre-specified cases",
            "Few-shot effectiveness for reducing hallucination in extraction tasks",
        ],
        "skills": [
            "Creating 2-4 targeted few-shot examples for ambiguous scenarios with reasoning",
            "Including few-shot examples demonstrating desired output format",
            "Few-shot examples distinguishing acceptable patterns from genuine issues",
            "Few-shot for varied document structures (citations, methodologies, formats)",
            "Few-shot showing correct extraction from varied formats to fix empty/null fields",
        ],
    },
    "4.3": {
        "title": "Structured output via tool_use and JSON schemas",
        "knowledge": [
            "tool_use with JSON schemas as most reliable for guaranteed schema-compliant output",
            "tool_choice: auto vs any vs forced — behavioral distinctions",
            "Strict schemas eliminate syntax errors but NOT semantic errors",
            "Schema design: required vs optional, enum with other+detail, extensible categories",
        ],
        "skills": [
            "Defining extraction tools with JSON schemas, extracting from tool_use response",
            "Setting tool_choice:any when multiple schemas exist and document type unknown",
            "Forcing specific tool with tool_choice for mandatory extraction before enrichment",
            "Designing optional/nullable fields to prevent fabrication of absent values",
            "Adding 'unclear' enum values and 'other'+detail for extensible categorization",
            "Including format normalization rules alongside strict output schemas",
        ],
    },
    "4.4": {
        "title": "Validation, retry, and feedback loops",
        "knowledge": [
            "Retry-with-error-feedback: appending validation errors to guide correction",
            "Retries ineffective when information is absent from source (vs format/structural errors)",
            "Feedback loops tracking detected_pattern for dismissal pattern analysis",
            "Semantic validation errors (values don't sum) vs schema syntax errors (eliminated by tool_use)",
        ],
        "skills": [
            "Follow-up requests with original document, failed extraction, specific validation errors",
            "Identifying when retries will be ineffective (absent info) vs effective (format mismatches)",
            "Adding detected_pattern fields for false positive pattern analysis",
            "Self-correction: calculated_total vs stated_total, conflict_detected booleans",
        ],
    },
    "4.5": {
        "title": "Batch processing strategies",
        "knowledge": [
            "Message Batches API: 50% cost savings, up to 24-hour processing, no latency SLA",
            "Appropriate for non-blocking, latency-tolerant workloads; inappropriate for blocking workflows",
            "Batch API does not support multi-turn tool calling within single request",
            "custom_id fields for correlating batch request/response pairs",
        ],
        "skills": [
            "Matching API approach to latency requirements: sync for blocking, batch for overnight",
            "Calculating batch submission frequency based on SLA constraints",
            "Handling batch failures: resubmit only failed documents by custom_id with modifications",
            "Prompt refinement on sample set before batch-processing large volumes",
        ],
    },
    "4.6": {
        "title": "Multi-instance and multi-pass review architectures",
        "knowledge": [
            "Self-review limitations: retained reasoning context makes self-questioning less likely",
            "Independent review instances (without prior context) more effective than self-review",
            "Multi-pass: per-file local analysis + cross-file integration to avoid attention dilution",
        ],
        "skills": [
            "Using second independent Claude instance for review without generator's context",
            "Splitting large reviews into per-file passes + cross-file integration passes",
            "Running verification passes with model self-reported confidence for calibrated routing",
        ],
    },
    "5.1": {
        "title": "Conversation context management across long interactions",
        "knowledge": [
            "Progressive summarization risks: condensing numerical values, dates, expectations",
            "Lost-in-the-middle effect: models underweight information in middle of long inputs",
            "Tool results accumulate and consume tokens disproportionately",
            "Complete conversation history in subsequent API requests for coherence",
        ],
        "skills": [
            "Extracting transactional facts into persistent 'case facts' block outside summarized history",
            "Extracting structured issue data into separate context layer for multi-issue sessions",
            "Trimming verbose tool outputs to only relevant fields before context accumulation",
            "Placing key findings summaries at beginning + explicit section headers for position effects",
            "Requiring subagents to include metadata in structured outputs for downstream synthesis",
            "Modifying upstream agents to return structured data instead of verbose content for limited context budgets",
        ],
    },
    "5.2": {
        "title": "Escalation and ambiguity resolution patterns",
        "knowledge": [
            "Appropriate escalation triggers: customer requests human, policy gaps, inability to progress",
            "Escalating immediately on explicit customer demand vs offering resolution for straightforward issues",
            "Sentiment-based escalation and self-reported confidence are unreliable proxies",
            "Multiple customer matches require clarification, not heuristic selection",
        ],
        "skills": [
            "Adding explicit escalation criteria with few-shot examples to system prompt",
            "Honoring explicit customer requests for human agents immediately",
            "Acknowledging frustration while offering resolution when within capability",
            "Escalating when policy is ambiguous or silent on specific request",
            "Asking for additional identifiers when multiple matches, not selecting by heuristics",
        ],
    },
    "5.3": {
        "title": "Error propagation across multi-agent systems",
        "knowledge": [
            "Structured error context enabling intelligent coordinator recovery",
            "Distinction: access failures (timeouts) vs valid empty results (no matches)",
            "Generic error statuses hide valuable context from coordinator",
            "Silently suppressing errors or terminating entire workflows are both anti-patterns",
        ],
        "skills": [
            "Returning structured error context: failure type, what attempted, partial results, alternatives",
            "Distinguishing access failures from valid empty results in error reporting",
            "Subagents implement local recovery; propagate only unresolvable errors with attempts + partials",
            "Structuring synthesis output with coverage annotations for gap reporting",
        ],
    },
    "5.4": {
        "title": "Context management in large codebase exploration",
        "knowledge": [
            "Context degradation: inconsistent answers, referencing 'typical patterns' instead of specifics",
            "Scratchpad files for persisting key findings across context boundaries",
            "Subagent delegation for isolating verbose exploration output",
            "Structured state persistence for crash recovery: agent exports state, coordinator loads manifest",
        ],
        "skills": [
            "Spawning subagents for specific investigation questions while main agent coordinates",
            "Maintaining scratchpad files recording key findings, referencing for subsequent questions",
            "Summarizing key findings from one phase before spawning sub-agents for next phase",
            "Crash recovery using structured agent state exports (manifests)",
            "Using /compact to reduce context during extended exploration",
        ],
    },
    "5.5": {
        "title": "Human review workflows and confidence calibration",
        "knowledge": [
            "Aggregate accuracy metrics may mask poor performance on specific types/fields",
            "Stratified random sampling for measuring error rates in high-confidence extractions",
            "Field-level confidence scores calibrated using labeled validation sets",
            "Validate accuracy by document type and field before automating",
        ],
        "skills": [
            "Implementing stratified random sampling for ongoing error rate measurement",
            "Analyzing accuracy by document type and field for segment-level validation",
            "Having models output field-level confidence scores, calibrating with validation sets",
            "Routing low-confidence/ambiguous extractions to human review",
        ],
    },
    "5.6": {
        "title": "Information provenance and multi-source synthesis",
        "knowledge": [
            "Source attribution lost during summarization without claim-source mappings",
            "Structured claim-source mappings that synthesis agent must preserve and merge",
            "Handling conflicting statistics: annotate conflicts with source attribution",
            "Temporal data: requiring publication/collection dates to prevent misinterpretation",
        ],
        "skills": [
            "Requiring subagents to output structured claim-source mappings preserved through synthesis",
            "Structuring reports distinguishing well-established from contested findings",
            "Completing analysis with conflicting values annotated, letting coordinator reconcile",
            "Requiring publication/data collection dates in structured outputs",
            "Rendering different content types appropriately (tables, prose, lists) in synthesis",
        ],
    },
}


def load_questions(content_dir: Path) -> dict[str, list[dict]]:
    """Load all questions from domain YAML files, keyed by domain number."""
    questions = {}
    for i in range(1, 6):
        fpath = content_dir / f"domain-{i}.yaml"
        if not fpath.exists():
            questions[str(i)] = []
            continue
        with open(fpath) as f:
            data = yaml.safe_load(f)
        questions[str(i)] = data.get("questions", [])
    return questions


def build_coverage_map(questions: dict[str, list[dict]]) -> dict[str, list[dict]]:
    """Map task statement -> list of questions covering it."""
    coverage: dict[str, list[dict]] = {}
    for domain_num, qs in questions.items():
        for q in qs:
            ts = q.get("taskStatement", "")
            if ts not in coverage:
                coverage[ts] = []
            coverage[ts].append(q)
    return coverage


def report(fmt: str = "terminal"):
    content_dir = Path("quiz-app/content/questions")
    questions = load_questions(content_dir)
    coverage = build_coverage_map(questions)

    total_qs = sum(len(qs) for qs in questions.values())
    total_concepts = sum(
        len(v["knowledge"]) + len(v["skills"]) for v in EXAM_CONCEPTS.values()
    )

    if fmt == "markdown":
        print("# Coverage Report — Claude Certified Architect Question Bank")
        print()
        print(f"**Generated:** auto | **Total Questions:** {total_qs} | **Total Testable Concepts:** {total_concepts}")
        print()

    # Group by domain
    domains = {
        "1": ("Agentic Architecture & Orchestration", 27, 100),
        "2": ("Tool Design & MCP Integration", 18, 100),
        "3": ("Claude Code Configuration & Workflows", 20, 100),
        "4": ("Prompt Engineering & Structured Output", 20, 100),
        "5": ("Context Management & Reliability", 15, 100),
    }

    for domain_num, (name, weight, target) in domains.items():
        domain_qs = len(questions.get(domain_num, []))
        pct = (domain_qs / target * 100) if target > 0 else 0

        if fmt == "markdown":
            print(f"## Domain {domain_num}: {name} ({weight}%)")
            print()
            bar = "█" * int(pct / 5) + "░" * (20 - int(pct / 5))
            print(f"**Progress:** {domain_qs}/{target} ({pct:.0f}%) `{bar}`")
            print()
            print("| Task Statement | Title | Qs | Concepts | Coverage | Priority |")
            print("|---|---|---|---|---|---|")
        else:
            print(f"\n{'='*80}")
            print(f"DOMAIN {domain_num}: {name} ({weight}%) — {domain_qs}/{target} questions ({pct:.0f}%)")
            print(f"{'='*80}")

        for ts_key, concept_data in EXAM_CONCEPTS.items():
            if not ts_key.startswith(f"{domain_num}."):
                continue

            ts_qs = coverage.get(ts_key, [])
            num_qs = len(ts_qs)
            num_concepts = len(concept_data["knowledge"]) + len(concept_data["skills"])

            # Coverage ratio: how many concepts are we testing?
            # Rough heuristic: each question covers ~1-2 concepts
            concept_coverage = min(num_qs * 1.5 / num_concepts, 1.0) if num_concepts > 0 else 0

            # Priority scoring
            if num_qs == 0:
                priority = "🔴 CRITICAL"
                priority_sort = 0
            elif num_qs < 4:
                priority = "🟡 HIGH"
                priority_sort = 1
            elif num_qs < 8:
                priority = "🟢 MEDIUM"
                priority_sort = 2
            else:
                priority = "✅ GOOD"
                priority_sort = 3

            if fmt == "markdown":
                cov_str = f"{concept_coverage:.0%}"
                q_ids = ", ".join(q["id"] for q in ts_qs) if ts_qs else "—"
                print(f"| {ts_key} | {concept_data['title']} | {num_qs} | {num_concepts} | {cov_str} | {priority} |")
            else:
                print(f"\n  [{ts_key}] {concept_data['title']}")
                print(f"    Questions: {num_qs}  |  Testable concepts: {num_concepts}  |  Concept coverage: {concept_coverage:.0%}  |  {priority}")
                if ts_qs:
                    print(f"    IDs: {', '.join(q['id'] for q in ts_qs)}")

                # Show uncovered concepts
                if num_qs < num_concepts:
                    # List all concepts for gap analysis
                    covered_topics = set()
                    for q in ts_qs:
                        # Use question text as a rough proxy for topic coverage
                        qtext = q.get("question", "").lower() + q.get("explanation", "").lower()
                        for ki, k in enumerate(concept_data["knowledge"]):
                            if any(
                                keyword in qtext
                                for keyword in k.lower().split()[:3]
                            ):
                                covered_topics.add(("K", ki))
                        for si, s in enumerate(concept_data["skills"]):
                            if any(
                                keyword in qtext
                                for keyword in s.lower().split()[:3]
                            ):
                                covered_topics.add(("S", si))

        if fmt == "markdown":
            print()
            # Show uncovered concepts detail
            print("<details>")
            print(f"<summary>Uncovered concepts in Domain {domain_num}</summary>")
            print()
            for ts_key, concept_data in EXAM_CONCEPTS.items():
                if not ts_key.startswith(f"{domain_num}."):
                    continue
                ts_qs = coverage.get(ts_key, [])
                if len(ts_qs) >= len(concept_data["knowledge"]) + len(concept_data["skills"]):
                    continue
                print(f"**{ts_key}: {concept_data['title']}**")
                print()
                for k in concept_data["knowledge"]:
                    print(f"- [ ] K: {k}")
                for s in concept_data["skills"]:
                    print(f"- [ ] S: {s}")
                print()
            print("</details>")
            print()

    # Summary
    if fmt == "markdown":
        print("## Summary & Next Steps")
        print()
        print("| Metric | Value |")
        print("|---|---|")
        print(f"| Total questions | {total_qs} |")
        print(f"| Total testable concepts | {total_concepts} |")
        print(f"| Target total questions | 500 |")
        print(f"| Remaining to write | {max(0, 500 - total_qs)} |")
        print()

        # Priority list
        print("### Authoring Priority Queue")
        print()
        print("Task statements sorted by urgency (fewest questions first):")
        print()
        priority_list = []
        for ts_key, concept_data in EXAM_CONCEPTS.items():
            ts_qs = coverage.get(ts_key, [])
            num_concepts = len(concept_data["knowledge"]) + len(concept_data["skills"])
            priority_list.append((len(ts_qs), num_concepts, ts_key, concept_data["title"]))

        priority_list.sort(key=lambda x: (x[0], -x[1]))
        print("| Priority | Task | Title | Current Qs | Concepts | Gap |")
        print("|---|---|---|---|---|---|")
        for i, (num_qs, num_concepts, ts, title) in enumerate(priority_list, 1):
            gap = max(0, 8 - num_qs)  # Target 8 minimum per task statement
            if gap == 0:
                continue
            print(f"| {i} | {ts} | {title} | {num_qs} | {num_concepts} | +{gap} needed |")
        print()
    else:
        print(f"\n{'='*80}")
        print(f"SUMMARY: {total_qs} questions across {len(EXAM_CONCEPTS)} task statements")
        print(f"Target: 500 total | Remaining: {max(0, 500 - total_qs)}")
        print(f"{'='*80}")


if __name__ == "__main__":
    fmt = "markdown" if "--format" in sys.argv and "markdown" in sys.argv else "terminal"
    report(fmt)
