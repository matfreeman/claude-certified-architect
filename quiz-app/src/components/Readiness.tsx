import type { CoverageRow, Domain, Exercise, Lesson, QuizAttempt } from '../types'

interface Props {
  domains: Domain[]
  lessons: Lesson[]
  exercises: Exercise[]
  coverageRows: CoverageRow[]
  completedLessons: Set<string>
  completedExercises: Set<string>
  quizAttempts: QuizAttempt[]
  onLearnHome: () => void
  onSelectLesson: (slug: string) => void
  onSelectExercise: (slug: string) => void
  onStartCheckpoint: (domainId: number) => void
  onStartFinalPractice: () => void
}

function pct(num: number, den: number): number {
  return den > 0 ? Math.round((num / den) * 100) : 0
}

export default function Readiness({
  domains,
  lessons,
  exercises,
  coverageRows,
  completedLessons,
  completedExercises,
  quizAttempts,
  onLearnHome,
  onSelectLesson,
  onSelectExercise,
  onStartCheckpoint,
  onStartFinalPractice,
}: Props) {
  const foundations = lessons.find((lesson) => lesson.domain === 0)
  const completedCheckpointCount = domains.filter((domain) =>
    quizAttempts.some((attempt) => attempt.mode === 'checkpoint' && attempt.domainFilter === domain.id),
  ).length
  const finalAttempts = quizAttempts.filter((attempt) => attempt.mode === 'final')
  const bestFinalAttempt = finalAttempts.sort((a, b) => b.scaled - a.scaled)[0]

  const totalLessons = lessons.length
  const totalExercises = exercises.length
  const doneLessons = lessons.filter((lesson) => completedLessons.has(lesson.slug)).length
  const doneExercises = exercises.filter((exercise) => completedExercises.has(exercise.slug)).length

  const nextAction = (() => {
    if (foundations && !completedLessons.has(foundations.slug)) {
      return {
        label: 'Complete foundations',
        detail: 'Start with the cross-domain foundations module before moving deeper into the course.',
        action: () => onSelectLesson(foundations.slug),
      }
    }

    const nextLesson = lessons.find((lesson) => !completedLessons.has(lesson.slug))
    if (nextLesson) {
      return {
        label: `Continue ${nextLesson.taskStatement}`,
        detail: `The next incomplete lesson is ${nextLesson.title}.`,
        action: () => onSelectLesson(nextLesson.slug),
      }
    }

    const nextCheckpointDomain = domains.find(
      (domain) => !quizAttempts.some((attempt) => attempt.mode === 'checkpoint' && attempt.domainFilter === domain.id),
    )
    if (nextCheckpointDomain) {
      return {
        label: `Take Domain ${nextCheckpointDomain.id} checkpoint`,
        detail: `${nextCheckpointDomain.name} is fully taught, but its checkpoint has not been attempted yet.`,
        action: () => onStartCheckpoint(nextCheckpointDomain.id),
      }
    }

    const nextExercise = exercises.find((exercise) => !completedExercises.has(exercise.slug))
    if (nextExercise) {
      return {
        label: 'Complete practical exercise',
        detail: `${nextExercise.title} is the next incomplete lab in the course.`,
        action: () => onSelectExercise(nextExercise.slug),
      }
    }

    return {
      label: 'Take final practice exam',
      detail: 'You have completed the guided learning path. Use the final practice exam to benchmark readiness.',
      action: onStartFinalPractice,
    }
  })()

  return (
    <div className="readiness-page">
      <header className="readiness-header">
        <button className="back-link" onClick={onLearnHome}>
          ← Back to study path
        </button>
        <div className="readiness-hero">
          <div className="badge-row">
            <span className="badge badge-cert">READINESS</span>
          </div>
          <h1 className="learn-home-title">Course readiness</h1>
          <p className="learn-home-desc">
            See what you have completed, where you are strong or weak by domain, and what still needs
            hands-on reinforcement before the final practice exam.
          </p>
        </div>
      </header>

      <main className="readiness-main">
        <section className="readiness-section">
          <div className="readiness-summary-grid">
            <SummaryCard
              label="Lessons"
              value={`${doneLessons}/${totalLessons}`}
              detail={`${pct(doneLessons, totalLessons)}% complete`}
            />
            <SummaryCard
              label="Exercises"
              value={`${doneExercises}/${totalExercises}`}
              detail={`${pct(doneExercises, totalExercises)}% complete`}
            />
            <SummaryCard
              label="Checkpoints"
              value={`${completedCheckpointCount}/5`}
              detail="Domains attempted"
            />
            <SummaryCard
              label="Final exam"
              value={bestFinalAttempt ? String(bestFinalAttempt.scaled) : 'Not taken'}
              detail={bestFinalAttempt ? `${Math.round(bestFinalAttempt.pct * 100)}% best attempt` : 'Ready when you are'}
            />
          </div>
        </section>

        <section className="readiness-section">
          <div className="readiness-next-step">
            <div>
              <div className="readiness-next-label">Recommended next step</div>
              <h2>{nextAction.label}</h2>
              <p>{nextAction.detail}</p>
            </div>
            <button className="btn btn-primary btn-lg" onClick={nextAction.action}>
              Continue →
            </button>
          </div>
        </section>

        <section className="readiness-section">
          <div className="readiness-section-head">
            <h2 className="results-section-title">Domain readiness</h2>
            <button className="btn btn-study" onClick={onStartFinalPractice}>
              Start final practice exam
            </button>
          </div>

          <div className="readiness-domain-grid">
            {domains.map((domain) => {
              const domainLessons = lessons.filter((lesson) => lesson.domain === domain.id)
              const domainDone = domainLessons.filter((lesson) => completedLessons.has(lesson.slug)).length
              const checkpointAttempt = quizAttempts
                .filter((attempt) => attempt.mode === 'checkpoint' && attempt.domainFilter === domain.id)
                .sort((a, b) => b.scaled - a.scaled)[0]

              return (
                <div key={domain.id} className="readiness-domain-card">
                  <div className="readiness-domain-top">
                    <span className="domain-id">Domain {domain.id}</span>
                    <span className="domain-weight" style={{ color: domain.color }}>{domain.weight}%</span>
                  </div>
                  <h3 className="domain-card-name">{domain.name}</h3>
                  <div className="readiness-domain-meta">
                    <span>{domainDone}/{domainLessons.length} lessons complete</span>
                    <span>
                      {checkpointAttempt
                        ? `Best checkpoint: ${checkpointAttempt.scaled}`
                        : 'Checkpoint not attempted'}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct(domainDone, domainLessons.length)}%` }} />
                  </div>
                  <div className="readiness-domain-actions">
                    <button className="btn btn-secondary" onClick={() => onSelectLesson(domainLessons[0].slug)}>
                      Review lessons
                    </button>
                    <button className="btn btn-domain" onClick={() => onStartCheckpoint(domain.id)}>
                      {checkpointAttempt ? 'Retake checkpoint' : 'Take checkpoint'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="readiness-section">
          <h2 className="results-section-title">Practical exercises</h2>
          <div className="exercise-grid">
            {exercises.map((exercise) => {
              const done = completedExercises.has(exercise.slug)
              return (
                <button
                  key={exercise.slug}
                  className={`exercise-card ${done ? 'is-done' : ''}`}
                  onClick={() => onSelectExercise(exercise.slug)}
                >
                  <div className="exercise-card-top">
                    <span className="badge badge-cert">LAB</span>
                    {done && <span className="domain-complete-badge">✓ Complete</span>}
                  </div>
                  <h3 className="domain-card-name">{exercise.title}</h3>
                  <p className="domain-card-desc">
                    {exercise.deliverables?.[0] ?? 'Hands-on reinforcement for exam-critical architecture patterns.'}
                  </p>
                  <span className="foundations-card-meta">{exercise.minutes} min</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="readiness-section">
          <div className="readiness-section-head">
            <h2 className="results-section-title">Coverage map</h2>
            <div className="readiness-coverage-summary">
              <span>{coverageRows.filter((row) => row.taught).length}/30 taught</span>
              <span>{coverageRows.filter((row) => row.checked).length}/30 checked</span>
              <span>{coverageRows.filter((row) => row.applied).length}/30 applied</span>
            </div>
          </div>

          <div className="coverage-groups">
            {domains.map((domain) => (
              <section key={domain.id} className="coverage-group">
                <h3 className="coverage-group-title">Domain {domain.id}</h3>
                <div className="coverage-table">
                  {coverageRows
                    .filter((row) => row.domainId === domain.id)
                    .map((row) => (
                      <div key={row.taskStatement} className="coverage-row">
                        <div className="coverage-row-main">
                          <div className="coverage-row-label">{row.label}</div>
                          <div className="coverage-row-meta">
                            <span>{row.lessons.length} lesson{row.lessons.length === 1 ? '' : 's'}</span>
                            <span>{row.questionCount} question{row.questionCount === 1 ? '' : 's'}</span>
                            <span>{row.exercises.length} exercise{row.exercises.length === 1 ? '' : 's'}</span>
                          </div>
                        </div>
                        <div className="coverage-badges">
                          <CoverageBadge label={row.taught ? 'Taught' : 'Missing lesson'} active={row.taught} tone={row.taught ? 'good' : 'muted'} />
                          <CoverageBadge label={row.checked ? 'Checked' : 'Missing quiz'} active={row.checked} tone={row.checked ? 'good' : 'muted'} />
                          <CoverageBadge label={row.applied ? 'Applied' : 'No lab'} active={row.applied} tone={row.applied ? 'good' : 'muted'} />
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="readiness-summary-card">
      <span className="readiness-summary-label">{label}</span>
      <strong className="readiness-summary-value">{value}</strong>
      <span className="readiness-summary-detail">{detail}</span>
    </div>
  )
}

function CoverageBadge({
  label,
  active,
  tone,
}: {
  label: string
  active: boolean
  tone: 'good' | 'muted'
}) {
  return (
    <span className={`coverage-badge ${active ? 'is-active' : ''} ${tone === 'muted' ? 'is-muted' : ''}`}>
      {label}
    </span>
  )
}
