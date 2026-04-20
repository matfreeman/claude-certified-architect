export interface DocLink {
  text: string
  url: string
}

export interface Question {
  id: string
  domain: number // 1-5
  scenario?: string
  taskStatement: string // e.g. "1.1", "2.3"
  question: string
  options: { A: string; B: string; C: string; D: string }
  correct: 'A' | 'B' | 'C' | 'D'
  explanation: string
  docLink: DocLink
  // Per-option links: shown on each answer button after reveal so readers can
  // immediately open the relevant docs for any concept mentioned in an option.
  optionLinks?: { A?: DocLink; B?: DocLink; C?: DocLink; D?: DocLink }
}

export interface Domain {
  id: number
  name: string
  shortName: string
  weight: number
  description: string
  color: string
  bgColor: string
  taskStatements: string[]
  docLink: DocLink
}

// ─── LMS / Study mode ─────────────────────────────────────────────────────────

export interface LessonMeta {
  /** e.g. "1.1" or "0.0" for foundations */
  taskStatement: string
  /** 1–5, or 0 for cross-domain foundations */
  domain: number
  title: string
  /** Estimated reading time in minutes */
  minutes: number
  /** Key terms shown as concept chips at the top of the lesson */
  concepts: string[]
  /** Primary doc links extracted from the lesson */
  docLinks?: DocLink[]
}

export interface Lesson extends LessonMeta {
  /** Slug used to identify the lesson file, e.g. "1.1-agentic-loop" */
  slug: string
  /** Full markdown body */
  body: string
}

export type Screen = 'home' | 'learn' | 'lesson' | 'quiz' | 'results'

export interface QuizState {
  questions: Question[]
  current: number
  answers: Record<string, 'A' | 'B' | 'C' | 'D' | null>
  revealed: Record<string, boolean>
  domainFilter: number | null // null = all domains
  startTime: number
  /** If launched from a lesson, go back there on finish */
  fromLesson?: string
}

export interface DomainScore {
  domain: Domain
  total: number
  correct: number
  pct: number
}
