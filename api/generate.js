export const config = {
  maxDuration: 60,
}

// Auto-generate graphData by parsing question text (server-side, 100% reliable)
function autoGenerateGraphData(question) {
  // --- Triangle: 三角形ABC, △ABC ---
  const triMatch = question.match(/(?:三角形|△)\s*([A-Z])([A-Z])([A-Z])/)
  if (triMatch) {
    const labels = [triMatch[1], triMatch[2], triMatch[3]]
    const sides = []
    const angles = []
    // Extract side lengths: AB=5cm, BC = 3cm, etc.
    for (let i = 0; i < 3; i++) {
      const a = labels[i], b = labels[(i + 1) % 3]
      const sideRe = new RegExp(`(?:${a}${b}|${b}${a})\\s*[=＝]\\s*([\\d.]+)\\s*(cm|m)?`, 'i')
      const m = question.match(sideRe)
      sides.push(m ? `${m[1]}${m[2] || 'cm'}` : null)
    }
    // Extract angles: ∠A=90°, 角A = 60°
    for (const lbl of labels) {
      const angRe = new RegExp(`[∠角]\\s*${lbl}\\s*[=＝]\\s*([\\d.]+)[°度]`)
      const m = question.match(angRe)
      angles.push(m ? `${m[1]}°` : null)
    }
    // Check for "直角" (right angle)
    const rightMatch = question.match(/[∠角]\s*([A-Z])\s*.*?直角/)
    if (rightMatch && labels.includes(rightMatch[1])) {
      const idx = labels.indexOf(rightMatch[1])
      angles[idx] = '90°'
    }
    return { type: 'shape', shape: 'triangle', labels, sides: sides.some(Boolean) ? sides : undefined, angles: angles.some(Boolean) ? angles : undefined }
  }

  // --- Rhombus: ひし形ABCD ---
  const rhombusMatch = question.match(/ひし形\s*([A-Z])([A-Z])([A-Z])([A-Z])/)
  if (rhombusMatch) {
    const labels = [rhombusMatch[1], rhombusMatch[2], rhombusMatch[3], rhombusMatch[4]]
    const diagonals = []
    // Extract diagonals: 対角線の長さがそれぞれ8cm、6cm or 対角線AC=8cm
    const diagPairMatch = question.match(/対角線.*?(\d+)\s*(cm|m).*?(\d+)\s*(cm|m)/)
    if (diagPairMatch) {
      diagonals.push(`${diagPairMatch[1]}${diagPairMatch[2]}`, `${diagPairMatch[3]}${diagPairMatch[4]}`)
    }
    return { type: 'shape', shape: 'rhombus', labels, diagonals: diagonals.length === 2 ? diagonals : undefined }
  }

  // --- Parallelogram: 平行四辺形ABCD ---
  const paraMatch = question.match(/平行四辺形\s*([A-Z])([A-Z])([A-Z])([A-Z])/)
  if (paraMatch) {
    const labels = [paraMatch[1], paraMatch[2], paraMatch[3], paraMatch[4]]
    // Extract width/height from side mentions
    let width, height
    for (let i = 0; i < 4; i++) {
      const a = labels[i], b = labels[(i + 1) % 4]
      const sideRe = new RegExp(`(?:辺)?${a}${b}|${b}${a}.*?(\[\\d.]+)\\s*(cm|m)`, 'i')
      const m = question.match(new RegExp(`(?:辺)?(?:${a}${b}|${b}${a})\\s*[=＝の長さがは]\\s*(\\d+\\.?\\d*)\\s*(cm|m)?`))
      if (m) {
        if (i % 2 === 0) width = `${m[1]}${m[2] || 'cm'}`
        else height = `${m[1]}${m[2] || 'cm'}`
      }
    }
    return { type: 'shape', shape: 'parallelogram', labels, width, height }
  }

  // --- Rectangle: 長方形, 四角形ABCD (when context suggests rectangle) ---
  const rectMatch = question.match(/(?:長方形|正方形)\s*([A-Z])([A-Z])([A-Z])([A-Z])/)
  if (rectMatch) {
    const labels = [rectMatch[1], rectMatch[2], rectMatch[3], rectMatch[4]]
    let width, height
    for (let i = 0; i < 4; i++) {
      const a = labels[i], b = labels[(i + 1) % 4]
      const m = question.match(new RegExp(`(?:辺)?(?:${a}${b}|${b}${a})\\s*[=＝の長さがは]\\s*(\\d+\\.?\\d*)\\s*(cm|m)?`))
      if (m) {
        if (i % 2 === 0) width = `${m[1]}${m[2] || 'cm'}`
        else height = `${m[1]}${m[2] || 'cm'}`
      }
    }
    // Fallback: 縦○cm、横○cm
    if (!width) { const m = question.match(/[横幅]\s*[=＝がは]\s*(\d+\.?\d*)\s*(cm|m)/); if (m) width = `${m[1]}${m[2]}` }
    if (!height) { const m = question.match(/[縦高さ]\s*[=＝がは]\s*(\d+\.?\d*)\s*(cm|m)/); if (m) height = `${m[1]}${m[2]}` }
    return { type: 'shape', shape: 'rectangle', labels, width, height }
  }

  // --- Rectangle without labels: 縦3cm、横5cmの長方形 ---
  if (/長方形|正方形/.test(question)) {
    let width, height
    const wm = question.match(/横\s*(\d+\.?\d*)\s*(cm|m)/)
    const hm = question.match(/縦\s*(\d+\.?\d*)\s*(cm|m)/)
    if (wm) width = `${wm[1]}${wm[2]}`
    if (hm) height = `${hm[1]}${hm[2]}`
    if (width || height) return { type: 'shape', shape: 'rectangle', width, height }
  }

  // --- Circle: 円, 半径○cm ---
  if (/円/.test(question)) {
    const rMatch = question.match(/半径\s*[=＝がは]?\s*(\d+\.?\d*)\s*(cm|m)/)
    const dMatch = question.match(/直径\s*[=＝がは]?\s*(\d+\.?\d*)\s*(cm|m)/)
    if (rMatch) return { type: 'shape', shape: 'circle', radius: `${rMatch[1]}${rMatch[2]}` }
    if (dMatch) return { type: 'shape', shape: 'circle', radius: `${parseFloat(dMatch[1]) / 2}${dMatch[2]}` }
  }

  // --- Linear function graph: y = ax + b ---
  const lineMatches = [...question.matchAll(/y\s*[=＝]\s*(-?\d*\.?\d*)x\s*([+\-＋−]\s*\d+\.?\d*)?/g)]
  if (lineMatches.length > 0) {
    const lines = lineMatches.map(m => {
      const slope = m[1] === '' || m[1] === '-' ? (m[1] === '-' ? -1 : 1) : parseFloat(m[1])
      const intercept = m[2] ? parseFloat(m[2].replace(/[＋]/g, '+').replace(/[−]/g, '-').replace(/\s/g, '')) : 0
      return { slope, intercept, label: m[0].trim() }
    })
    // Extract labeled points: 点A(2, 3)
    const points = []
    const ptMatches = [...question.matchAll(/点([A-Z])\s*[（(]\s*(-?\d+\.?\d*)\s*[,、]\s*(-?\d+\.?\d*)\s*[）)]/g)]
    for (const pm of ptMatches) {
      points.push({ x: parseFloat(pm[2]), y: parseFloat(pm[3]), label: pm[1] })
    }
    const maxVal = Math.max(5, ...lines.map(l => Math.abs(l.intercept) + Math.abs(l.slope) * 3))
    return { type: 'coordinate', range: Math.min(Math.ceil(maxVal), 10), lines, points: points.length > 0 ? points : undefined }
  }

  // --- Number line: 数直線 ---
  if (/数直線/.test(question)) {
    const nums = [...question.matchAll(/-?\d+\.?\d*/g)].map(m => parseFloat(m[0])).filter(n => !isNaN(n))
    if (nums.length > 0) {
      const min = Math.min(...nums, -5)
      const max = Math.max(...nums, 5)
      const points = []
      // Extract labeled points on number line: 点P が 3
      const nlPts = [...question.matchAll(/点([A-ZP-Z])\s*[=＝がはを]\s*(-?\d+\.?\d*)/g)]
      for (const m of nlPts) {
        points.push({ value: parseFloat(m[2]), label: m[1] })
      }
      return { type: 'numberline', min: Math.floor(min) - 1, max: Math.ceil(max) + 1, points: points.length > 0 ? points : undefined }
    }
  }

  return null // Pure calculation, no graph needed
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { unitTitle, subUnitTitle, subject, grade, count = 5 } = req.body

  if (!unitTitle || !subUnitTitle || !subject) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const gradeLabel = { j1: '中学1年', j2: '中学2年', j3: '中学3年' }[grade] || '中学1年'
  const subjectLabel = subject === 'english' ? '英語' : '数学'

  const mathGraphInstruction = subject === 'math' ? `
- 図形やグラフの問題では、問題文に具体的な数値（辺の長さ、半径、座標、傾き、切片など）を必ず明記すること。
- 図形問題では頂点名（A, B, C, D等）を問題文に含めること。
- 問題文だけで解ける形にすること（図は自動生成されます）。
- 描画できる図形: 三角形、長方形、平行四辺形、ひし形、円、一次関数グラフ、数直線
- 描画できない図形（展開図、立体、回転体等）の問題は出題しないこと。` : ''

  const isSummaryTest = subUnitTitle === 'まとめテスト'
  const summaryInstruction = isSummaryTest ? `
- これは「まとめテスト」です。この単元「${unitTitle}」の全範囲から均等に出題してください。
- 各サブ単元から1-2問ずつ出し、基本問題だけでなく応用・総合問題も含めること。
- 単元全体の理解度を測れるよう、難易度は基本〜やや応用まで幅広く。` : ''

  const hintInstruction = subject === 'english' ? `
- 各問題に "hint" フィールド（日本語1文）を必ず追加すること。ヒントは「この単語は『〜する』という意味だよ」「主語が三人称単数のときの動詞に注目！」のように、答えを直接言わず考え方のヒントを与える内容にすること。` : ''

  const prompt = `あなたは${gradeLabel}の${subjectLabel}の先生です。
以下の単元について、4択クイズを${count}問作成してください。

【単元】${unitTitle}${isSummaryTest ? '（まとめテスト）' : ` > ${subUnitTitle}`}
【対象】${gradeLabel}
【科目】${subjectLabel}
${summaryInstruction}
ルール:
- 各問題は question（問題文）、choices（4つの選択肢配列）、correctIndex（正解のインデックス0-3）、explanation（解説）を含む
- correctIndexは0-3でランダムに分散させること（毎回同じ位置にしない）
- 問題は基本〜標準レベル
- 問題文は簡潔に（中学生が理解できる日本語）
- 【重要】対象学年の範囲を厳守すること。上の学年で習う内容は絶対に使わない。例: 中学1年・2年の問題に√（平方根）や三平方の定理を出さない。中学1年の問題に連立方程式や一次関数を出さない。
- ${subject === 'english' ? '英語の問題は日本語で出題し、選択肢に英語を含める。文法や語彙を問う形式で。英語の問題は出題形式を多様にすること：穴埋め問題、並べ替え問題、和訳問題、英訳問題、文法選択問題などを混ぜる。短縮形（I\'m / don\'t）と非短縮形（I am / do not）がどちらも文法的に正しい場合は、解説でその旨を必ず言及すること。' : '数学の問題は計算問題や文章題を混ぜて出す。選択肢は数値や式で。数学の問題も出題形式を多様にすること：計算問題、文章題、図形問題、応用問題を混ぜる。'}
- 解説は2-3文で、以下の構成にすること：①正解の理由 ②よくある間違いの指摘 ③関連するポイント（英語なら許容表現、数学なら公式など）${hintInstruction}${mathGraphInstruction}

以下のJSON形式で返してください（JSON以外は一切出力しないでください）:
[
  {
    "question": "問題文",
    "choices": ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
    "correctIndex": 0,
    "explanation": "解説文"${subject === 'english' ? ',\n    "hint": "ヒント文"' : ''}
  }
]`

  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim().replace(/[^\x20-\x7E]/g, '')

  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API error:', err)
      return res.status(500).json({ error: 'AI API error', details: err })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('Failed to parse AI response:', text)
      return res.status(500).json({ error: 'Failed to parse AI response' })
    }

    const questions = JSON.parse(jsonMatch[0])

    // Auto-generate graphData for math questions that need it
    if (subject === 'math') {
      for (const q of questions) {
        const aiGraph = q.graphData
        const autoGraph = autoGenerateGraphData(q.question)
        // Use AI's graphData if valid, otherwise use auto-generated
        q.graphData = aiGraph || autoGraph
      }
    }

    return res.status(200).json({ questions })
  } catch (err) {
    console.error('Generate error:', err)
    return res.status(500).json({ error: 'Internal server error', message: err.message })
  }
}
