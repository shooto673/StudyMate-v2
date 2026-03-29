const API_BASE = import.meta.env.PROD
  ? '/api'
  : 'http://localhost:3000/api'

// Validate that graphData actually matches the question content
function validateGraphData(question, graphData) {
  if (!graphData || !graphData.type) return null

  const SUPPORTED_TYPES = ['coordinate', 'numberline', 'shape']
  if (!SUPPORTED_TYPES.includes(graphData.type)) return null

  // For coordinate graphs, must have at least one line or point
  if (graphData.type === 'coordinate') {
    if ((!graphData.lines || graphData.lines.length === 0) && (!graphData.points || graphData.points.length === 0)) return null
    // Validate lines have numeric slope
    if (graphData.lines) {
      for (const line of graphData.lines) {
        if (typeof line.slope !== 'number') return null
      }
    }
  }

  // For shapes, must have valid shape type
  if (graphData.type === 'shape') {
    const SUPPORTED_SHAPES = ['triangle', 'rectangle', 'circle']
    if (!SUPPORTED_SHAPES.includes(graphData.shape)) return null
  }

  // Check if question mentions labels that graph should contain
  // If question references specific labels (あ, い, A, B, etc.) but graph doesn't have them, discard
  const labelPattern = /[「『]([あ-おア-オA-Z])[」』]/g
  const mentionedLabels = []
  let match
  while ((match = labelPattern.exec(question)) !== null) {
    mentionedLabels.push(match[1])
  }

  if (mentionedLabels.length > 0 && graphData.type === 'shape') {
    const graphLabels = graphData.labels || []
    const hasMissing = mentionedLabels.some(l => !graphLabels.includes(l))
    if (hasMissing) return null // Graph missing labels mentioned in question
  }

  return graphData
}

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
      graphData: validateGraphData(q.question, q.graphData),
    }))
  } catch (err) {
    console.error('Failed to fetch quiz questions:', err)
    // Return null so caller can show error state
    return null
  }
}
