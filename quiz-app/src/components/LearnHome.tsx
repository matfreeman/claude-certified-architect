import type { Domain, Exercise, Lesson, QuizAttempt } from '../types'
import { getExerciseStackAreas, getLessonStackAreas } from '../data'
import StackBadges from './StackBadges'

interface Props {
  domains: Domain[]
  lessons: Lesson[]
  exercises: Exercise[]
  completedLessons: Set<string>
  completedExercises: Set<string>
  checkpointAttempts: QuizAttempt[]
  finalExamAttempt?: QuizAttempt
  onSelectLesson: (slug: string) => void
  onSelectExercise: (slug: string) => void
  onStartCheckpoint: (domainId: number) => void
  onStartFinalPractice: () => void
  onReadiness: () => void
  onHome: () => void
}

export default function LearnHome({
  domains,
  lessons,
  exercises,
  completedLessons,
  completedExercises,
  checkpointAttempts,
  finalExamAttempt,
  onSelectLesson,
  onSelectExercise,
  onStartCheckpoint,
  onStartFinalPractice,
  onReadiness,
  onHome,
}: Props) {
  const foundationsLesson = lessons.find((lesson) => lesson.domain === 0)
  const foundationsStackAreas = foundationsLesson ? getLessonStackAreas(foundationsLesson) : []

  const totalCourseItems = lessons.length + exercises.length + domains.length + 1
  const completedLessonCount = lessons.filter((lesson) => completedLessons.has(lesson.slug)).length
  const completedExerciseCount = exercises.filter((exercise) => completedExercises.has(exercise.slug)).length
  const completedCheckpointCount = domains.filter((domain) =>
    checkpointAttempts.some((attempt) => attempt.domainFilter === domain.id),
  ).length
  const finalDone = finalExamAttempt ? 1 : 0
  const overallDone =
    completedLessonCount + completedExerciseCount + completedCheckpointCount + finalDone
  const overallPct = totalCourseItems > 0 ? Math.round((overallDone / totalCourseItems) * 100) : 0

  const learningPath = [
    foundationsLesson
      ? {
          key: 'foundations',
          label: 'Foundations',
          done: completedLessons.has(foundationsLesson.slug),
          action: () => onSelectLesson(foundationsLesson.slug),
        }
      : null,
    ...domains.map((domain) => {
      const domainLessons = lessons.filter((lesson) => lesson.domain === domain.id)
      const nextLesson = domainLessons.find((lesson) => !completedLessons.has(lesson.slug))
      const checkpointAttempt = checkpointAttempts.find((attempt) => attempt.domainFilter === domain.id)
      const allLessonsDone = domainLessons.length > 0 && domainLessons.every((lesson) => completedLessons.has(lesson.slug))
      return {
        key: `domain-${domain.id}`,
        label: `Domain ${domain.id}`,
        done: allLessonsDone && !!checkpointAttempt,
        action: () => {
          if (nextLesson) onSelectLesson(nextLesson.slug)
          else onStartCheckpoint(domain.id)
        },
      }
    }),
    {
      key: 'labs',
      label: 'Labs',
      done: exercises.length > 0 && exercises.every((exercise) => completedExercises.has(exercise.slug)),
      action: () => {
        const nextExercise = exercises.find((exercise) => !completedExercises.has(exercise.slug))
        if (nextExercise) onSelectExercise(nextExercise.slug)
        else if (exercises[0]) onSelectExercise(exercises[0].slug)
      },
    },
    {
      key: 'final',
      label: 'Final exam',
      done: !!finalExamAttempt,
      action: onStartFinalPractice,
    },
  ].filter(Boolean) as { key: string; label: string; done: boolean; action: () => void }[]

  const currentPathStep = learningPath.findIndex((step) => !step.done)

  return (
    <div className="learn-home">
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
            Work through the full learning path: foundations, domain lessons, checkpoints,
            practical exercises, and the final practice exam.
          </p>
        </div>

        <div className="learn-overall-progress">
          <div className="learn-progress-label">
            <span>Overall course progress</span>
            <strong>{overallPct}%</strong>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${overallPct}%` }} />
          </div>
          <span className="progress-count">
            {overallDone} of {totalCourseItems} milestones complete
          </span>
        </div>

        <div className="learn-summary-grid">
          <SummaryPill label="Lessons" value={`${completedLessonCount}/${lessons.length}`} />
          <SummaryPill label="Labs" value={`${completedExerciseCount}/${exercises.length}`} />
          <SummaryPill label="Checkpoints" value={`${completedCheckpointCount}/${domains.length}`} />
          <SummaryPill label="Final" value={finalExamAttempt ? String(finalExamAttempt.scaled) : 'Pending'} />
        </div>

        <div className="learn-home-actions">
          <button className="btn btn-secondary" onClick={onReadiness}>
            View readiness & coverage
          </button>
          <button className="btn btn-primary" onClick={onStartFinalPractice}>
            Start final practice exam
          </button>
        </div>
      </header>

      <section className="learn-home-section learn-path-section">
        <div className="section-inner">
          <h2 className="section-title">Recommended learning path</h2>
          <p className="learn-path-hint">
            Each domain milestone is only complete once its lessons are done and its checkpoint has been attempted.
          </p>
          <div className="learn-path-steps">
            {learningPath.map((step, index) => {
              const isCurrent = index === currentPathStep
              return (
                <div
                  key={step.key}
                  className={`learn-path-step ${step.done ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}`}
                >
                  <button className="learn-path-step-btn" onClick={step.action}>
                    <span className="learn-path-num">{step.done ? '✓' : index + 1}</span>
                    <span className="learn-path-label">{step.label}</span>
                    {isCurrent && <span className="learn-path-current-tag">Next</span>}
                  </button>
                  {index < learningPath.length - 1 && <span className="learn-path-arrow">→</span>}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {foundationsLesson && (
        <section className="learn-home-section">
          <div className="section-inner">
            <h2 className="section-title">Before You Begin</h2>
            <button
              className={`foundations-card ${completedLessons.has(foundationsLesson.slug) ? 'is-done' : ''}`}
              onClick={() => onSelectLesson(foundationsLesson.slug)}
            >
              <div className="foundations-card-left">
                <span className="foundations-icon">🌐</span>
                <div>
                  <div className="foundations-card-title">
                    {completedLessons.has(foundationsLesson.slug) && <span className="lesson-check">✓</span>}
                    {foundationsLesson.title}
                  </div>
                  <div className="foundations-card-meta">
                    {foundationsLesson.minutes} min · Required before the domain checkpoints make sense
                  </div>
                  <StackBadges areas={foundationsStackAreas} dense />
                </div>
              </div>
              <span className="foundations-arrow">→</span>
            </button>
          </div>
        </section>
      )}

      <section className="learn-home-section">
        <div className="section-inner">
          <div className="learn-section-head">
            <h2 className="section-title">Exam domains</h2>
            <button className="btn btn-study" onClick={onReadiness}>
              Readiness view
            </button>
          </div>

          <div className="learn-domain-grid">
            {domains.map((domain) => {
              const domainLessons = lessons.filter((lesson) => lesson.domain === domain.id)
              const doneLessons = domainLessons.filter((lesson) => completedLessons.has(lesson.slug))
              const nextLesson = domainLessons.find((lesson) => !completedLessons.has(lesson.slug))
              const checkpointAttempt = checkpointAttempts
                .filter((attempt) => attempt.domainFilter === domain.id)
                .sort((a, b) => b.scaled - a.scaled)[0]
              const relatedExercises = exercises.filter((exercise) => exercise.domains.includes(domain.id))
              const lessonsPct = domainLessons.length > 0 ? Math.round((doneLessons.length / domainLessons.length) * 100) : 0
              const allLessonsDone = domainLessons.length > 0 && doneLessons.length === domainLessons.length

              return (
                <div
                  key={domain.id}
                  className={`learn-domain-card ${allLessonsDone && checkpointAttempt ? 'is-complete' : ''}`}
                  style={{ '--domain-color': domain.color, '--domain-bg': domain.bgColor } as React.CSSProperties}
                >
                  <div className="learn-domain-card-header">
                    <div className="learn-domain-card-title-row">
                      <span className="domain-weight">{domain.weight}%</span>
                      <span className="domain-id">Domain {domain.id}</span>
                      {allLessonsDone && checkpointAttempt && <span className="domain-complete-badge">✓ Complete</span>}
                    </div>
                    <h3 className="domain-card-name">{domain.name}</h3>
                  </div>

                  <ul className="learn-lesson-list">
                    {domainLessons.map((lesson) => {
                      const done = completedLessons.has(lesson.slug)
                      const stackAreas = getLessonStackAreas(lesson)
                      return (
                        <li key={lesson.slug}>
                          <button
                            className={`learn-lesson-item ${done ? 'is-done' : ''}`}
                            onClick={() => onSelectLesson(lesson.slug)}
                          >
                            <span className="lesson-status-dot">{done ? '✓' : '○'}</span>
                            <span className="lesson-item-main">
                              <span className="lesson-item-title">{lesson.taskStatement} {lesson.title}</span>
                              <StackBadges areas={stackAreas} dense />
                            </span>
                            <span className="lesson-item-mins">{lesson.minutes}m</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>

                  <div className="learn-domain-progress">
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${lessonsPct}%` }} />
                    </div>
                    <span className="progress-count">{doneLessons.length}/{domainLessons.length} lessons</span>
                  </div>

                  {relatedExercises.length > 0 && (
                    <div className="related-exercises">
                      <span className="related-exercises-label">Related labs</span>
                      <div className="exercise-pill-row">
                        {relatedExercises.map((exercise) => (
                          <button
                            key={exercise.slug}
                            className={`exercise-pill-button ${completedExercises.has(exercise.slug) ? 'is-done' : ''}`}
                            onClick={() => onSelectExercise(exercise.slug)}
                          >
                            {exercise.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="learn-domain-card-footer">
                    {!allLessonsDone ? (
                      <button className="btn btn-domain" onClick={() => nextLesson && onSelectLesson(nextLesson.slug)}>
                        {doneLessons.length > 0 ? 'Continue' : 'Start learning'}
                        <span className="btn-arrow">→</span>
                      </button>
                    ) : (
                      <div className="learn-domain-actions">
                        <button className="btn btn-secondary" onClick={() => onSelectLesson(domainLessons[0].slug)}>
                          Review lessons
                        </button>
                        <button className="btn btn-domain" onClick={() => onStartCheckpoint(domain.id)}>
                          {checkpointAttempt ? 'Retake checkpoint' : 'Take checkpoint'}
                        </button>
                      </div>
                    )}
                  </div>

                  {checkpointAttempt && (
                    <div className="checkpoint-summary">
                      <strong>Checkpoint:</strong> {checkpointAttempt.scaled} scaled ·{' '}
                      {Math.round(checkpointAttempt.pct * 100)}%
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="learn-home-section learn-home-section-alt">
        <div className="section-inner">
          <div className="learn-section-head">
            <h2 className="section-title">Practical exercises</h2>
            <span className="progress-count">{completedExerciseCount}/{exercises.length} complete</span>
          </div>
          <div className="exercise-grid">
            {exercises.map((exercise) => {
              const done = completedExercises.has(exercise.slug)
              const stackAreas = getExerciseStackAreas(exercise)
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
                    {exercise.deliverables?.[0] ?? 'Hands-on reinforcement tied to the exam domains.'}
                  </p>
                  <StackBadges areas={stackAreas} dense />
                  <span className="foundations-card-meta">{exercise.minutes} min</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="learn-home-section">
        <div className="section-inner">
          <div className="readiness-next-step">
            <div>
              <div className="readiness-next-label">Final milestone</div>
              <h2>Final practice exam</h2>
              <p>
                Use the full mixed-domain exam after the lessons, checkpoints, and labs to benchmark overall readiness.
              </p>
            </div>
            <button className="btn btn-primary btn-lg" onClick={onStartFinalPractice}>
              {finalExamAttempt ? 'Retake final exam' : 'Start final exam'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="learn-summary-pill">
      <span className="learn-summary-label">{label}</span>
      <strong className="learn-summary-value">{value}</strong>
    </div>
  )
}
