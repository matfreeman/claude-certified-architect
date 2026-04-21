import type { Domain, Exercise, Lesson } from '../types'

interface Props {
  domains: Domain[]
  totalQuestions: number
  lessons: Lesson[]
  exercises: Exercise[]
  completedLessons: Set<string>
  onStart: (domainFilter: number | null) => void
  onStudy: () => void
}

export default function Home({ domains, totalQuestions, lessons, exercises, completedLessons, onStart, onStudy }: Props) {
  const totalLessons = lessons.length
  const doneLessons = lessons.filter((l) => completedLessons.has(l.slug)).length
  const studyStarted = doneLessons > 0

  return (
    <div className="home">
      {/* Header */}
      <header className="home-header">
        <div className="home-header-inner">
          <div className="badge-row">
            <span className="badge badge-cert">CERTIFICATION PREP</span>
            <span className="badge badge-v">v0.1 · Feb 2025</span>
          </div>
          <h1 className="home-title">
            Claude Certified Architect
            <span className="home-title-sub">Foundations</span>
          </h1>
          <p className="home-desc">
            Interactive study quiz covering all 5 exam domains. Scenario-based questions with
            detailed explanations and direct links to the official Claude documentation.
          </p>
          <div className="home-meta">
            <MetaStat label="Questions" value={totalQuestions.toString()} />
            <MetaStat label="Domains" value="5" />
            <MetaStat label="Labs" value={String(exercises.length)} />
            <MetaStat label="Passing score" value="720 / 1000" />
          </div>
        </div>
      </header>

      {/* Study / Practice dual CTA */}
      <section className="home-modes">
        <div className="section-inner">
          <div className="mode-cards">
            {/* Study mode */}
            <div className="mode-card mode-card-study">
              <div className="mode-card-icon">📖</div>
              <h2 className="mode-card-title">Study the material</h2>
              <p className="mode-card-desc">
                Follow the full course path: foundations, domain lessons, domain checkpoints,
                practical exercises, and a final practice exam.
              </p>
              {studyStarted && totalLessons > 0 && (
                <div className="mode-card-progress">
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.round((doneLessons / totalLessons) * 100)}%` }}
                    />
                  </div>
                  <span className="progress-count">{doneLessons}/{totalLessons} lessons</span>
                </div>
              )}
              <button className="btn btn-study btn-lg" onClick={onStudy}>
                {studyStarted ? 'Continue studying' : 'Start learning'}
                <span className="btn-arrow">→</span>
              </button>
            </div>

            {/* Practice mode */}
            <div className="mode-card mode-card-practice">
              <div className="mode-card-icon">🎯</div>
              <h2 className="mode-card-title">Practice exam</h2>
              <p className="mode-card-desc">
                Test yourself with {totalQuestions} scenario-based questions across all 5 domains.
                Immediate feedback, explanations, and docs links.
              </p>
              <button className="btn btn-primary btn-lg" onClick={() => onStart(null)}>
                Start full practice exam
                <span className="btn-arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Domains */}
      <section className="home-section">
        <div className="section-inner">
          <h2 className="section-title">Exam Domains</h2>
          <div className="domain-grid">
            {domains.map((d) => (
              <DomainCard
                key={d.id}
                domain={d}
                onStudy={onStudy}
                onPractice={() => onStart(d.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Scenarios */}
      <section className="home-section home-section-alt">
        <div className="section-inner">
          <h2 className="section-title">Exam Scenarios</h2>
          <p className="scenarios-desc">
            The exam presents 4 of 6 possible scenarios. Questions are grounded in realistic
            production contexts.
          </p>
          <div className="scenarios-grid">
            {SCENARIOS.map((s) => (
              <div key={s.name} className="scenario-chip">
                <span className="scenario-icon">{s.icon}</span>
                <span className="scenario-name">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function MetaStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="meta-stat">
      <span className="meta-value">{value}</span>
      <span className="meta-label">{label}</span>
    </div>
  )
}

function DomainCard({
  domain,
  onStudy,
  onPractice,
}: {
  domain: Domain
  onStudy: () => void
  onPractice: () => void
}) {
  return (
    <div
      className="domain-card"
      style={{ '--domain-color': domain.color, '--domain-bg': domain.bgColor } as React.CSSProperties}
    >
      <div className="domain-card-header">
        <span className="domain-weight">{domain.weight}%</span>
        <span className="domain-id">Domain {domain.id}</span>
      </div>
      <h3 className="domain-card-name">{domain.name}</h3>
      <p className="domain-card-desc">{domain.description}</p>
      <ul className="domain-tasks">
        {domain.taskStatements.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <div className="domain-card-footer">
        <button className="btn btn-study" onClick={onStudy}>
          Study
        </button>
        <button className="btn btn-domain" onClick={onPractice}>
          Practice
        </button>
        <a
          className="domain-doc-link"
          href={domain.docLink.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {domain.docLink.text} ↗
        </a>
      </div>
    </div>
  )
}

const SCENARIOS = [
  { name: 'Customer Support Resolution Agent', icon: '🎧' },
  { name: 'Code Generation with Claude Code', icon: '💻' },
  { name: 'Multi-Agent Research System', icon: '🔬' },
  { name: 'Developer Productivity with Claude', icon: '⚡' },
  { name: 'Claude Code for Continuous Integration', icon: '🔄' },
  { name: 'Structured Data Extraction', icon: '📊' },
]
