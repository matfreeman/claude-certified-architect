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

export type Screen = 'home' | 'quiz' | 'results'

export interface QuizState {
  questions: Question[]
  current: number
  answers: Record<string, 'A' | 'B' | 'C' | 'D' | null>
  revealed: Record<string, boolean>
  domainFilter: number | null // null = all domains
  startTime: number
}

export interface DomainScore {
  domain: Domain
  total: number
  correct: number
  pct: number
}
