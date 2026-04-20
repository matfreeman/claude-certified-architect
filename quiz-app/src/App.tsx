import { useState, useCallback, useEffect } from 'react'
import type { Screen, QuizState } from './types'
import { DOMAINS, QUESTIONS, LESSONS, getQuestionsForDomain, getLessonBySlug, getMicroQuizQuestions } from './data'
import Home from './components/Home'
import Quiz from './components/Quiz'
import Results from './components/Results'
import LearnHome from './components/LearnHome'
import LessonViewer from './components/LessonViewer'

// ─── Theme ────────────────────────────────────────────────────────────────────

function useTheme() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    return stored === 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return { dark, toggle: () => setDark((d) => !d) }
}

// ─── Learn progress ───────────────────────────────────────────────────────────

function useLearnProgress() {
  const [completedLessons, setCompleted] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('completedLessons')
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set()
    } catch {
      return new Set()
    }
  })

  const markComplete = useCallback((slug: string) => {
    setCompleted((prev) => {
      const next = new Set(prev)
      next.add(slug)
      localStorage.setItem('completedLessons', JSON.stringify([...next]))
      return next
    })
  }, [])

  return { completedLessons, markComplete }
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [quiz, setQuiz] = useState<QuizState | null>(null)
  const [currentLessonSlug, setCurrentLessonSlug] = useState<string | null>(null)
  const { dark, toggle: toggleTheme } = useTheme()
  const { completedLessons, markComplete } = useLearnProgress()

  // ── Quiz ──────────────────────────────────────────────────────────────────

  const startQuiz = useCallback(
    (domainFilter: number | null, fromLesson?: string) => {
      const questions = getQuestionsForDomain(domainFilter)
      setQuiz({
        questions,
        current: 0,
        answers: {},
        revealed: {},
        domainFilter,
        startTime: Date.now(),
        fromLesson,
      })
      setScreen('quiz')
    },
    [],
  )

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
    startQuiz(quiz.domainFilter, quiz.fromLesson)
  }, [quiz, startQuiz])

  const handleHome = useCallback(() => {
    setScreen('home')
    setQuiz(null)
  }, [])

  // ── Learn ─────────────────────────────────────────────────────────────────

  const openLearnHome = useCallback(() => {
    setScreen('learn')
  }, [])

  const openLesson = useCallback((slug: string) => {
    setCurrentLessonSlug(slug)
    setScreen('lesson')
  }, [])

  const handleLessonComplete = useCallback(
    (slug: string) => {
      markComplete(slug)
    },
    [markComplete],
  )

  const handleLessonQuiz = useCallback(
    (taskStatement: string) => {
      // Filter questions by task statement; fall back to domain if none match
      const matching = QUESTIONS.filter((q) => q.taskStatement === taskStatement)
      const domain = matching[0]?.domain ?? null
      startQuiz(domain, currentLessonSlug ?? undefined)
    },
    [startQuiz, currentLessonSlug],
  )

  const handleBackToLearn = useCallback(() => {
    if (quiz?.fromLesson) {
      openLesson(quiz.fromLesson)
    } else {
      setScreen('learn')
    }
    setQuiz(null)
  }, [quiz, openLesson])

  // ── Render ─────────────────────────────────────────────────────────────────

  const currentLesson = currentLessonSlug ? getLessonBySlug(currentLessonSlug) : null

  const onLessonScreen = screen === 'lesson'
  const onQuizScreen = screen === 'quiz' || screen === 'results'

  return (
    <div className="app">
      <button
        className={`theme-toggle ${dark ? 'is-dark' : 'is-light'} ${onLessonScreen ? 'theme-toggle-offset' : ''}`}
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
        <Home
          domains={DOMAINS}
          totalQuestions={QUESTIONS.length}
          lessons={LESSONS}
          completedLessons={completedLessons}
          onStart={startQuiz}
          onStudy={openLearnHome}
        />
      )}

      {screen === 'learn' && (
        <LearnHome
          domains={DOMAINS}
          lessons={LESSONS}
          completedLessons={completedLessons}
          onSelectDomain={() => {}} // handled via lesson navigation
          onSelectLesson={openLesson}
          onHome={handleHome}
        />
      )}

      {screen === 'lesson' && currentLesson && (
        <LessonViewer
          lesson={currentLesson}
          allLessons={LESSONS}
          microQuizQuestions={getMicroQuizQuestions(currentLesson.taskStatement)}
          completedLessons={completedLessons}
          onComplete={handleLessonComplete}
          onNavigate={openLesson}
          onLearnHome={openLearnHome}
          onStartQuiz={handleLessonQuiz}
        />
      )}

      {screen === 'quiz' && quiz && (
        <Quiz
          quiz={quiz}
          onAnswer={handleAnswer}
          onNext={handleNext}
          onFinish={handleFinish}
          onHome={onQuizScreen && quiz.fromLesson ? handleBackToLearn : handleHome}
        />
      )}

      {screen === 'results' && quiz && (
        <Results
          quiz={quiz}
          domains={DOMAINS}
          onRestart={handleRestart}
          onHome={quiz.fromLesson ? handleBackToLearn : handleHome}
        />
      )}
    </div>
  )
}
