import { load as yamlLoad } from 'js-yaml'
import type {
  CoverageRow,
  Domain,
  Exercise,
  ExerciseMeta,
  Lesson,
  LessonMeta,
  Question,
  StackArea,
  StackAreaKey,
  QuizState,
  QuizSummary,
} from './types'

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

const TASK_LABELS = new Map(
  DOMAINS.flatMap((domain) =>
    domain.taskStatements.map((taskLabel) => [taskLabel.split(' ')[0], taskLabel] as const),
  ),
)

export const STACK_AREAS: Record<StackAreaKey, StackArea> = {
  cross_stack: {
    key: 'cross_stack',
    label: 'Full stack overview',
    description: 'Connects Claude Code, the Agent SDK, MCP, the Claude API, and application controls.',
    color: '#475569',
    bgColor: 'rgba(71,85,105,0.12)',
  },
  agent_sdk: {
    key: 'agent_sdk',
    label: 'Agent SDK',
    description: 'Agent loops, subagents, hooks, streaming messages, and session control.',
    color: '#D97706',
    bgColor: 'rgba(217,119,6,0.12)',
  },
  claude_code: {
    key: 'claude_code',
    label: 'Claude Code',
    description: 'Project configuration, slash commands, skills, built-in tools, and team workflows.',
    color: '#059669',
    bgColor: 'rgba(5,150,105,0.12)',
  },
  mcp: {
    key: 'mcp',
    label: 'MCP',
    description: 'External tools, resources, server configuration, and structured protocol behavior.',
    color: '#7C3AED',
    bgColor: 'rgba(124,58,237,0.12)',
  },
  claude_api: {
    key: 'claude_api',
    label: 'Claude API',
    description: 'Prompting, tool use, structured outputs, validation loops, and batch processing.',
    color: '#2563EB',
    bgColor: 'rgba(37,99,235,0.12)',
  },
  application_layer: {
    key: 'application_layer',
    label: 'Application layer',
    description: 'Deterministic workflow logic, escalation rules, review flows, and reliability controls.',
    color: '#DC2626',
    bgColor: 'rgba(220,38,38,0.12)',
  },
}

const TASK_STACK_AREA_KEYS: Record<string, StackAreaKey[]> = {
  '0.0': ['cross_stack'],
  '1.1': ['agent_sdk', 'application_layer'],
  '1.2': ['agent_sdk', 'application_layer'],
  '1.3': ['agent_sdk', 'application_layer'],
  '1.4': ['agent_sdk', 'application_layer'],
  '1.5': ['agent_sdk'],
  '1.6': ['agent_sdk', 'application_layer'],
  '1.7': ['agent_sdk', 'claude_code'],
  '2.1': ['mcp', 'claude_api'],
  '2.2': ['mcp', 'application_layer'],
  '2.3': ['mcp', 'claude_api'],
  '2.4': ['mcp', 'claude_code'],
  '2.5': ['claude_code'],
  '3.1': ['claude_code'],
  '3.2': ['claude_code'],
  '3.3': ['claude_code'],
  '3.4': ['claude_code'],
  '3.5': ['claude_code'],
  '3.6': ['claude_code', 'application_layer'],
  '4.1': ['claude_api'],
  '4.2': ['claude_api'],
  '4.3': ['claude_api', 'application_layer'],
  '4.4': ['claude_api', 'application_layer'],
  '4.5': ['claude_api'],
  '4.6': ['claude_api', 'application_layer'],
  '5.1': ['application_layer'],
  '5.2': ['application_layer'],
  '5.3': ['application_layer', 'agent_sdk'],
  '5.4': ['claude_code', 'application_layer'],
  '5.5': ['application_layer', 'claude_api'],
  '5.6': ['application_layer', 'claude_api'],
}

const STACK_AREA_ORDER: StackAreaKey[] = [
  'cross_stack',
  'agent_sdk',
  'claude_code',
  'mcp',
  'claude_api',
  'application_layer',
]

// ─── Questions — loaded from content/questions/domain-N.yaml ─────────────────

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

const rawQuestionFiles = import.meta.glob('../content/questions/domain-*.yaml', {
  as: 'raw',
  eager: true,
}) as Record<string, string>

export const QUESTIONS: Question[] = Object.entries(rawQuestionFiles)
  .sort(([a], [b]) => a.localeCompare(b))
  .flatMap(([path, raw]) => {
    const domainNum = parseInt(path.match(/domain-(\d+)/)?.[1] ?? '0', 10)
    const file = yamlLoad(raw) as DomainFile
    return (file.questions ?? []).map((q) => ({
      ...q,
      domain: q.domain ?? domainNum,
    }))
  })

// ─── Shared markdown frontmatter parsing ──────────────────────────────────────

function parseFrontmatter<TMeta>(raw: string, fallbackMeta: TMeta): { meta: TMeta; body: string } {
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/m)
  if (!fmMatch) {
    return {
      meta: fallbackMeta,
      body: raw,
    }
  }
  const meta = yamlLoad(fmMatch[1]) as TMeta
  return { meta, body: fmMatch[2].trim() }
}

// ─── Lessons — loaded from content/learn/*.md ─────────────────────────────────

const rawLessonFiles = import.meta.glob('../content/learn/*.md', {
  as: 'raw',
  eager: true,
}) as Record<string, string>

export const LESSONS: Lesson[] = Object.entries(rawLessonFiles)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, raw]) => {
    const slug = path.replace(/^.*\/([^/]+)\.md$/, '$1')
    const { meta, body } = parseFrontmatter<LessonMeta>(raw, {
      taskStatement: '0.0',
      domain: 0,
      title: 'Untitled',
      minutes: 5,
      concepts: [],
    })
    return { ...meta, slug, body }
  })

// ─── Exercises — loaded from content/exercises/*.md ───────────────────────────

const rawExerciseFiles = import.meta.glob('../content/exercises/*.md', {
  as: 'raw',
  eager: true,
}) as Record<string, string>

export const EXERCISES: Exercise[] = Object.entries(rawExerciseFiles)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, raw]) => {
    const slug = path.replace(/^.*\/([^/]+)\.md$/, '$1')
    const { meta, body } = parseFrontmatter<ExerciseMeta>(raw, {
      id: slug,
      title: 'Untitled Exercise',
      minutes: 30,
      domains: [],
      taskStatements: [],
      completionMode: 'self_attest',
    })
    return { ...meta, slug, body }
  })

// ─── Coverage rows ─────────────────────────────────────────────────────────────

export const COVERAGE_ROWS: CoverageRow[] = DOMAINS.flatMap((domain) =>
  domain.taskStatements.map((taskLabel) => {
    const taskStatement = taskLabel.split(' ')[0]
    const lessons = LESSONS.filter((lesson) => lesson.taskStatement === taskStatement)
    const questionCount = QUESTIONS.filter((question) => question.taskStatement === taskStatement).length
    const exercises = EXERCISES.filter((exercise) => exercise.taskStatements.includes(taskStatement))

    return {
      taskStatement,
      label: taskLabel,
      domainId: domain.id,
      lessons,
      questionCount,
      exercises,
      taught: lessons.length > 0,
      checked: questionCount > 0,
      applied: exercises.length > 0,
    }
  }),
)

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
  const pool = domainId ? QUESTIONS.filter((q) => q.domain === domainId) : QUESTIONS
  return shuffle(pool)
}

export function getDomain(id: number): Domain {
  return DOMAINS.find((d) => d.id === id)!
}

export function getLessonsForDomain(domainId: number): Lesson[] {
  return LESSONS.filter((l) => l.domain === domainId)
}

export function getLessonBySlug(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug)
}

export function getExerciseBySlug(slug: string): Exercise | undefined {
  return EXERCISES.find((exercise) => exercise.slug === slug)
}

export function getExercisesForDomain(domainId: number): Exercise[] {
  return EXERCISES.filter((exercise) => exercise.domains.includes(domainId))
}

export function getFirstLessonForDomain(domainId: number): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.domain === domainId)
}

export function getNextLessonInCourse(currentSlug: string): Lesson | undefined {
  const orderedLessons = LESSONS
  const currentIndex = orderedLessons.findIndex((lesson) => lesson.slug === currentSlug)
  if (currentIndex === -1) return undefined
  return orderedLessons[currentIndex + 1]
}

export function getMicroQuizQuestions(taskStatement: string, max = 3): Question[] {
  const matches = QUESTIONS.filter((q) => q.taskStatement === taskStatement)
  return shuffle(matches).slice(0, max)
}

export function getTaskStatementLabel(taskStatement: string): string {
  return TASK_LABELS.get(taskStatement) ?? taskStatement
}

export function getLessonStackAreas(lesson: Lesson): StackArea[] {
  const keys = TASK_STACK_AREA_KEYS[lesson.taskStatement] ?? []
  return keys.map((key) => STACK_AREAS[key])
}

export function getExerciseStackAreas(exercise: Exercise): StackArea[] {
  const seen = new Set<StackAreaKey>()

  for (const taskStatement of exercise.taskStatements) {
    for (const key of TASK_STACK_AREA_KEYS[taskStatement] ?? []) {
      seen.add(key)
    }
  }

  return STACK_AREA_ORDER.filter((key) => seen.has(key)).map((key) => STACK_AREAS[key])
}

export function getQuizSummary(quiz: QuizState, domains: Domain[] = DOMAINS): QuizSummary {
  const { questions, answers } = quiz

  const total = Object.values(answers).filter(Boolean).length
  const correct = Object.entries(answers).filter(([id, answer]) => {
    const question = questions.find((candidate) => candidate.id === id)
    return question && answer === question.correct
  }).length

  const pct = total > 0 ? correct / total : 0
  const scaled = Math.round(100 + pct * 900)
  const passed = scaled >= 720

  const domainScores = domains
    .map((domain) => {
      const domainQuestions = questions.filter((question) => question.domain === domain.id)
      const answeredQuestions = domainQuestions.filter((question) => answers[question.id] !== undefined)
      const domainCorrect = answeredQuestions.filter(
        (question) => answers[question.id] === question.correct,
      ).length
      return {
        domain,
        total: domainQuestions.length,
        correct: domainCorrect,
        pct: answeredQuestions.length > 0 ? domainCorrect / answeredQuestions.length : 0,
      }
    })
    .filter((domainScore) => domainScore.total > 0)

  const elapsed = Math.round((Date.now() - quiz.startTime) / 1000)

  return { total, correct, pct, scaled, passed, domainScores, elapsed }
}
