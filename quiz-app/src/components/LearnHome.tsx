import type { Domain, Lesson } from '../types'

interface Props {
  domains: Domain[]
  lessons: Lesson[]
  completedLessons: Set<string>
  onSelectDomain: (domainId: number) => void
  onSelectLesson: (slug: string) => void
  onHome: () => void
}

export default function LearnHome({
  domains,
  lessons,
  completedLessons,
  onSelectDomain,
  onSelectLesson,
  onHome,
}: Props) {
  const foundationsLesson = lessons.find((l) => l.domain === 0)
  const foundationsDone = foundationsLesson
    ? completedLessons.has(foundationsLesson.slug)
    : false

  const totalLessons = lessons.filter((l) => l.domain > 0).length
  const totalDone = lessons.filter((l) => l.domain > 0 && completedLessons.has(l.slug)).length
  const overallPct = totalLessons > 0 ? Math.round((totalDone / totalLessons) * 100) : 0

  return (
    <div className="learn-home">
      {/* Header */}
      <header className="learn-home-header">
        <button className="back-link" onClick={onHome}>
          ← Back
        </button>
        <div className="learn-home-title-block">
          <div className="badge-row">
            <span className="badge badge-cert">STUDY MODE</span>
          </div>
          <h1 className="learn-home-title">Study the Material</h1>
          <p className="learn-home-desc">
            Work through each domain to learn the core concepts, then test yourself with
            micro-quizzes at the end of each lesson.
          </p>
        </div>

        {totalLessons > 0 && (
          <div className="learn-overall-progress">
            <div className="learn-progress-label">
              <span>Overall progress</span>
              <strong>{overallPct}%</strong>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${overallPct}%` }} />
            </div>
            <span className="progress-count">
              {totalDone} of {totalLessons} lessons complete
            </span>
          </div>
        )}
      </header>

      {/* Foundations lesson */}
      {foundationsLesson && (
        <section className="learn-home-section">
          <div className="section-inner">
            <h2 className="section-title">Before You Begin</h2>
            <button
              className={`foundations-card ${foundationsDone ? 'is-done' : ''}`}
              onClick={() => onSelectLesson(foundationsLesson.slug)}
            >
              <div className="foundations-card-left">
                <span className="foundations-icon">🌐</span>
                <div>
                  <div className="foundations-card-title">
                    {foundationsDone && <span className="lesson-check">✓</span>}
                    Cross-Domain Foundations
                  </div>
                  <div className="foundations-card-meta">
                    {foundationsLesson.minutes} min · Covers API structure, stop_reason, context window
                  </div>
                </div>
              </div>
              <span className="foundations-arrow">→</span>
            </button>
          </div>
        </section>
      )}

      {/* Domain cards */}
      <section className="learn-home-section">
        <div className="section-inner">
          <h2 className="section-title">Exam Domains</h2>
          <div className="learn-domain-grid">
            {domains.map((d) => {
              const domainLessons = lessons.filter((l) => l.domain === d.id)
              const doneLessons = domainLessons.filter((l) => completedLessons.has(l.slug))
              const pct =
                domainLessons.length > 0
                  ? Math.round((doneLessons.length / domainLessons.length) * 100)
                  : 0
              const allDone = domainLessons.length > 0 && doneLessons.length === domainLessons.length
              const started = doneLessons.length > 0 && !allDone
              const nextLesson = domainLessons.find((l) => !completedLessons.has(l.slug))

              return (
                <div
                  key={d.id}
                  className={`learn-domain-card ${allDone ? 'is-complete' : ''}`}
                  style={
                    {
                      '--domain-color': d.color,
                      '--domain-bg': d.bgColor,
                    } as React.CSSProperties
                  }
                >
                  <div className="learn-domain-card-header">
                    <div className="learn-domain-card-title-row">
                      <span className="domain-weight">{d.weight}%</span>
                      <span className="domain-id">Domain {d.id}</span>
                      {allDone && <span className="domain-complete-badge">✓ Complete</span>}
                    </div>
                    <h3 className="domain-card-name">{d.name}</h3>
                  </div>

                  {/* Lesson list */}
                  <ul className="learn-lesson-list">
                    {domainLessons.map((l) => {
                      const done = completedLessons.has(l.slug)
                      return (
                        <li key={l.slug}>
                          <button
                            className={`learn-lesson-item ${done ? 'is-done' : ''}`}
                            onClick={() => onSelectLesson(l.slug)}
                          >
                            <span className="lesson-status-dot">{done ? '✓' : '○'}</span>
                            <span className="lesson-item-title">{l.taskStatement} {l.title}</span>
                            <span className="lesson-item-mins">{l.minutes}m</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>

                  {/* Progress bar */}
                  <div className="learn-domain-progress">
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="progress-count">
                      {doneLessons.length}/{domainLessons.length}
                    </span>
                  </div>

                  {/* Action button */}
                  <div className="learn-domain-card-footer">
                    <button
                      className="btn btn-domain"
                      onClick={() =>
                        nextLesson
                          ? onSelectLesson(nextLesson.slug)
                          : onSelectDomain(d.id)
                      }
                    >
                      {!started && !allDone
                        ? 'Start learning'
                        : allDone
                        ? 'Review lessons'
                        : 'Continue'}
                      <span className="btn-arrow">→</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
