import { useState, useCallback, useEffect, useMemo } from 'react'
import type { QuizAttempt, QuizMode, QuizNavContext, QuizState, Screen } from './types'
import {
  COVERAGE_ROWS,
  DOMAINS,
  EXERCISES,
  LESSONS,
  QUESTIONS,
  getDomain,
  getExerciseBySlug,
  getLessonBySlug,
  getMicroQuizQuestions,
  getQuestionsForDomain,
  getQuizSummary,
} from './data'
import Home from './components/Home'
import Quiz from './components/Quiz'
import Results from './components/Results'
import LearnHome from './components/LearnHome'
import LessonViewer from './components/LessonViewer'
import ExerciseViewer from './components/ExerciseViewer'
import Readiness from './components/Readiness'
import Cheatsheet from './components/Cheatsheet'

const COURSE_PROGRESS_STORAGE_KEY = 'cca.study.progress.v1'
const LEGACY_COMPLETED_LESSONS_KEY = 'completedLessons'
const LEGACY_COMPLETED_EXERCISES_KEY = 'completedExercises'
const LEGACY_QUIZ_ATTEMPTS_KEY = 'quizAttempts'

interface StoredCourseProgress {
  completedLessons: string[]
  completedExercises: string[]
  quizAttempts: QuizAttempt[]
}

function readStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function dedupeStrings(values: string[]): string[] {
  return [...new Set(values)]
}

function mergeAttempts(...attemptGroups: QuizAttempt[][]): QuizAttempt[] {
  const merged = new Map<string, QuizAttempt>()
  for (const group of attemptGroups) {
    for (const attempt of group) {
      merged.set(attempt.id, attempt)
    }
  }
  return [...merged.values()].sort((a, b) => b.completedAt - a.completedAt).slice(0, 50)
}

function loadCourseProgress(): StoredCourseProgress {
  const stored = readStoredJson<StoredCourseProgress | null>(COURSE_PROGRESS_STORAGE_KEY, null)
  const legacyLessons = readStoredJson<string[]>(LEGACY_COMPLETED_LESSONS_KEY, [])
  const legacyExercises = readStoredJson<string[]>(LEGACY_COMPLETED_EXERCISES_KEY, [])
  const legacyAttempts = readStoredJson<QuizAttempt[]>(LEGACY_QUIZ_ATTEMPTS_KEY, [])

  return {
    completedLessons: dedupeStrings([...(stored?.completedLessons ?? []), ...legacyLessons]),
    completedExercises: dedupeStrings([...(stored?.completedExercises ?? []), ...legacyExercises]),
    quizAttempts: mergeAttempts(stored?.quizAttempts ?? [], legacyAttempts),
  }
}

function persistCourseProgress(progress: StoredCourseProgress) {
  const snapshot: StoredCourseProgress = {
    completedLessons: dedupeStrings(progress.completedLessons),
    completedExercises: dedupeStrings(progress.completedExercises),
    quizAttempts: mergeAttempts(progress.quizAttempts),
  }

  localStorage.setItem(COURSE_PROGRESS_STORAGE_KEY, JSON.stringify(snapshot))
  localStorage.setItem(LEGACY_COMPLETED_LESSONS_KEY, JSON.stringify(snapshot.completedLessons))
  localStorage.setItem(LEGACY_COMPLETED_EXERCISES_KEY, JSON.stringify(snapshot.completedExercises))
  localStorage.setItem(LEGACY_QUIZ_ATTEMPTS_KEY, JSON.stringify(snapshot.quizAttempts))
}

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

function useCourseProgress() {
  const [progress, setProgress] = useState<StoredCourseProgress>(() => loadCourseProgress())

  useEffect(() => {
    persistCourseProgress(progress)
  }, [progress])

  const completedLessons = useMemo(
    () => new Set(progress.completedLessons),
    [progress.completedLessons],
  )
  const completedExercises = useMemo(
    () => new Set(progress.completedExercises),
    [progress.completedExercises],
  )

  const markLessonComplete = useCallback((slug: string) => {
    setProgress((prev) => {
      if (prev.completedLessons.includes(slug)) return prev
      return {
        ...prev,
        completedLessons: [...prev.completedLessons, slug],
      }
    })
  }, [])

  const markExerciseComplete = useCallback((slug: string) => {
    setProgress((prev) => {
      if (prev.completedExercises.includes(slug)) return prev
      return {
        ...prev,
        completedExercises: [...prev.completedExercises, slug],
      }
    })
  }, [])

  const recordAttempt = useCallback((quiz: QuizState) => {
    const summary = getQuizSummary(quiz, DOMAINS)
    const attempt: QuizAttempt = {
      id: `${quiz.mode}-${quiz.domainFilter ?? 'all'}-${Date.now()}`,
      mode: quiz.mode,
      title: quiz.title,
      domainFilter: quiz.domainFilter,
      startedAt: quiz.startTime,
      completedAt: Date.now(),
      questionCount: summary.total,
      correct: summary.correct,
      pct: summary.pct,
      scaled: summary.scaled,
      passed: summary.passed,
    }

    setProgress((prev) => {
      const nextAttempts = [attempt, ...prev.quizAttempts].slice(0, 50)
      return {
        ...prev,
        quizAttempts: nextAttempts,
      }
    })
  }, [])

  return {
    completedLessons,
    completedExercises,
    quizAttempts: progress.quizAttempts,
    markLessonComplete,
    markExerciseComplete,
    recordAttempt,
  }
}

function getQuizTitle(mode: QuizMode, domainFilter: number | null): string {
  if (mode === 'final') return 'Final practice exam'
  if (mode === 'checkpoint' && domainFilter) return `Domain ${domainFilter} checkpoint`
  if (mode === 'practice' && domainFilter) return `${getDomain(domainFilter).shortName} practice`
  return 'Practice exam'
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [quiz, setQuiz] = useState<QuizState | null>(null)
  const [currentLessonSlug, setCurrentLessonSlug] = useState<string | null>(null)
  const [currentExerciseSlug, setCurrentExerciseSlug] = useState<string | null>(null)
  const { dark, toggle: toggleTheme } = useTheme()
  const {
    completedLessons,
    completedExercises,
    quizAttempts,
    markLessonComplete,
    markExerciseComplete,
    recordAttempt,
  } = useCourseProgress()

  const goToNavContext = useCallback((navContext: QuizNavContext) => {
    if (navContext.screen === 'lesson' && navContext.lessonSlug) {
      setCurrentLessonSlug(navContext.lessonSlug)
      setScreen('lesson')
    } else if (navContext.screen === 'exercise' && navContext.exerciseSlug) {
      setCurrentExerciseSlug(navContext.exerciseSlug)
      setScreen('exercise')
    } else {
      setScreen(navContext.screen)
    }
    setQuiz(null)
  }, [])

  const startQuiz = useCallback(
    (domainFilter: number | null, options: { mode: QuizMode; navContext: QuizNavContext; title?: string }) => {
      setQuiz({
        questions: getQuestionsForDomain(domainFilter),
        current: 0,
        answers: {},
        revealed: {},
        domainFilter,
        startTime: Date.now(),
        mode: options.mode,
        title: options.title ?? getQuizTitle(options.mode, domainFilter),
        navContext: options.navContext,
      })
      setScreen('quiz')
    },
    [],
  )

  const startHomePractice = useCallback(
    (domainFilter: number | null) => {
      if (domainFilter === null) {
        startQuiz(null, { mode: 'final', navContext: { screen: 'home' } })
        return
      }
      startQuiz(domainFilter, {
        mode: 'practice',
        navContext: { screen: 'home' },
      })
    },
    [startQuiz],
  )

  const startCheckpoint = useCallback(
    (domainId: number, navContext: QuizNavContext = { screen: 'learn' }) => {
      startQuiz(domainId, {
        mode: 'checkpoint',
        navContext,
      })
    },
    [startQuiz],
  )

  const startFinalPractice = useCallback(
    (navContext: QuizNavContext = { screen: 'learn' }) => {
      startQuiz(null, {
        mode: 'final',
        navContext,
      })
    },
    [startQuiz],
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
    if (!quiz) return
    recordAttempt(quiz)
    setScreen('results')
  }, [quiz, recordAttempt])

  const handleRestart = useCallback(() => {
    if (!quiz) return
    startQuiz(quiz.domainFilter, {
      mode: quiz.mode,
      title: quiz.title,
      navContext: quiz.navContext,
    })
  }, [quiz, startQuiz])

  const handleHome = useCallback(() => {
    setScreen('home')
    setQuiz(null)
  }, [])

  const openLearnHome = useCallback(() => {
    setScreen('learn')
  }, [])

  const openLesson = useCallback((slug: string) => {
    setCurrentLessonSlug(slug)
    setScreen('lesson')
  }, [])

  const openExercise = useCallback((slug: string) => {
    setCurrentExerciseSlug(slug)
    setScreen('exercise')
  }, [])

  const openReadiness = useCallback(() => {
    setScreen('readiness')
  }, [])

  const openCheatsheet = useCallback(() => {
    setScreen('cheatsheet')
  }, [])

  const currentLesson = currentLessonSlug ? getLessonBySlug(currentLessonSlug) : null
  const currentExercise = currentExerciseSlug ? getExerciseBySlug(currentExerciseSlug) : null
  const lessonMicroQuizQuestions = useMemo(
    () => (currentLesson ? getMicroQuizQuestions(currentLesson.taskStatement) : []),
    [currentLesson?.slug, currentLesson?.taskStatement],
  )

  const onLessonScreen = screen === 'lesson' || screen === 'exercise'
  const onQuizScreen = screen === 'quiz' || screen === 'results'

  const checkpointAttempts = quizAttempts.filter((attempt) => attempt.mode === 'checkpoint')
  const bestFinalAttempt = quizAttempts
    .filter((attempt) => attempt.mode === 'final')
    .sort((a, b) => b.scaled - a.scaled)[0]

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
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="2" x2="12" y2="4" />
              <line x1="12" y1="20" x2="12" y2="22" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="2" y1="12" x2="4" y2="12" />
              <line x1="20" y1="12" x2="22" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
            Light
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
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
          exercises={EXERCISES}
          completedLessons={completedLessons}
          onStart={startHomePractice}
          onStudy={openLearnHome}
          onCheatsheet={openCheatsheet}
        />
      )}

      {screen === 'cheatsheet' && (
        <Cheatsheet domains={DOMAINS} onHome={handleHome} />
      )}

      {screen === 'learn' && (
        <LearnHome
          domains={DOMAINS}
          lessons={LESSONS}
          exercises={EXERCISES}
          completedLessons={completedLessons}
          completedExercises={completedExercises}
          checkpointAttempts={checkpointAttempts}
          finalExamAttempt={bestFinalAttempt}
          onSelectLesson={openLesson}
          onSelectExercise={openExercise}
          onStartCheckpoint={(domainId) => startCheckpoint(domainId, { screen: 'learn' })}
          onStartFinalPractice={() => startFinalPractice({ screen: 'learn' })}
          onReadiness={openReadiness}
          onHome={handleHome}
        />
      )}

      {screen === 'lesson' && currentLesson && (
        <LessonViewer
          lesson={currentLesson}
          allLessons={LESSONS}
          microQuizQuestions={lessonMicroQuizQuestions}
          completedLessons={completedLessons}
          onComplete={markLessonComplete}
          onNavigate={openLesson}
          onLearnHome={openLearnHome}
          onReadiness={openReadiness}
        />
      )}

      {screen === 'exercise' && currentExercise && (
        <ExerciseViewer
          exercise={currentExercise}
          allExercises={EXERCISES}
          completedExercises={completedExercises}
          onComplete={markExerciseComplete}
          onNavigate={openExercise}
          onLearnHome={openLearnHome}
          onReadiness={openReadiness}
        />
      )}

      {screen === 'readiness' && (
        <Readiness
          domains={DOMAINS}
          lessons={LESSONS}
          exercises={EXERCISES}
          coverageRows={COVERAGE_ROWS}
          completedLessons={completedLessons}
          completedExercises={completedExercises}
          quizAttempts={quizAttempts}
          onLearnHome={openLearnHome}
          onSelectLesson={openLesson}
          onSelectExercise={openExercise}
          onStartCheckpoint={(domainId) => startCheckpoint(domainId, { screen: 'readiness' })}
          onStartFinalPractice={() => startFinalPractice({ screen: 'readiness' })}
        />
      )}

      {screen === 'quiz' && quiz && (
        <Quiz
          quiz={quiz}
          onAnswer={handleAnswer}
          onNext={handleNext}
          onFinish={handleFinish}
          onHome={() => goToNavContext(quiz.navContext)}
        />
      )}

      {screen === 'results' && quiz && (
        <Results
          quiz={quiz}
          domains={DOMAINS}
          onRestart={handleRestart}
          onHome={() => goToNavContext(quiz.navContext)}
        />
      )}

      {onQuizScreen && <div className="screen-sr-only" aria-hidden="true" />}
    </div>
  )
}
