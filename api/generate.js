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
- 【最重要ルール】graphDataフィールドについて以下を厳守すること:
  1. 図形・グラフ・数直線に関する問題には **必ず** graphDataを付けること。nullにしてはいけない。
  2. graphDataをnullにしてよいのは **純粋な計算問題（方程式を解く、四則演算等）のみ**。
  3. ${count}問中、少なくとも半分以上の問題にgraphDataを付けること。
  4. 描画システムが対応していない複雑な図形（展開図、立体の見取り図、角度の弧、回転体など）が必要な問題は **出題しないこと**。対応している型で出題できる問題のみ作ること。

- 対応している graphData の型（これ以外は使用禁止）:
  - coordinate: 座標平面上の一次関数グラフ（lines配列とpoints配列）
  - numberline: 数直線（min, max, points配列）
  - shape: 基本図形（triangle / rectangle / rhombus / parallelogram / circle）

- graphDataは問題文と完全に一致すること:
  - 問題文にラベル（「あ」「い」「A」「B」等）が出る場合、graphDataのlabelsにも必ず含めること
  - 図が問題を解くのに不可欠な情報（寸法、ラベル、座標）を持つこと

- graphDataの例:
  - 一次関数グラフ: {"type":"coordinate","range":5,"lines":[{"slope":2,"intercept":1,"label":"y=2x+1"}],"points":[{"x":1,"y":3,"label":"A"}]}
  - 数直線: {"type":"numberline","min":-5,"max":5,"points":[{"value":3,"label":"P"}]}
  - 三角形: {"type":"shape","shape":"triangle","labels":["A","B","C"],"sides":["5cm","3cm","4cm"],"angles":["90°",null,null]}
  - 長方形/平行四辺形: {"type":"shape","shape":"rectangle","labels":["A","B","C","D"],"width":"8cm","height":"5cm"}
  - ひし形: {"type":"shape","shape":"rhombus","labels":["A","B","C","D"],"diagonals":["8cm","6cm"]}
  - 平行四辺形: {"type":"shape","shape":"parallelogram","labels":["A","B","C","D"],"width":"8cm","height":"5cm"}
  - 円: {"type":"shape","shape":"circle","radius":"5cm"}
- 【重要】長方形・平行四辺形・ひし形の問題では必ず labels:["A","B","C","D"] を付けて頂点名を表示すること` : ''

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
    "explanation": "解説文"${subject === 'english' ? ',\n    "hint": "ヒント文"' : ''}${subject === 'math' ? ',\n    "graphData": null' : ''}
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
