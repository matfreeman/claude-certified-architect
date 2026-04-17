import { load as yamlLoad } from 'js-yaml'
import type { Domain, Question } from './types'

// ─── Domains ──────────────────────────────────────────────────────────────────

export const DOMAINS: Domain[] = [
  {
    id: 1,
    name: 'Agentic Architecture & Orchestration',
    shortName: 'Agentic Architecture',
    weight: 27,
    description:
      'Agentic loops, multi-agent coordination, subagent spawning, hooks, session management, and task decomposition strategies.',
    color: '#D97706',
    bgColor: 'rgba(217,119,6,0.10)',
    taskStatements: [
      '1.1 Agentic loop lifecycle',
      '1.2 Coordinator-subagent patterns',
      '1.3 Subagent invocation & context passing',
      '1.4 Multi-step workflow enforcement',
      '1.5 Agent SDK hooks',
      '1.6 Task decomposition strategies',
      '1.7 Session state, resumption & forking',
    ],
    docLink: {
      text: 'Claude Agent SDK docs',
      url: 'https://code.claude.com/docs/en/agent-sdk/overview',
    },
  },
  {
    id: 2,
    name: 'Tool Design & MCP Integration',
    shortName: 'Tool Design & MCP',
    weight: 18,
    description:
      'MCP server configuration, tool descriptions, error responses, tool distribution across agents, and built-in tool selection.',
    color: '#7C3AED',
    bgColor: 'rgba(124,58,237,0.10)',
    taskStatements: [
      '2.1 Effective tool interface design',
      '2.2 Structured MCP error responses',
      '2.3 Tool distribution & tool_choice',
      '2.4 MCP server integration',
      '2.5 Built-in tools (Read, Write, Edit, Bash, Grep, Glob)',
    ],
    docLink: {
      text: 'Model Context Protocol docs',
      url: 'https://modelcontextprotocol.io/introduction',
    },
  },
  {
    id: 3,
    name: 'Claude Code Configuration & Workflows',
    shortName: 'Claude Code',
    weight: 20,
    description:
      'CLAUDE.md hierarchy, slash commands, skills, path-specific rules, plan mode, iterative refinement, and CI/CD integration.',
    color: '#059669',
    bgColor: 'rgba(5,150,105,0.10)',
    taskStatements: [
      '3.1 CLAUDE.md hierarchy & @import',
      '3.2 Custom slash commands & skills',
      '3.3 Path-specific rules',
      '3.4 Plan mode vs direct execution',
      '3.5 Iterative refinement techniques',
      '3.6 CI/CD pipeline integration',
    ],
    docLink: {
      text: 'Claude Code docs',
      url: 'https://code.claude.com/docs',
    },
  },
  {
    id: 4,
    name: 'Prompt Engineering & Structured Output',
    shortName: 'Prompt Engineering',
    weight: 20,
    description:
      'Explicit review criteria, few-shot prompting, JSON schema tool use, validation-retry loops, batch processing, and multi-pass review.',
    color: '#2563EB',
    bgColor: 'rgba(37,99,235,0.10)',
    taskStatements: [
      '4.1 Explicit criteria & false positive reduction',
      '4.2 Few-shot prompting',
      '4.3 Structured output via tool use & JSON schemas',
      '4.4 Validation, retry & feedback loops',
      '4.5 Batch processing strategies',
      '4.6 Multi-instance & multi-pass review',
    ],
    docLink: {
      text: 'Prompt engineering guide',
      url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview',
    },
  },
  {
    id: 5,
    name: 'Context Management & Reliability',
    shortName: 'Context & Reliability',
    weight: 15,
    description:
      'Context preservation, escalation patterns, error propagation, large codebase exploration, human review workflows, and information provenance.',
    color: '#DC2626',
    bgColor: 'rgba(220,38,38,0.10)',
    taskStatements: [
      '5.1 Conversation context across long interactions',
      '5.2 Escalation & ambiguity resolution',
      '5.3 Error propagation in multi-agent systems',
      '5.4 Context in large codebase exploration',
      '5.5 Human review & confidence calibration',
      '5.6 Information provenance & uncertainty',
    ],
    docLink: {
      text: 'Building reliable agents',
      url: 'https://platform.claude.com/docs/en/build-with-claude/overview',
    },
  },
]

// ─── Questions — loaded from content/questions/domain-N.yaml ─────────────────
// To add questions: edit the relevant domain-N.yaml file and append to its
// `questions` list. No TypeScript changes required.

interface RawQuestion {
  id: string
  domain?: number
  scenario?: string
  taskStatement: string
  question: string
  options: { A: string; B: string; C: string; D: string }
  correct: 'A' | 'B' | 'C' | 'D'
  explanation: string
  docLink: { text: string; url: string }
  optionLinks?: {
    A?: { text: string; url: string }
    B?: { text: string; url: string }
    C?: { text: string; url: string }
    D?: { text: string; url: string }
  }
}

interface DomainFile {
  questions: RawQuestion[]
}

// Vite loads the raw YAML strings at build time via import.meta.glob
const rawFiles = import.meta.glob('../content/questions/domain-*.yaml', {
  as: 'raw',
  eager: true,
}) as Record<string, string>

export const QUESTIONS: Question[] = Object.entries(rawFiles)
  .sort(([a], [b]) => a.localeCompare(b)) // stable domain-1 → domain-5 order
  .flatMap(([path, raw]) => {
    const domainNum = parseInt(path.match(/domain-(\d+)/)?.[1] ?? '0', 10)
    const file = yamlLoad(raw) as DomainFile
    return (file.questions ?? []).map((q) => ({
      ...q,
      domain: q.domain ?? domainNum,
    }))
  })

// ─── Utility ──────────────────────────────────────────────────────────────────

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function getQuestionsForDomain(domainId: number | null): Question[] {
  const pool = domainId
    ? QUESTIONS.filter((q) => q.domain === domainId)
    : QUESTIONS
  return shuffle(pool)
}

export function getDomain(id: number): Domain {
  return DOMAINS.find((d) => d.id === id)!
}
