export const config = {
  maxDuration: 60,
}

// JSON Schema for GPT-4o-mini Structured Outputs
const GRAPH_DATA_SCHEMA = {
  name: 'graph_data_extraction',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            questionIndex: { type: 'number', description: 'The 0-based index of the question' },
            needsGraph: { type: 'boolean', description: 'Whether this question needs a visual figure/graph' },
            graphData: {
              type: ['object', 'null'],
              description: 'Structured graph data, or null if no graph needed',
              properties: {
                type: { type: 'string', enum: ['shape', 'coordinate', 'numberline'] },
                // Shape properties
                shape: { type: ['string', 'null'], enum: ['triangle', 'rectangle', 'parallelogram', 'rhombus', 'circle', null] },
                labels: { type: ['array', 'null'], items: { type: 'string' }, description: 'Vertex labels like ["A","B","C"] or ["A","B","C","D"]' },
                sides: { type: ['array', 'null'], items: { type: ['string', 'null'] }, description: 'Side lengths like ["5cm","7cm","9cm"]. Use null for unknown/asked sides. Order: AB,BC,CA for triangles; AB,BC,CD,DA for quads' },
                angles: { type: ['array', 'null'], items: { type: ['string', 'null'] }, description: 'Angle values like ["90°",null,null]. Use null for unknown/asked angles' },
                diagonals: { type: ['array', 'null'], items: { type: 'string' }, description: 'Diagonal lengths for rhombus like ["8cm","6cm"]' },
                width: { type: ['string', 'null'], description: 'Width for unlabeled rectangles' },
                height: { type: ['string', 'null'], description: 'Height for unlabeled rectangles' },
                radius: { type: ['string', 'null'], description: 'Radius for circles' },
                // Second shape for congruence/similarity pairs (三角形ABC ≅ 三角形DEF)
                secondShape: {
                  type: ['object', 'null'],
                  description: 'Second triangle/shape for congruence or similarity problems',
                  properties: {
                    shape: { type: ['string', 'null'], enum: ['triangle', 'rectangle', 'parallelogram', 'rhombus', 'circle', null] },
                    labels: { type: ['array', 'null'], items: { type: 'string' } },
                    sides: { type: ['array', 'null'], items: { type: ['string', 'null'] } },
                    angles: { type: ['array', 'null'], items: { type: ['string', 'null'] } },
                  },
                  required: ['shape', 'labels', 'sides', 'angles'],
                  additionalProperties: false,
                },
                // Coordinate properties
                range: { type: ['number', 'null'], description: 'Axis range, default 5' },
                lines: { type: ['array', 'null'], items: { type: 'object', properties: { slope: { type: 'number' }, intercept: { type: 'number' }, label: { type: 'string' } }, required: ['slope', 'intercept', 'label'], additionalProperties: false } },
                points: { type: ['array', 'null'], items: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, label: { type: 'string' } }, required: ['x', 'y', 'label'], additionalProperties: false } },
                // Numberline properties
                min: { type: ['number', 'null'] },
                max: { type: ['number', 'null'] },
                nlPoints: { type: ['array', 'null'], items: { type: 'object', properties: { value: { type: 'number' }, label: { type: 'string' } }, required: ['value', 'label'], additionalProperties: false } },
              },
              required: [
                'type', 'shape', 'labels', 'sides', 'angles', 'diagonals',
                'width', 'height', 'radius', 'secondShape',
                'range', 'lines', 'points',
                'min', 'max', 'nlPoints',
              ],
              additionalProperties: false,
            },
          },
          required: ['questionIndex', 'needsGraph', 'graphData'],
          additionalProperties: false,
        },
      },
    },
    required: ['questions'],
    additionalProperties: false,
  },
}

// Stage 2: Extract structured graphData from questions using GPT-4o-mini
async function extractGraphData(questions, openaiKey) {
  const questionsText = questions.map((q, i) =>
    `[${i}] ${q.question}`
  ).join('\n')

  const extractionPrompt = `以下の数学の問題文から、図形・グラフ・数直線の描画に必要な構造化データを抽出してください。

【最重要】図形・グラフが登場する全ての問題で needsGraph=true にすること。生徒にとって可視化は理解の鍵です。
- 三角形（直角三角形、二等辺三角形、正三角形、合同・相似な三角形など）→ needsGraph=true
- 四角形（長方形、正方形、平行四辺形、ひし形、台形）→ needsGraph=true
- 円・おうぎ形 → needsGraph=true
- 座標・一次関数グラフ → needsGraph=true
- 数直線 → needsGraph=true
- 角度だけ与えられている三角形でも needsGraph=true（sidesをnullにしてもOK）
- 純粋な計算問題（方程式を解く等）のみ needsGraph=false, graphData=null

ルール:
- 【重要】問題で「求めなさい」「何cm？」「いくつ？」「何度？」と聞かれている辺・角度・半径は、sides/angles/radiusに null を入れること（答えを見せてしまうため）
- 三角形のsides順序: [AB, BC, CA]（頂点ラベルの隣接辺順）
- 三角形のangles順序: [∠A, ∠B, ∠C]（各頂点の内角、順序厳守）
- 四角形のsides順序: [AB, BC, CD, DA]
- 座標グラフのrangeは5を基本とする（切片が大きい場合のみ増やす、最大8）
- 「AB = AC = 8cm」のような共有値も正しく各辺に展開すること
- 「二等辺三角形ABC、AB = AC = 8cm」→ sides: ["8cm", null, "8cm"] (ABが8cm、BCは不明or問われている、CAが8cm)

【直角三角形（必ず可視化）】
- 「直角三角形ABC、∠C=90°、∠A=35°」→ labels:["A","B","C"], angles:["35°",null,"90°"], sides:null でOK
- 直角三角形は sidesがなくても necessarily needsGraph=true にすること

【合同・相似な三角形のペア（必ず可視化）】
- 「三角形ABC ≅ 三角形DEF」「三角形ABC と 三角形DEF は合同」のような問題は secondShape に2つ目の三角形を設定すること
- 例: 「三角形ABCと三角形DEFは合同。AB=4cm、BC=5cm、CA=6cm。三角形DEFの辺の長さで正しいのは？」
  → shape:"triangle", labels:["A","B","C"], sides:["4cm","5cm","6cm"],
     secondShape:{shape:"triangle", labels:["D","E","F"], sides:[null,null,null], angles:null}
- 2つ目の三角形は答えに関わるため、sidesは全て null にすること
- 問題文に出てくる全ての頂点ラベルが labels または secondShape.labels に含まれるようにすること

問題文:
${questionsText}`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: extractionPrompt }],
        response_format: {
          type: 'json_schema',
          json_schema: GRAPH_DATA_SCHEMA,
        },
        temperature: 0,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[Stage2] OpenAI API error:', response.status, err)
      return null
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      console.error('[Stage2] Empty content from OpenAI')
      return null
    }

    const parsed = JSON.parse(content)
    console.log('[Stage2] Extraction success:', parsed.questions?.length || 0, 'questions',
      'needsGraph count:', parsed.questions?.filter(q => q.needsGraph).length || 0)
    return parsed.questions || null
  } catch (err) {
    console.error('[Stage2] GraphData extraction error:', err.message)
    return null
  }
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
- 図形問題では頂点名（A, B, C, D等）を問題文に含めること。例: 「三角形ABCで、AB = 5cm、BC = 7cm…」
- 辺の長さを記述する際は「AB = 5cm」の形式を使うこと（図は自動生成されます）。
- 描画できる図形: 三角形、長方形、平行四辺形、ひし形、円、一次関数グラフ(y = ax + b)、数直線
- 描画できない図形（展開図、立体、回転体、おうぎ形等）の問題は出題しないこと。
- 【出題バランス】${count}問中、必ず以下を含めること：
  ・図形問題（三角形/四角形/円のいずれか）を2問以上
  ・座標グラフ(y = ax + b形式)または数直線の問題を1問以上
  ・純粋な計算問題を1-2問` : ''

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

  const anthropicKey = (process.env.ANTHROPIC_API_KEY || '').trim().replace(/[^\x20-\x7E]/g, '')
  const openaiKey = (process.env.OPENAI_API_KEY || '').trim()

  if (!anthropicKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' })
  }

  try {
    // === Stage 1: Claude Haiku generates questions ===
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
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

    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('Failed to parse AI response:', text)
      return res.status(500).json({ error: 'Failed to parse AI response' })
    }

    const questions = JSON.parse(jsonMatch[0])

    // === Stage 2: GPT-4o-mini extracts graphData (math only) ===
    const meta = {
      stage1: 'claude-haiku',
      stage2: subject === 'math' ? (openaiKey ? 'pending' : 'skipped_no_key') : 'not_applicable',
      stage2Error: null,
      extractionApplied: 0,
      extractionTotal: questions.length,
    }

    if (subject === 'math') {
      console.log('[Stage2]', JSON.stringify({
        unitTitle, subUnitTitle, grade, count: questions.length,
        openaiKey: !!openaiKey,
      }))

      if (!openaiKey) {
        console.warn('[Stage2] OPENAI_API_KEY not set — skipping graph extraction')
      } else {
        const graphResults = await extractGraphData(questions, openaiKey)

        if (graphResults) {
          let appliedCount = 0
          for (const gResult of graphResults) {
            const idx = gResult.questionIndex
            if (idx >= 0 && idx < questions.length && gResult.needsGraph && gResult.graphData) {
              const gd = gResult.graphData
              // Map nlPoints to points for numberline compatibility
              if (gd.type === 'numberline' && gd.nlPoints) {
                gd.points = gd.nlPoints
                delete gd.nlPoints
              }
              // Clean null fields at top level
              Object.keys(gd).forEach(k => { if (gd[k] === null) delete gd[k] })
              // Clean null fields inside secondShape; drop it entirely if empty/shape-less
              if (gd.secondShape) {
                Object.keys(gd.secondShape).forEach(k => {
                  if (gd.secondShape[k] === null) delete gd.secondShape[k]
                })
                if (!gd.secondShape.shape) delete gd.secondShape
              }
              questions[idx].graphData = gd
              appliedCount++
            }
          }
          meta.stage2 = 'ok'
          meta.extractionApplied = appliedCount
          console.log('[Stage2] Applied graphData to', appliedCount, 'of', questions.length, 'questions')
        } else {
          meta.stage2 = 'failed'
          meta.stage2Error = 'extractGraphData returned null (see earlier logs)'
          console.error('[Stage2] Extraction returned null — no graphs applied')
        }
      }
    }

    return res.status(200).json({ questions, _meta: meta })
  } catch (err) {
    console.error('Generate error:', err)
    return res.status(500).json({ error: 'Internal server error', message: err.message })
  }
}
