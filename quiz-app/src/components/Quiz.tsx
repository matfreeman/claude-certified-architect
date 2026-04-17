import { useMemo } from 'react'
import type { QuizState } from '../types'
import { getDomain } from '../data'

interface Props {
  quiz: QuizState
  onAnswer: (questionId: string, answer: 'A' | 'B' | 'C' | 'D') => void
  onNext: () => void
  onFinish: () => void
  onHome: () => void
}

export default function Quiz({ quiz, onAnswer, onNext, onFinish, onHome }: Props) {
  const { questions, current, answers, revealed } = quiz
  const question = questions[current]
  const isRevealed = revealed[question.id]
  const selectedAnswer = answers[question.id] ?? null
  const isLast = current === questions.length - 1
  const domain = useMemo(() => getDomain(question.domain), [question.domain])

  const answeredCount = Object.keys(answers).length
  const progress = (answeredCount / questions.length) * 100

  return (
    <div className="quiz">
      {/* Top bar */}
      <header className="quiz-header">
        <button className="btn-ghost" onClick={onHome}>
          ← Home
        </button>
        <div className="quiz-progress-info">
          <span className="quiz-count">
            {current + 1} / {questions.length}
          </span>
          {quiz.domainFilter && (
            <span className="quiz-domain-badge" style={{ color: domain.color }}>
              {domain.shortName}
            </span>
          )}
        </div>
        <div className="quiz-score-pill">
          {answeredCount > 0 && (
            <>
              <span className="score-correct">
                {Object.entries(answers).filter(([id, ans]) => {
                  const q = questions.find((q) => q.id === id)
                  return q && ans === q.correct
                }).length}
              </span>
              <span className="score-sep">/</span>
              <span className="score-total">{answeredCount}</span>
            </>
          )}
        </div>
      </header>

      {/* Progress bar */}
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Question */}
      <main className="quiz-main">
        <div className="question-container">
          {/* Domain + task statement */}
          <div className="question-meta">
            <span
              className="question-domain-tag"
              style={{ backgroundColor: domain.bgColor, color: domain.color }}
            >
              Domain {domain.id}: {domain.shortName}
            </span>
            <span className="question-ts">Task {question.taskStatement}</span>
            {question.scenario && (
              <span className="question-scenario">Scenario: {question.scenario}</span>
            )}
          </div>

          {/* Question text */}
          <div className="question-text">{question.question}</div>

          {/* Answer options */}
          <div className="answers">
            {(Object.entries(question.options) as [keyof typeof question.options, string][]).map(
              ([letter, text]) => {
                let state: 'default' | 'selected' | 'correct' | 'wrong' | 'dim' = 'default'
                if (isRevealed) {
                  if (letter === question.correct) state = 'correct'
                  else if (letter === selectedAnswer) state = 'wrong'
                  else state = 'dim'
                } else if (letter === selectedAnswer) {
                  state = 'selected'
                }
                const optLink = isRevealed ? question.optionLinks?.[letter as 'A'|'B'|'C'|'D'] : undefined
                return (
                  <button
                    key={letter}
                    className={`answer-btn answer-${state}`}
                    onClick={() => !isRevealed && onAnswer(question.id, letter)}
                    disabled={isRevealed}
                  >
                    <span className="answer-letter">{letter}</span>
                    <span className="answer-text">{text}</span>
                    {isRevealed && letter === question.correct && (
                      <span className="answer-check">✓</span>
                    )}
                    {isRevealed && letter === selectedAnswer && letter !== question.correct && (
                      <span className="answer-x">✗</span>
                    )}
                    {optLink && (
                      <a
                        className="answer-doc-chip"
                        href={optLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title={optLink.text}
                      >
                        📖 docs
                      </a>
                    )}
                  </button>
                )
              }
            )}
          </div>

          {/* Explanation */}
          {isRevealed && (
            <div className="explanation">
              <div className="explanation-header">
                <span className={`explanation-result ${selectedAnswer === question.correct ? 'result-correct' : 'result-wrong'}`}>
                  {selectedAnswer === question.correct ? '✓ Correct' : `✗ Incorrect — Correct answer: ${question.correct}`}
                </span>
              </div>
              <p className="explanation-text">{question.explanation}</p>
              <a
                className="explanation-doc-link"
                href={question.docLink.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                📖 {question.docLink.text} ↗
              </a>
            </div>
          )}

          {/* Navigation */}
          {isRevealed && (
            <div className="quiz-nav">
              {isLast ? (
                <button className="btn btn-primary" onClick={onFinish}>
                  See Results →
                </button>
              ) : (
                <button className="btn btn-primary" onClick={onNext}>
                  Next Question →
                </button>
              )}
            </div>
          )}

          {!isRevealed && !selectedAnswer && (
            <p className="quiz-hint">Select an answer to continue</p>
          )}
        </div>
      </main>
    </div>
  )
}
