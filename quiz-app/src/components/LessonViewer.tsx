import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import type { Lesson, Question } from '../types'
import { DOMAINS } from '../data'

interface Props {
  lesson: Lesson
  allLessons: Lesson[]
  microQuizQuestions: Question[]
  completedLessons: Set<string>
  onComplete: (slug: string) => void
  onNavigate: (slug: string) => void
  onLearnHome: () => void
  onStartQuiz: (taskStatement: string) => void
}

// ─── Custom markdown renderers ────────────────────────────────────────────────

const markdownComponents: Components = {
  // Code blocks: styled with language label
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className ?? '')
    const lang = match?.[1]
    const isBlock = 'node' in props

    if (!isBlock) {
      return <code className="inline-code">{children}</code>
    }
    return (
      <div className="code-block-wrapper">
        {lang && <span className="code-lang-label">{lang}</span>}
        <pre className="code-block">
          <code>{children}</code>
        </pre>
      </div>
    )
  },
  // Blockquotes: detect exam-tip markers
  blockquote({ children }) {
    return <div className="lesson-callout lesson-callout-tip">{children}</div>
  },
  // Tables: wrap for horizontal scrolling
  table({ children }) {
    return (
      <div className="table-scroll">
        <table className="lesson-table">{children}</table>
      </div>
    )
  },
  // External links open in new tab
  a({ href, children }) {
    const isExternal = href?.startsWith('http')
    return (
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    )
  },
}

// ─── Micro-quiz section ───────────────────────────────────────────────────────

function MicroQuiz({
  questions,
  onAllAnswered,
}: {
  questions: Question[]
  onAllAnswered: () => void
}) {
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({})
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  if (questions.length === 0) return null

  function handleAnswer(qId: string, letter: 'A' | 'B' | 'C' | 'D') {
    if (revealed[qId]) return
    const next = { ...answers, [qId]: letter }
    const nextRevealed = { ...revealed, [qId]: true }
    setAnswers(next)
    setRevealed(nextRevealed)
    if (Object.keys(nextRevealed).length === questions.length) {
      setTimeout(onAllAnswered, 600)
    }
  }

  const allDone = Object.keys(revealed).length === questions.length

  return (
    <div className="micro-quiz">
      <div className="micro-quiz-header">
        <span className="micro-quiz-label">🎯 Quick check</span>
        <span className="micro-quiz-count">{questions.length} question{questions.length > 1 ? 's' : ''}</span>
      </div>
      {questions.map((q, idx) => {
        const isRevealed = revealed[q.id]
        const chosen = answers[q.id]
        return (
          <div key={q.id} className="micro-q">
            <p className="micro-q-text">
              <span className="micro-q-num">{idx + 1}.</span> {q.question}
            </p>
            <div className="micro-q-options">
              {(Object.entries(q.options) as [keyof typeof q.options, string][]).map(
                ([letter, text]) => {
                  let cls = 'micro-q-option'
                  if (isRevealed) {
                    if (letter === q.correct) cls += ' is-correct'
                    else if (letter === chosen) cls += ' is-wrong'
                    else cls += ' is-dim'
                  }
                  return (
                    <button
                      key={letter}
                      className={cls}
                      onClick={() => handleAnswer(q.id, letter as 'A' | 'B' | 'C' | 'D')}
                      disabled={!!isRevealed}
                    >
                      <span className="micro-q-letter">{letter}</span>
                      <span>{text}</span>
                    </button>
                  )
                },
              )}
            </div>
            {isRevealed && (
              <div className="micro-q-explanation">
                <strong>{chosen === q.correct ? '✓ Correct' : '✗ Incorrect'}</strong> —{' '}
                {q.explanation}
              </div>
            )}
          </div>
        )
      })}
      {allDone && (
        <p className="micro-quiz-done">
          {questions.filter((q) => answers[q.id] === q.correct).length}/{questions.length} correct
          — scroll down to mark the lesson complete.
        </p>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LessonViewer({
  lesson,
  allLessons,
  microQuizQuestions,
  completedLessons,
  onComplete,
  onNavigate,
  onLearnHome,
  onStartQuiz,
}: Props) {
  const [quizDone, setQuizDone] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const isComplete = completedLessons.has(lesson.slug)
  const domain = DOMAINS.find((d) => d.id === lesson.domain)

  // Lessons in the same domain (for sidebar)
  const siblingLessons = allLessons.filter(
    (l) => l.domain === lesson.domain || (lesson.domain === 0 && l.domain === 0),
  )
  // All domain lessons for prev/next navigation
  const domainLessons = lesson.domain === 0
    ? allLessons.filter((l) => l.domain === 0)
    : allLessons.filter((l) => l.domain > 0)

  const currentIdx = domainLessons.findIndex((l) => l.slug === lesson.slug)
  const prevLesson = currentIdx > 0 ? domainLessons[currentIdx - 1] : null
  const nextLesson = currentIdx < domainLessons.length - 1 ? domainLessons[currentIdx + 1] : null

  // Reset quiz state when lesson changes
  useEffect(() => {
    setQuizDone(false)
    contentRef.current?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0 })
  }, [lesson.slug])

  const showQuiz = microQuizQuestions.length > 0
  const canComplete = !showQuiz || quizDone || isComplete

  return (
    <div className="lesson-layout">
      {/* ── Sidebar ── */}
      <aside className="lesson-sidebar">
        <button className="back-link" onClick={onLearnHome}>
          ← Study home
        </button>

        {domain && (
          <div
            className="sidebar-domain-badge"
            style={{ '--domain-color': domain.color } as React.CSSProperties}
          >
            Domain {domain.id} · {domain.shortName}
          </div>
        )}
        {lesson.domain === 0 && (
          <div className="sidebar-domain-badge" style={{ '--domain-color': '#6B7280' } as React.CSSProperties}>
            Foundations
          </div>
        )}

        <nav className="sidebar-lesson-nav">
          {siblingLessons.map((l) => {
            const done = completedLessons.has(l.slug)
            const active = l.slug === lesson.slug
            return (
              <button
                key={l.slug}
                className={`sidebar-lesson-btn ${active ? 'is-active' : ''} ${done ? 'is-done' : ''}`}
                onClick={() => onNavigate(l.slug)}
              >
                <span className="sidebar-status">{done ? '✓' : active ? '▶' : '○'}</span>
                <span className="sidebar-lesson-title">{l.taskStatement} {l.title}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* ── Main content ── */}
      <main className="lesson-main" ref={contentRef}>
        {/* Lesson header */}
        <div className="lesson-header">
          <div className="lesson-meta-row">
            {domain && (
              <span
                className="lesson-domain-chip"
                style={{ '--domain-color': domain.color } as React.CSSProperties}
              >
                Domain {domain.id}
              </span>
            )}
            <span className="lesson-ts-chip">{lesson.taskStatement}</span>
            <span className="lesson-mins">⏱ {lesson.minutes} min read</span>
          </div>
          <h1 className="lesson-title">{lesson.title}</h1>

          {/* Concept chips */}
          {lesson.concepts.length > 0 && (
            <div className="concept-chips">
              {lesson.concepts.map((c) => (
                <span key={c} className="concept-chip">{c}</span>
              ))}
            </div>
          )}

          {/* Doc links */}
          {lesson.docLinks && lesson.docLinks.length > 0 && (
            <div className="lesson-doc-links">
              {lesson.docLinks.map((dl) => (
                <a
                  key={dl.url}
                  href={dl.url}
                  className="lesson-doc-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📖 {dl.text} ↗
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Markdown body */}
        <article className="lesson-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {lesson.body}
          </ReactMarkdown>
        </article>

        {/* Micro-quiz */}
        {showQuiz && (
          <MicroQuiz
            questions={microQuizQuestions}
            onAllAnswered={() => setQuizDone(true)}
          />
        )}

        {/* Lesson footer: complete + nav */}
        <div className="lesson-footer">
          {!isComplete && (
            <button
              className={`btn btn-complete ${canComplete ? '' : 'btn-complete-locked'}`}
              onClick={() => canComplete && onComplete(lesson.slug)}
              title={canComplete ? undefined : 'Answer the quick check questions first'}
            >
              {canComplete ? '✓ Mark lesson complete' : '🔒 Complete the quick check first'}
            </button>
          )}
          {isComplete && (
            <div className="lesson-complete-badge">✓ Lesson complete</div>
          )}

          <div className="lesson-nav-row">
            {prevLesson ? (
              <button className="btn btn-ghost lesson-nav-btn" onClick={() => onNavigate(prevLesson.slug)}>
                ← {prevLesson.title}
              </button>
            ) : (
              <span />
            )}
            {nextLesson ? (
              <button className="btn btn-primary lesson-nav-btn" onClick={() => onNavigate(nextLesson.slug)}>
                {nextLesson.title} →
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => onStartQuiz(lesson.taskStatement)}
              >
                Practice questions →
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
