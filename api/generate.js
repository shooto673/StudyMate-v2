export const config = {
  maxDuration: 60,
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
- グラフや図形が必要な問題には graphData フィールドを追加してください。
- 【重要】graphDataは問題文の内容と完全に一致する図のみ追加すること。以下のルールを厳守:
  - 問題文にラベル（「あ」「い」「A」「B」等）が出る場合、graphDataにも必ずそのラベルを含めること
  - 図が問題を解くのに不可欠な情報を持つこと（寸法、ラベル、座標など）
  - 描画システムが対応していない複雑な図形（展開図、立体図、角度の図など）にはgraphDataを付けないこと（nullにする）
  - 対応している図形タイプ: 座標平面上の一次関数グラフ、数直線、三角形（頂点ラベル・辺の長さ付き）、長方形（幅・高さ付き）、円（半径付き）
- graphDataの例:
  - 一次関数グラフ: {"type":"coordinate","range":5,"lines":[{"slope":2,"intercept":1,"label":"y=2x+1"}],"points":[{"x":1,"y":3,"label":"A"}]}
  - 数直線: {"type":"numberline","min":-5,"max":5,"points":[{"value":3,"label":"P"}]}
  - 三角形: {"type":"shape","shape":"triangle","labels":["A","B","C"],"sides":["5cm","3cm","4cm"]}
  - 長方形: {"type":"shape","shape":"rectangle","width":"6cm","height":"4cm"}
  - 円: {"type":"shape","shape":"circle","radius":"5cm"}
- 描画できない図形が必要な問題では、graphDataをnullにし、問題文だけで解けるように問題を作ること` : ''

  const prompt = `あなたは${gradeLabel}の${subjectLabel}の先生です。
以下の単元について、4択クイズを${count}問作成してください。

【単元】${unitTitle} > ${subUnitTitle}
【対象】${gradeLabel}
【科目】${subjectLabel}

ルール:
- 各問題は question（問題文）、choices（4つの選択肢配列）、correctIndex（正解のインデックス0-3）、explanation（解説）を含む
- correctIndexは0-3でランダムに分散させること（毎回同じ位置にしない）
- 問題は基本〜標準レベル
- 問題文は簡潔に（中学生が理解できる日本語）
- ${subject === 'english' ? '英語の問題は日本語で出題し、選択肢に英語を含める。文法や語彙を問う形式で。英語の問題は出題形式を多様にすること：穴埋め問題、並べ替え問題、和訳問題、英訳問題、文法選択問題などを混ぜる。短縮形（I\'m / don\'t）と非短縮形（I am / do not）がどちらも文法的に正しい場合は、解説でその旨を必ず言及すること。' : '数学の問題は計算問題や文章題を混ぜて出す。選択肢は数値や式で。図が描画できない問題は問題文だけで解ける形にすること。数学の問題も出題形式を多様にすること：計算問題、文章題、図形問題、応用問題を混ぜる。'}
- 解説は2-3文で、以下の構成にすること：①正解の理由 ②よくある間違いの指摘 ③関連するポイント（英語なら許容表現、数学なら公式など）${mathGraphInstruction}

以下のJSON形式で返してください（JSON以外は一切出力しないでください）:
[
  {
    "question": "問題文",
    "choices": ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
    "correctIndex": 0,
    "explanation": "解説文"${subject === 'math' ? ',\n    "graphData": null' : ''}
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
    return res.status(200).json({ questions })
  } catch (err) {
    console.error('Generate error:', err)
    return res.status(500).json({ error: 'Internal server error', message: err.message })
  }
}
