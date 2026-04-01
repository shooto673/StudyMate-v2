import { useState, useMemo, useCallback, useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import CharacterSelectPage from './pages/CharacterSelectPage'
import GradeSelectPage from './pages/GradeSelectPage'
import StageMapPage from './pages/StageMapPage'
import SectionPage from './pages/SectionPage'
import QuizPage from './pages/QuizPage'
import QuizResultPage from './pages/QuizResultPage'
import DashboardPage from './pages/DashboardPage'
import WeeklyReportPage from './pages/WeeklyReportPage'
import ParentReportPage from './pages/ParentReportPage'
import SubscriptionPage from './pages/SubscriptionPage'
import SettingsPage from './pages/SettingsPage'
import AchievementsPage from './pages/AchievementsPage'
import { UNITS } from './lib/units'
import { generateMockQuiz } from './lib/mockQuiz'
import { fetchQuizQuestions } from './lib/quizApi'
import { saveQuizResult } from './lib/progressStore'
import { useAuth } from './lib/useAuth'

export default function App() {
  const auth = useAuth()
  const [page, setPage] = useState('landing')
  const [mascotId, setMascotId] = useState(() => localStorage.getItem('sm_mascot') || 'taylor')
  const [grade, setGrade] = useState(() => localStorage.getItem('sm_grade') || 'j1')
  const [subject, setSubject] = useState('english')
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [selectedSubUnit, setSelectedSubUnit] = useState(null)
  const [quizQuestions, setQuizQuestions] = useState([])
  const [quizResult, setQuizResult] = useState(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizError, setQuizError] = useState(null)
  const [userPlan, setUserPlan] = useState('free')
  const [authError, setAuthError] = useState(null)

  // Persist mascot and grade choices
  useEffect(() => { localStorage.setItem('sm_mascot', mascotId) }, [mascotId])
  useEffect(() => { localStorage.setItem('sm_grade', grade) }, [grade])

  // Auto-redirect authenticated users past login
  useEffect(() => {
    if (!auth.loading && auth.isAuthenticated) {
      if (page === 'landing' || page === 'login') {
        // Check if user has completed onboarding
        const onboarded = localStorage.getItem('sm_onboarded')
        if (onboarded) {
          setPage('stageMap')
        } else {
          setPage('characterSelect')
        }
      }
    }
  }, [auth.loading, auth.isAuthenticated])

  const profile = useMemo(() => ({
    displayName: auth.displayName,
    email: auth.email,
    grade,
  }), [auth.displayName, auth.email, grade])

  const filteredUnits = useMemo(() =>
    UNITS.filter(u => u.grade === grade && u.subject === subject),
    [grade, subject]
  )

  const navigate = (p) => setPage(p)

  const handleSignUp = useCallback(async (email, password, displayName) => {
    setAuthError(null)
    try {
      await auth.signUp(email, password, displayName)
      navigate('characterSelect')
    } catch (err) {
      setAuthError(err.message)
      throw err
    }
  }, [auth])

  const handleSignIn = useCallback(async (email, password) => {
    setAuthError(null)
    try {
      await auth.signIn(email, password)
      const onboarded = localStorage.getItem('sm_onboarded')
      navigate(onboarded ? 'stageMap' : 'characterSelect')
    } catch (err) {
      setAuthError(err.message)
      throw err
    }
  }, [auth])

  const handleSignOut = useCallback(async () => {
    await auth.signOut()
    setPage('landing')
  }, [auth])

  const completeOnboarding = useCallback(() => {
    localStorage.setItem('sm_onboarded', '1')
  }, [])

  const startQuiz = useCallback(async (subUnit) => {
    setSelectedSubUnit(subUnit)
    setQuizQuestions([])
    setQuizResult(null)
    setQuizError(null)
    setQuizLoading(true)
    navigate('quiz')

    const questions = await fetchQuizQuestions({
      unitTitle: selectedUnit?.title || subUnit.unitTitle || '',
      subUnitTitle: subUnit.title,
      subject,
      grade,
      count: 5,
    })

    if (questions) {
      setQuizQuestions(questions)
    } else {
      setQuizQuestions(generateMockQuiz(subUnit))
      setQuizError('AI問題生成に失敗しました。モック問題を表示しています。')
    }
    setQuizLoading(false)
  }, [selectedUnit, subject, grade])

  // Show loading screen while checking auth
  if (auth.loading) {
    return (
      <div style={{ minHeight: '100dvh', background: '#FFFDF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px',
            border: '4px solid #e5e7eb', borderTopColor: '#6C63FF',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ color: '#9ca3af', fontSize: 14, fontWeight: 600 }}>読み込み中...</p>
        </div>
      </div>
    )
  }

  switch (page) {
    case 'landing':
      return <LandingPage onNavigate={navigate} />

    case 'login':
      return <LoginPage
        onNavigate={navigate}
        onEmailLogin={handleSignIn}
        onEmailSignUp={handleSignUp}
        onGoogleLogin={auth.signInWithGoogle}
        authError={authError}
      />

    case 'characterSelect':
      return <CharacterSelectPage onSelect={(id) => { setMascotId(id); navigate('gradeSelect') }} />

    case 'gradeSelect':
      return <GradeSelectPage
        onSelect={(g) => { setGrade(g); completeOnboarding(); navigate('stageMap') }}
        mascotId={mascotId}
      />

    case 'stageMap':
      return <StageMapPage
        grade={grade}
        subject={subject}
        units={filteredUnits}
        mascotId={mascotId}
        profile={profile}
        userPlan={userPlan}
        onSelectUnit={(unit) => { setSelectedUnit(unit); navigate('section') }}
        onSubjectChange={setSubject}
        onNavigate={navigate}
      />

    case 'section':
      return <SectionPage
        unit={selectedUnit}
        mascotId={mascotId}
        onSelectSubUnit={startQuiz}
        onBack={() => navigate('stageMap')}
      />

    case 'quiz':
      return <QuizPage
        questions={quizQuestions}
        subUnit={selectedSubUnit}
        mascotId={mascotId}
        loading={quizLoading}
        onComplete={(result) => {
          setQuizResult(result)
          saveQuizResult({
            subUnitSlug: selectedSubUnit?.slug || '',
            unitTitle: selectedUnit?.title || '',
            subUnitTitle: selectedSubUnit?.title || '',
            subject,
            grade,
            totalQuestions: result.totalQuestions,
            correctCount: result.correctCount,
            xpGained: result.xpGained,
          })
          navigate('quizResult')
        }}
        onQuit={() => navigate('section')}
      />

    case 'quizResult':
      return <QuizResultPage
        result={quizResult}
        subUnit={selectedSubUnit}
        mascotId={mascotId}
        userPlan={userPlan}
        onRetry={() => startQuiz(selectedSubUnit)}
        onNext={() => navigate('section')}
        onHome={() => navigate('stageMap')}
      />

    case 'mypage':
      return <DashboardPage
        mascotId={mascotId}
        profile={profile}
        grade={grade}
        userPlan={userPlan}
        onBack={() => navigate('stageMap')}
        onNavigate={navigate}
        onGradeChange={(g) => setGrade(g)}
        onSignOut={handleSignOut}
        onUpdateName={auth.updateDisplayName}
      />

    case 'weeklyReport':
      return <WeeklyReportPage
        mascotId={mascotId}
        onBack={() => navigate('mypage')}
      />

    case 'parentReport':
      return <ParentReportPage
        mascotId={mascotId}
        userPlan={userPlan}
        onBack={() => navigate('mypage')}
        onNavigate={navigate}
      />

    case 'subscription':
      return <SubscriptionPage
        currentPlan={userPlan}
        mascotId={mascotId}
        onBack={() => navigate('mypage')}
        onSelectPlan={(plan) => { setUserPlan(plan); navigate('mypage') }}
      />

    case 'settings':
      return <SettingsPage
        mascotId={mascotId}
        profile={profile}
        userPlan={userPlan}
        onBack={() => navigate('mypage')}
        onNavigate={navigate}
        onSignOut={handleSignOut}
      />

    case 'achievements':
      return <AchievementsPage
        mascotId={mascotId}
        onBack={() => navigate('mypage')}
      />

    default:
      return <LandingPage onNavigate={navigate} />
  }
}
