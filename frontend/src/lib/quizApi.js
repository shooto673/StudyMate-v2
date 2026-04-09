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
  const SUPPORTED_SHAPES = ['triangle', 'rectangle', 'rhombus', 'parallelogram', 'circle']
  if (graphData.type === 'shape') {
    if (!SUPPORTED_SHAPES.includes(graphData.shape)) return null
    // If secondShape exists, it must also be a supported shape
    if (graphData.secondShape && !SUPPORTED_SHAPES.includes(graphData.secondShape.shape)) {
      // Drop the invalid secondShape but keep the primary shape
      delete graphData.secondShape
    }
  }

  // Check if question mentions labels that graph should contain
  const mentionedLabels = []
  let match

  // Pattern 1: Labels in quotes like 「A」「い」
  const quotePattern = /[「『]([あ-おア-オA-Z])[」』]/g
  while ((match = quotePattern.exec(question)) !== null) {
    mentionedLabels.push(match[1])
  }

  // Pattern 2: "三角形ABC" or "△ABC" style labels
  const shapeNamePattern = /(?:三角形|△)([A-Z]{2,4})/g
  while ((match = shapeNamePattern.exec(question)) !== null) {
    for (const ch of match[1]) mentionedLabels.push(ch)
  }

  // Pattern 3: "点A" "点P" style
  const pointPattern = /点([A-Z])/g
  while ((match = pointPattern.exec(question)) !== null) {
    mentionedLabels.push(match[1])
  }

  if (mentionedLabels.length > 0 && graphData.type === 'shape') {
    const graphLabels = graphData.labels || []
    const secondLabels = (graphData.secondShape && graphData.secondShape.labels) || []
    const allLabels = [...graphLabels, ...secondLabels]
    // Only reject if MORE than half the mentioned labels are missing.
    // This prevents false negatives when GPT-4o-mini extracts slightly differently
    // while still catching obviously wrong graphs.
    const missingCount = mentionedLabels.filter(l => !allLabels.includes(l)).length
    if (missingCount > mentionedLabels.length / 2) return null
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
    return data.questions.map((q, i) => {
      const validatedGraph = validateGraphData(q.question, q.graphData)
      // Debug warning: question seems to need a graph but has none
      if (!validatedGraph && /グラフ|図形|三角形|四角形|長方形|円|直線|数直線|座標/.test(q.question)) {
        console.warn(`[QuizAPI] Question ${i + 1} may need graphData but has none:`, q.question)
      }
      return {
        id: i + 1,
        type: '4choice',
        question: q.question,
        choices: q.choices,
        answer: q.correctIndex,
        explanation: q.explanation,
        hint: q.hint || null,
        graphData: validatedGraph,
      }
    })
  } catch (err) {
    console.error('Failed to fetch quiz questions:', err)
    // Return null so caller can show error state
    return null
  }
}
