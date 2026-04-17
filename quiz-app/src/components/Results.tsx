import { useMemo } from 'react'
import type { QuizState, Domain, DomainScore } from '../types'

interface Props {
  quiz: QuizState
  domains: Domain[]
  onRestart: () => void
  onHome: () => void
}

export default function Results({ quiz, domains, onRestart, onHome }: Props) {
  const { questions, answers } = quiz

  const stats = useMemo(() => {
    const total = Object.keys(answers).length
    const correct = Object.entries(answers).filter(([id, ans]) => {
      const q = questions.find((q) => q.id === id)
      return q && ans === q.correct
    }).length

    // Scaled score: map 0-100% → 100-1000
    const pct = total > 0 ? correct / total : 0
    const scaled = Math.round(100 + pct * 900)
    const passed = scaled >= 720

    // Per-domain breakdown
    const domainScores: DomainScore[] = domains.map((d) => {
      const dQuestions = questions.filter((q) => q.domain === d.id)
      const dAnswered = dQuestions.filter((q) => answers[q.id] !== undefined)
      const dCorrect = dAnswered.filter((q) => answers[q.id] === q.correct).length
      return {
        domain: d,
        total: dQuestions.length,
        correct: dCorrect,
        pct: dAnswered.length > 0 ? dCorrect / dAnswered.length : 0,
      }
    }).filter((d) => d.total > 0)

    const elapsed = Math.round((Date.now() - quiz.startTime) / 1000)

    return { total, correct, pct, scaled, passed, domainScores, elapsed }
  }, [questions, answers, domains, quiz.startTime])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}m ${s}s`
  }

  return (
    <div className="results">
      <header className="results-header">
        <button className="btn-ghost" onClick={onHome}>← Home</button>
      </header>

      <main className="results-main">
        {/* Score card */}
        <div className={`score-card ${stats.passed ? 'score-pass' : 'score-fail'}`}>
          <div className="score-label">{stats.passed ? '🎉 Practice Passed' : '📚 Keep Studying'}</div>
          <div className="score-big">{stats.scaled}</div>
          <div className="score-sub">Scaled Score (passing: 720)</div>
          <div className="score-detail">
            {stats.correct} / {stats.total} correct · {Math.round(stats.pct * 100)}% ·{' '}
            {formatTime(stats.elapsed)}
          </div>
        </div>

        {/* Domain breakdown */}
        <section className="results-domains">
          <h2 className="results-section-title">Performance by Domain</h2>
          <div className="domain-scores">
            {stats.domainScores.map((ds) => (
              <DomainBar key={ds.domain.id} ds={ds} />
            ))}
          </div>
        </section>

        {/* Wrong answers review */}
        {stats.correct < stats.total && (
          <section className="results-review">
            <h2 className="results-section-title">Questions to Review</h2>
            <div className="review-list">
              {questions
                .filter((q) => answers[q.id] !== undefined && answers[q.id] !== q.correct)
                .map((q) => {
                  const domain = domains.find((d) => d.id === q.domain)!
                  return (
                    <div key={q.id} className="review-item">
                      <div className="review-meta">
                        <span
                          className="review-domain-tag"
                          style={{ color: domain.color, backgroundColor: domain.bgColor }}
                        >
                          Domain {domain.id} · Task {q.taskStatement}
                        </span>
                        <span className="review-answer-label">
                          You: <strong>{answers[q.id]}</strong> · Correct:{' '}
                          <strong className="answer-correct-text">{q.correct}</strong>
                        </span>
                      </div>
                      <p className="review-question">{q.question}</p>
                      <p className="review-explanation">{q.explanation}</p>
                      <a
                        className="review-doc-link"
                        href={q.docLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        📖 {q.docLink.text} ↗
                      </a>
                    </div>
                  )
                })}
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="results-actions">
          <button className="btn btn-primary btn-lg" onClick={onRestart}>
            Retake Quiz
          </button>
          <button className="btn btn-secondary btn-lg" onClick={onHome}>
            Back to Home
          </button>
        </div>
      </main>
    </div>
  )
}

function DomainBar({ ds }: { ds: DomainScore }) {
  const pct = Math.round(ds.pct * 100)
  const color = pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444'
  return (
    <div className="domain-bar">
      <div className="domain-bar-info">
        <span className="domain-bar-name">{ds.domain.name}</span>
        <span className="domain-bar-score" style={{ color }}>
          {ds.correct}/{ds.total} ({pct}%)
        </span>
      </div>
      <div className="domain-bar-track">
        <div
          className="domain-bar-fill"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <a
        className="domain-bar-link"
        href={ds.domain.docLink.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {ds.domain.docLink.text} ↗
      </a>
    </div>
  )
}
