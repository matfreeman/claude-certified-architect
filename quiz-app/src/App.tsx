import { useState, useCallback, useEffect } from 'react'
import type { Screen, QuizState } from './types'
import { DOMAINS, QUESTIONS, getQuestionsForDomain } from './data'
import Home from './components/Home'
import Quiz from './components/Quiz'
import Results from './components/Results'

function useTheme() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    // Honour explicit user preference; default to light for readability
    return stored === 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return { dark, toggle: () => setDark((d) => !d) }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [quiz, setQuiz] = useState<QuizState | null>(null)
  const { dark, toggle: toggleTheme } = useTheme()

  const startQuiz = useCallback((domainFilter: number | null) => {
    const questions = getQuestionsForDomain(domainFilter)
    setQuiz({
      questions,
      current: 0,
      answers: {},
      revealed: {},
      domainFilter,
      startTime: Date.now(),
    })
    setScreen('quiz')
  }, [])

  const handleAnswer = useCallback((questionId: string, answer: 'A' | 'B' | 'C' | 'D') => {
    setQuiz((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        answers: { ...prev.answers, [questionId]: answer },
        revealed: { ...prev.revealed, [questionId]: true },
      }
    })
  }, [])

  const handleNext = useCallback(() => {
    setQuiz((prev) => {
      if (!prev) return prev
      if (prev.current < prev.questions.length - 1) {
        return { ...prev, current: prev.current + 1 }
      }
      return prev
    })
  }, [])

  const handleFinish = useCallback(() => {
    setScreen('results')
  }, [])

  const handleRestart = useCallback(() => {
    if (!quiz) return
    startQuiz(quiz.domainFilter)
  }, [quiz, startQuiz])

  const handleHome = useCallback(() => {
    setScreen('home')
    setQuiz(null)
  }, [])

  return (
    <div className="app">
      <button
        className={`theme-toggle ${dark ? 'is-dark' : 'is-light'}`}
        onClick={toggleTheme}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {dark ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4"/>
              <line x1="12" y1="2"  x2="12" y2="4"/>
              <line x1="12" y1="20" x2="12" y2="22"/>
              <line x1="4.22" y1="4.22"   x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="2"  y1="12" x2="4"  y2="12"/>
              <line x1="20" y1="12" x2="22" y2="12"/>
              <line x1="4.22" y1="19.78"  x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            Light
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
            Dark
          </>
        )}
      </button>
      {screen === 'home' && (
        <Home domains={DOMAINS} totalQuestions={QUESTIONS.length} onStart={startQuiz} />
      )}
      {screen === 'quiz' && quiz && (
        <Quiz
          quiz={quiz}
          onAnswer={handleAnswer}
          onNext={handleNext}
          onFinish={handleFinish}
          onHome={handleHome}
        />
      )}
      {screen === 'results' && quiz && (
        <Results
          quiz={quiz}
          domains={DOMAINS}
          onRestart={handleRestart}
          onHome={handleHome}
        />
      )}
    </div>
  )
}
