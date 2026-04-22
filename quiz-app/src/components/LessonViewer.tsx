import React, { useState, useEffect, useRef, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import mermaid from 'mermaid'
import type { Components } from 'react-markdown'
import type { Lesson, Question } from '../types'
import { DOMAINS, getLessonStackAreas } from '../data'
import StackBadges from './StackBadges'

// ─── Mermaid ──────────────────────────────────────────────────────────────────

mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' })

function MermaidDiagram({ code, isDark }: { code: string; isDark: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    // Always use a fresh unique ID — reusing an ID that's already in the DOM
    // causes Mermaid v10 to silently fail
    const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const theme = isDark ? 'dark' : 'neutral'
    const fullCode = `%%{init: {'theme': '${theme}'}}%%\n${code}`
    mermaid
      .render(id, fullCode)
      .then(({ svg }) => {
        if (!ref.current) return
        ref.current.innerHTML = svg
        // Keep Mermaid's width/height for proper layout, just cap max-width
        const svgEl = ref.current.querySelector('svg')
        if (svgEl) {
          svgEl.style.maxWidth = '100%'
          svgEl.style.display = 'block'
          svgEl.style.margin = '0 auto'
        }
      })
      .catch((err) => {
        if (ref.current) ref.current.innerHTML = `<pre class="mermaid-error">⚠ Could not render diagram: ${err}</pre>`
      })
  }, [code, isDark])

  return <div ref={ref} className="mermaid-diagram" />
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className={`copy-btn ${copied ? 'is-copied' : ''}`}
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
      }}
      title="Copy to clipboard"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

// ─── Theme hook ───────────────────────────────────────────────────────────────

function useIsDark() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark',
  )
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark')
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
  return isDark
}

// ─── Markdown component factory ───────────────────────────────────────────────

function makeComponents(isDark: boolean): Components {
  const hlTheme = isDark ? vscDarkPlus : oneLight

  return {
    // ── pre: handles ALL fenced code blocks ────────────────────────────────
    pre({ children }) {
      // Extract the <code> child that react-markdown places inside <pre>
      let codeEl: React.ReactElement<{ className?: string; children?: React.ReactNode }> | null =
        null
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && codeEl === null) {
          codeEl = child as React.ReactElement<{ className?: string; children?: React.ReactNode }>
        }
      })
      if (!codeEl) return <pre className="code-block">{children}</pre>

      const resolvedEl = codeEl as React.ReactElement<{ className?: string; children?: React.ReactNode }>
      const { className = '', children: codeContent } = resolvedEl.props
      const lang = /language-(\w+)/.exec(String(className))?.[1] ?? ''
      const rawCode = String(codeContent ?? '').trimEnd()

      // Mermaid diagrams get their own renderer
      if (lang === 'mermaid') {
        return <MermaidDiagram code={rawCode} isDark={isDark} />
      }

      // Everything else: syntax-highlighted code block with copy button
      return (
        <div className="code-block-wrapper">
          <div className="code-block-header">
            {lang ? (
              <span className="code-lang-label">{lang.toUpperCase()}</span>
            ) : (
              <span className="code-lang-label code-lang-plain">CODE</span>
            )}
            <CopyButton text={rawCode} />
          </div>
          <SyntaxHighlighter
            language={lang || 'text'}
            style={hlTheme}
            customStyle={{
              margin: 0,
              borderRadius: '0 0 var(--radius) var(--radius)',
              fontSize: '12.5px',
              lineHeight: '1.65',
              border: 'none',
            }}
            wrapLongLines={false}
          >
            {rawCode}
          </SyntaxHighlighter>
        </div>
      )
    },

    // ── code: ONLY inline code reaches here (blocks are consumed by pre) ───
    code({ children }) {
      return <code className="inline-code">{children}</code>
    },

    // ── Blockquotes → callout boxes ────────────────────────────────────────
    blockquote({ children }) {
      return <div className="lesson-callout lesson-callout-tip">{children}</div>
    },

    // ── Tables → scrollable ────────────────────────────────────────────────
    table({ children }) {
      return (
        <div className="table-scroll">
          <table className="lesson-table">{children}</table>
        </div>
      )
    },

    // ── External links → new tab ───────────────────────────────────────────
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
}

// ─── Exam tips collapsible ────────────────────────────────────────────────────

const EXAM_TIPS_RE = /\n---\s*\n(#+\s*Exam tips[\s\S]*)$/i

function ExamTips({
  body,
  components,
}: {
  body: string
  components: Components
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`exam-tips-section ${open ? 'is-open' : ''}`}>
      <button className="exam-tips-toggle" onClick={() => setOpen((v) => !v)}>
        <span className="exam-tips-icon">{open ? '▼' : '▶'}</span>
        <span>Exam tips</span>
        <span className="exam-tips-badge">for the test</span>
      </button>
      {open && (
        <div className="exam-tips-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {body}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}

// ─── Micro-quiz ───────────────────────────────────────────────────────────────

function MicroQuiz({
  questions,
  onCompletionChange,
}: {
  questions: Question[]
  onCompletionChange: (done: boolean) => void
}) {
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({})
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  const allDone = questions.length > 0 && questions.every((question) => Boolean(revealed[question.id]))

  useEffect(() => {
    onCompletionChange(allDone)
  }, [allDone, onCompletionChange])

  if (questions.length === 0) return null

  function handleAnswer(qId: string, letter: 'A' | 'B' | 'C' | 'D') {
    if (revealed[qId]) return
    setAnswers((prev) => ({ ...prev, [qId]: letter }))
    setRevealed((prev) => ({ ...prev, [qId]: true }))
  }

  return (
    <div className="micro-quiz">
      <div className="micro-quiz-header">
        <span className="micro-quiz-label">🎯 Quick check</span>
        <span className="micro-quiz-count">
          {questions.length} question{questions.length > 1 ? 's' : ''}
        </span>
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

interface Props {
  lesson: Lesson
  allLessons: Lesson[]
  microQuizQuestions: Question[]
  completedLessons: Set<string>
  onComplete: (slug: string) => void
  onNavigate: (slug: string) => void
  onLearnHome: () => void
  onReadiness: () => void
}

export default function LessonViewer({
  lesson,
  allLessons,
  microQuizQuestions,
  completedLessons,
  onComplete,
  onNavigate,
  onLearnHome,
  onReadiness,
}: Props) {
  const [quizDone, setQuizDone] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const isDark = useIsDark()

  const isComplete = completedLessons.has(lesson.slug)
  const domain = DOMAINS.find((d) => d.id === lesson.domain)
  const stackAreas = getLessonStackAreas(lesson)

  // Lessons in the same domain (for sidebar)
  const siblingLessons = allLessons.filter(
    (l) => l.domain === lesson.domain || (lesson.domain === 0 && l.domain === 0),
  )
  // Course-wide prev/next navigation keeps the recommended path linear,
  // including the foundations handoff into Domain 1.
  const currentIdx = allLessons.findIndex((l) => l.slug === lesson.slug)
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null

  // Split body into main content + exam tips
  const { mainBody, examTipsBody } = useMemo(() => {
    const match = lesson.body.match(EXAM_TIPS_RE)
    if (!match) return { mainBody: lesson.body, examTipsBody: '' }
    const splitIdx = lesson.body.lastIndexOf('\n---')
    return {
      mainBody: lesson.body.slice(0, splitIdx),
      examTipsBody: match[1],
    }
  }, [lesson.body])

  // Markdown components (recreate when theme changes)
  const components = useMemo(() => makeComponents(isDark), [isDark])

  // Reset state when lesson changes
  useEffect(() => {
    setQuizDone(false)
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
          <div
            className="sidebar-domain-badge"
            style={{ '--domain-color': '#6B7280' } as React.CSSProperties}
          >
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
                <span className="sidebar-lesson-title">
                  {l.taskStatement} {l.title}
                </span>
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

          <div className="lesson-stack-block">
            <div className="lesson-stack-label">Where this sits in the stack</div>
            <StackBadges areas={stackAreas} />
          </div>

          {/* Concept chips */}
          {lesson.concepts.length > 0 && (
            <div className="concept-chips">
              {lesson.concepts.map((c) => (
                <span key={c} className="concept-chip">
                  {c}
                </span>
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
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {mainBody}
          </ReactMarkdown>
        </article>

        {/* Exam tips collapsible */}
        {examTipsBody && <ExamTips body={examTipsBody} components={components} />}

        {/* Micro-quiz */}
        {showQuiz && (
          <MicroQuiz questions={microQuizQuestions} onCompletionChange={setQuizDone} />
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
          {isComplete && <div className="lesson-complete-badge">✓ Lesson complete</div>}

          <div className="lesson-nav-row">
            {prevLesson ? (
              <button
                className="btn btn-ghost lesson-nav-btn"
                onClick={() => onNavigate(prevLesson.slug)}
              >
                ← {prevLesson.title}
              </button>
            ) : (
              <span />
            )}
            {nextLesson ? (
              <button
                className="btn btn-primary lesson-nav-btn"
                onClick={() => onNavigate(nextLesson.slug)}
              >
                {nextLesson.title} →
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
