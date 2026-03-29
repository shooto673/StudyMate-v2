const API_BASE = import.meta.env.PROD
  ? '/api'
  : 'http://localhost:3000/api'

export async function fetchQuizQuestions({ unitTitle, subUnitTitle, subject, grade, count = 5 }) {
  try {
    const res = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitTitle, subUnitTitle, subject, grade, count }),
    })

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`)
    }

    const data = await res.json()
    return data.questions.map((q, i) => ({
      id: i + 1,
      type: '4choice',
      question: q.question,
      choices: q.choices,
      answer: q.correctIndex,
      explanation: q.explanation,
    }))
  } catch (err) {
    console.error('Failed to fetch quiz questions:', err)
    // Return null so caller can show error state
    return null
  }
}
