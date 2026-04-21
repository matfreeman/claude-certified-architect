import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Exercise } from '../types'
import { DOMAINS, getExerciseStackAreas } from '../data'
import StackBadges from './StackBadges'

interface Props {
  exercise: Exercise
  allExercises: Exercise[]
  completedExercises: Set<string>
  onComplete: (slug: string) => void
  onNavigate: (slug: string) => void
  onLearnHome: () => void
  onReadiness: () => void
}

export default function ExerciseViewer({
  exercise,
  allExercises,
  completedExercises,
  onComplete,
  onNavigate,
  onLearnHome,
  onReadiness,
}: Props) {
  const currentIdx = allExercises.findIndex((item) => item.slug === exercise.slug)
  const prevExercise = currentIdx > 0 ? allExercises[currentIdx - 1] : null
  const nextExercise = currentIdx < allExercises.length - 1 ? allExercises[currentIdx + 1] : null
  const isComplete = completedExercises.has(exercise.slug)
  const stackAreas = getExerciseStackAreas(exercise)

  return (
    <div className="lesson-layout">
      <aside className="lesson-sidebar">
        <button className="back-link" onClick={onLearnHome}>
          ← Study home
        </button>

        <div
          className="sidebar-domain-badge"
          style={{ '--domain-color': '#2563EB' } as React.CSSProperties}
        >
          Practical exercises
        </div>

        <nav className="sidebar-lesson-nav">
          {allExercises.map((item) => {
            const done = completedExercises.has(item.slug)
            const active = item.slug === exercise.slug
            return (
              <button
                key={item.slug}
                className={`sidebar-lesson-btn ${active ? 'is-active' : ''} ${done ? 'is-done' : ''}`}
                onClick={() => onNavigate(item.slug)}
              >
                <span className="sidebar-status">{done ? '✓' : active ? '▶' : '○'}</span>
                <span className="sidebar-lesson-title">{item.title}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <main className="lesson-main">
        <div className="lesson-header">
          <div className="lesson-meta-row">
            <span className="lesson-domain-chip" style={{ '--domain-color': '#2563EB' } as React.CSSProperties}>
              Practical exercise
            </span>
            <span className="lesson-mins">⏱ {exercise.minutes} min</span>
          </div>

          <h1 className="lesson-title">{exercise.title}</h1>

          <div className="lesson-stack-block">
            <div className="lesson-stack-label">Where this sits in the stack</div>
            <StackBadges areas={stackAreas} />
          </div>

          {exercise.concepts && exercise.concepts.length > 0 && (
            <div className="concept-chips">
              {exercise.concepts.map((concept) => (
                <span key={concept} className="concept-chip">
                  {concept}
                </span>
              ))}
            </div>
          )}

          {exercise.docLinks && exercise.docLinks.length > 0 && (
            <div className="lesson-doc-links">
              {exercise.docLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  className="lesson-doc-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📖 {link.text} ↗
                </a>
              ))}
            </div>
          )}
        </div>

        <section className="exercise-summary-grid">
          <div className="exercise-summary-card">
            <div className="exercise-summary-title">Related domains</div>
            <div className="exercise-pill-row">
              {exercise.domains.map((domainId) => {
                const domain = DOMAINS.find((candidate) => candidate.id === domainId)
                if (!domain) return null
                return (
                  <span
                    key={domain.id}
                    className="exercise-pill"
                    style={{ '--pill-color': domain.color } as React.CSSProperties}
                  >
                    Domain {domain.id}
                  </span>
                )
              })}
            </div>
          </div>

          {exercise.prerequisites && exercise.prerequisites.length > 0 && (
            <div className="exercise-summary-card">
              <div className="exercise-summary-title">Prerequisites</div>
              <div className="exercise-pill-row">
                {exercise.prerequisites.map((item) => (
                  <span key={item} className="exercise-pill exercise-pill-muted">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {exercise.deliverables && exercise.deliverables.length > 0 && (
            <div className="exercise-summary-card exercise-summary-card-wide">
              <div className="exercise-summary-title">Expected deliverables</div>
              <ul className="exercise-deliverables">
                {exercise.deliverables.map((deliverable) => (
                  <li key={deliverable}>{deliverable}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <article className="lesson-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {exercise.body}
          </ReactMarkdown>
        </article>

        <div className="lesson-footer">
          {!isComplete ? (
            <button className="btn btn-complete" onClick={() => onComplete(exercise.slug)}>
              ✓ Mark exercise complete
            </button>
          ) : (
            <div className="lesson-complete-badge">✓ Exercise complete</div>
          )}

          <div className="lesson-nav-row">
            {prevExercise ? (
              <button className="btn btn-ghost lesson-nav-btn" onClick={() => onNavigate(prevExercise.slug)}>
                ← {prevExercise.title}
              </button>
            ) : (
              <span />
            )}

            {nextExercise ? (
              <button className="btn btn-primary lesson-nav-btn" onClick={() => onNavigate(nextExercise.slug)}>
                {nextExercise.title} →
              </button>
            ) : (
              <button className="btn btn-primary" onClick={onReadiness}>
                Course readiness →
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
