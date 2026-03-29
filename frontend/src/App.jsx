import { useState, useMemo, useCallback } from 'react'
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

export default function App() {
  const [page, setPage] = useState('landing')
  const [mascotId, setMascotId] = useState('taylor')
  const [grade, setGrade] = useState('j1')
  const [subject, setSubject] = useState('english')
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [selectedSubUnit, setSelectedSubUnit] = useState(null)
  const [quizQuestions, setQuizQuestions] = useState([])
  const [quizResult, setQuizResult] = useState(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizError, setQuizError] = useState(null)
  const [profile] = useState({ displayName: '冒険者', grade: 'j1' })
  const [userPlan, setUserPlan] = useState('free')

  const filteredUnits = useMemo(() =>
    UNITS.filter(u => u.grade === grade && u.subject === subject),
    [grade, subject]
  )

  const navigate = (p) => setPage(p)

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
      // Fallback to mock data if API fails
      setQuizQuestions(generateMockQuiz(subUnit))
      setQuizError('AI問題生成に失敗しました。モック問題を表示しています。')
    }
    setQuizLoading(false)
  }, [selectedUnit, subject, grade])

  switch (page) {
    case 'landing':
      return <LandingPage onNavigate={navigate} />

    case 'login':
      return <LoginPage
        onNavigate={navigate}
        onEmailLogin={async () => navigate('characterSelect')}
        onEmailSignUp={async () => navigate('characterSelect')}
      />

    case 'characterSelect':
      return <CharacterSelectPage onSelect={(id) => { setMascotId(id); navigate('gradeSelect') }} />

    case 'gradeSelect':
      return <GradeSelectPage
        onSelect={(g) => { setGrade(g); navigate('stageMap') }}
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
        onComplete={(result) => { setQuizResult(result); navigate('quizResult') }}
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
        userPlan={userPlan}
        onBack={() => navigate('stageMap')}
        onNavigate={navigate}
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
