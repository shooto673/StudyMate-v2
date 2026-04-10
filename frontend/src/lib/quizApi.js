import { validateGraphData, questionLooksVisual } from './graphValidator'

const API_BASE = import.meta.env.PROD
  ? '/api'
  : 'http://localhost:3000/api'

const IS_DEV = import.meta.env.DEV

export async function fetchQuizQuestions({ unitTitle, subUnitTitle, subject, grade, count = 5 }) {
  try {
    const res = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitTitle, subUnitTitle, subject, grade, count }),
    })

    if (!res.ok) {
      const bodyText = await res.text().catch(() => '')
      console.error('[QuizAPI] fetch failed', res.status, bodyText)
      throw new Error(`API error: ${res.status}`)
    }

    const data = await res.json()

    // Server-side meta (extraction stats) — log in dev to catch silent failures
    if (data._meta) {
      if (IS_DEV) console.info('[QuizAPI] server meta:', data._meta)
      if (data._meta.stage2 === 'skipped_no_key') {
        console.warn('[QuizAPI] OPENAI_API_KEY is not configured on the server — math figures will be missing.')
      }
      if (data._meta.stage2 === 'failed') {
        console.error('[QuizAPI] Graph extraction failed on the server:', data._meta.stage2Error)
      }
    }

    const questions = (data.questions || []).map((q, i) => {
      let graphData = null
      let rejectionReason = null

      if (q.graphData) {
        const result = validateGraphData(q.question, q.graphData)
        if (result && result.rejected) {
          rejectionReason = result.reason
          console.warn(`[QuizAPI] Q${i + 1} graphData rejected:`, rejectionReason, '\n  question:', q.question, '\n  raw:', q.graphData)
        } else {
          graphData = result
        }
      }

      // Surface questions that look visual but have no graphData
      if (!graphData && subject === 'math' && questionLooksVisual(q.question)) {
        console.warn(`[QuizAPI] Q${i + 1} looks visual but has no graphData:`, q.question, 'rejection:', rejectionReason)
      }

      return {
        id: i + 1,
        type: '4choice',
        question: q.question,
        choices: q.choices,
        answer: q.correctIndex,
        explanation: q.explanation,
        hint: q.hint || null,
        graphData,
        // Dev-only diagnostic so UI can show a badge when we dropped data
        _graphRejection: rejectionReason,
      }
    })

    return questions
  } catch (err) {
    console.error('[QuizAPI] Failed to fetch quiz questions:', err)
    return null
  }
}
