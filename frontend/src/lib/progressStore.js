// StudyMate v2 - Progress Store (localStorage-based)
const STORAGE_KEY = 'studymate_progress'
const SESSIONS_KEY = 'studymate_sessions'

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {} } catch { return {} }
}
function loadArr(key) {
  try { return JSON.parse(localStorage.getItem(key)) || [] } catch { return [] }
}
function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

// --- Save a quiz result ---
export function saveQuizResult({ subUnitSlug, unitTitle, subUnitTitle, subject, grade, totalQuestions, correctCount, xpGained }) {
  const progress = load(STORAGE_KEY)
  const existing = progress[subUnitSlug] || {
    attempts: 0, bestScore: 0, totalQuestions: 0, totalCorrect: 0, xpTotal: 0,
    unitTitle, subUnitTitle, subject, grade,
  }

  const score = Math.round((correctCount / totalQuestions) * 100)
  existing.attempts += 1
  existing.bestScore = Math.max(existing.bestScore, score)
  existing.totalQuestions += totalQuestions
  existing.totalCorrect += correctCount
  existing.xpTotal += xpGained
  existing.lastAttempt = new Date().toISOString()
  existing.unitTitle = unitTitle
  existing.subUnitTitle = subUnitTitle
  existing.subject = subject
  existing.grade = grade

  progress[subUnitSlug] = existing
  save(STORAGE_KEY, progress)

  // Save session entry
  const sessions = loadArr(SESSIONS_KEY)
  sessions.unshift({
    date: new Date().toISOString(),
    subUnitSlug, unitTitle, subUnitTitle, subject, grade,
    score, correctCount, totalQuestions, xpGained,
  })
  // Keep last 100 sessions
  if (sessions.length > 100) sessions.length = 100
  save(SESSIONS_KEY, sessions)
}

// --- Get progress for a single sub-unit ---
export function getSubUnitProgress(subUnitSlug) {
  const progress = load(STORAGE_KEY)
  return progress[subUnitSlug] || null
}

// --- Get progress percentage for a sub-unit (for progress bars) ---
// 0 = not attempted, bestScore% otherwise, mastered if >= 80%
export function getSubUnitPercent(subUnitSlug) {
  const p = getSubUnitProgress(subUnitSlug)
  if (!p) return 0
  return p.bestScore
}

// --- Check if sub-unit is mastered (80%+) ---
export function isSubUnitMastered(subUnitSlug) {
  return getSubUnitPercent(subUnitSlug) >= 80
}

// --- Get aggregate stats ---
export function getAggregateStats() {
  const progress = load(STORAGE_KEY)
  const entries = Object.values(progress)

  if (entries.length === 0) {
    return {
      totalQuestions: 0, totalCorrect: 0, accuracy: 0,
      totalXp: 0, level: 1, xpToNext: 200,
      subjectsAttempted: 0,
    }
  }

  const totalQuestions = entries.reduce((s, e) => s + e.totalQuestions, 0)
  const totalCorrect = entries.reduce((s, e) => s + e.totalCorrect, 0)
  const totalXp = entries.reduce((s, e) => s + e.xpTotal, 0)
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

  // Level calculation: every 200 XP = 1 level
  const level = Math.floor(totalXp / 200) + 1
  const xpInLevel = totalXp % 200
  const xpToNext = 200

  return { totalQuestions, totalCorrect, accuracy, totalXp, level, xpInLevel, xpToNext }
}

// --- Get subject-specific stats ---
export function getSubjectStats(subjectKey) {
  const progress = load(STORAGE_KEY)
  const entries = Object.values(progress).filter(e => e.subject === subjectKey)

  const totalQuestions = entries.reduce((s, e) => s + e.totalQuestions, 0)
  const totalCorrect = entries.reduce((s, e) => s + e.totalCorrect, 0)
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
  const unitsCleared = entries.filter(e => e.bestScore >= 80).length
  const totalUnits = entries.length

  return { total: totalQuestions, accuracy, unitsCleared, totalUnits }
}

// --- Get recent sessions ---
export function getRecentSessions(limit = 10) {
  const sessions = loadArr(SESSIONS_KEY)
  return sessions.slice(0, limit).map(s => {
    const d = new Date(s.date)
    return {
      ...s,
      dateLabel: `${d.getMonth() + 1}/${d.getDate()}`,
    }
  })
}

// --- Get weekly activity (questions per day, last 7 days) ---
export function getWeeklyActivity() {
  const sessions = loadArr(SESSIONS_KEY)
  const now = new Date()
  const days = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dayStr = d.toISOString().slice(0, 10)
    const daySessions = sessions.filter(s => s.date.slice(0, 10) === dayStr)
    const count = daySessions.reduce((s, ses) => s + ses.totalQuestions, 0)
    const correct = daySessions.reduce((s, ses) => s + ses.correctCount, 0)
    const accuracy = count > 0 ? Math.round((correct / count) * 100) : 0
    const dayNames = ['日', '月', '火', '水', '木', '金', '土']
    days.push({ day: dayNames[d.getDay()], count, accuracy, date: dayStr })
  }

  return days
}

// --- Get streak (consecutive days with activity) ---
export function getStreak() {
  const sessions = loadArr(SESSIONS_KEY)
  if (sessions.length === 0) return { current: 0, best: 0 }

  // Get unique dates with activity
  const dates = [...new Set(sessions.map(s => s.date.slice(0, 10)))].sort().reverse()

  let current = 0
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  // Check if today or yesterday has activity
  if (dates[0] !== today && dates[0] !== yesterday) return { current: 0, best: dates.length > 0 ? 1 : 0 }

  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(dates[0])
    expected.setDate(expected.getDate() - i)
    if (dates[i] === expected.toISOString().slice(0, 10)) {
      current++
    } else {
      break
    }
  }

  return { current, best: Math.max(current, dates.length > 0 ? 1 : 0) }
}

// --- Get weekly report data ---
export function getWeeklyReportData() {
  const sessions = loadArr(SESSIONS_KEY)
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - 6)

  const thisWeek = sessions.filter(s => new Date(s.date) >= weekStart)
  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setDate(prevWeekStart.getDate() - 7)
  const prevWeek = sessions.filter(s => {
    const d = new Date(s.date)
    return d >= prevWeekStart && d < weekStart
  })

  const totalQuestions = thisWeek.reduce((s, e) => s + e.totalQuestions, 0)
  const totalCorrect = thisWeek.reduce((s, e) => s + e.correctCount, 0)
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
  const xpEarned = thisWeek.reduce((s, e) => s + e.xpGained, 0)

  const prevTotal = prevWeek.reduce((s, e) => s + e.totalQuestions, 0)
  const prevCorrect = prevWeek.reduce((s, e) => s + e.correctCount, 0)
  const prevAccuracy = prevTotal > 0 ? Math.round((prevCorrect / prevTotal) * 100) : 0

  // Subject breakdown
  const englishSessions = thisWeek.filter(s => s.subject === 'english')
  const mathSessions = thisWeek.filter(s => s.subject === 'math')

  const engQuestions = englishSessions.reduce((s, e) => s + e.totalQuestions, 0)
  const engCorrect = englishSessions.reduce((s, e) => s + e.correctCount, 0)
  const mathQuestions = mathSessions.reduce((s, e) => s + e.totalQuestions, 0)
  const mathCorrect = mathSessions.reduce((s, e) => s + e.correctCount, 0)

  // Find weak sub-units (accuracy < 70%)
  const subUnitMap = {}
  thisWeek.forEach(s => {
    if (!subUnitMap[s.subUnitSlug]) {
      subUnitMap[s.subUnitSlug] = { unit: s.unitTitle, subject: s.subject === 'english' ? '英語' : '数学', total: 0, correct: 0 }
    }
    subUnitMap[s.subUnitSlug].total += s.totalQuestions
    subUnitMap[s.subUnitSlug].correct += s.correctCount
  })
  const weakPoints = Object.values(subUnitMap)
    .map(w => ({ ...w, accuracy: w.total > 0 ? Math.round((w.correct / w.total) * 100) : 0 }))
    .filter(w => w.accuracy < 70)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3)

  const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()} 〜 ${now.getMonth() + 1}/${now.getDate()}`

  return {
    weekLabel,
    totalQuestions, prevWeekQuestions: prevTotal,
    accuracy, prevAccuracy,
    xpEarned,
    dailyData: getWeeklyActivity(),
    subjectBreakdown: {
      english: { questions: engQuestions, accuracy: engQuestions > 0 ? Math.round((engCorrect / engQuestions) * 100) : 0 },
      math: { questions: mathQuestions, accuracy: mathQuestions > 0 ? Math.round((mathCorrect / mathQuestions) * 100) : 0 },
    },
    weakPoints,
  }
}

// --- Get all progress entries (for parent report) ---
export function getAllProgress() {
  return load(STORAGE_KEY)
}
