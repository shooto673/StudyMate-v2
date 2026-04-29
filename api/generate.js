export const config = {
  maxDuration: 60,
}

import { GENERATORS } from '../lib/mathSolvers.js'
import { classifyUnit } from '../lib/classifier.js'
import { validateQuestionObject } from '../lib/questionValidator.js'
import { buildGraphFromSpec } from '../lib/buildGraphFromSpec.js'
import {
  sanitizeQuestions,
  sanitizeGraphData,
  normalizeMathText,
  isBeingAsked,
  removeContaminatedSentences,
} from '../lib/sanitizeQuestion.js'
import { mergeStage2GraphData } from '../lib/stage2GraphMerge.js'

// Re-export sanitize helpers for downstream callers / tests that historically
// imported them from this module. New code should import from
// '../lib/sanitizeQuestion.js' directly.
export {
  normalizeMathText,
  isBeingAsked,
  sanitizeGraphData,
  removeContaminatedSentences,
}

/**
 * Solver-first generator. Produces `count` questions for the given
 * generator list entirely from deterministic solvers — no LLM involvement.
 * Each question is independently generated (no shared buffer), which
 * physically prevents cross-question explanation contamination.
 *
 * Rotation: round-robins through `generators` so every listed problemType
 * is guaranteed to appear at least ⌊count / generators.length⌋ times.
 */
function generateSolverQuestions(generators, count, ctx = {}) {
  const out = []
  let guard = 0
  while (out.length < count && guard++ < count * 20) {
    const genKey = generators[out.length % generators.length]
    const gen = GENERATORS[genKey]
    if (!gen) continue
    let q
    try { q = gen() } catch { continue }
    // Attach graphData from spec BEFORE validation (missing_required_graph check)
    const graphData = buildGraphFromSpec(q.spec)
    const candidate = {
      question: q.question,
      choices: q.choices,
      correctIndex: q.correctIndex,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      hint: q.hint,
      graphData,
      _solverSpec: q.spec,
    }
    const v = validateQuestionObject(candidate, {
      problemType: q.spec?.problemType,
      unitTitle: ctx.unitTitle,
      subUnitTitle: ctx.subUnitTitle,
      subject: 'math',
    })
    if (!v.ok) {
      console.warn('[Solver] rejected by validator:', v.errors, 'type=', q.spec?.problemType)
      continue
    }
    out.push(candidate)
  }
  return out
}

/**
 * Whether the current runtime allows `debug_force_problem_type`.
 * Enabled when:
 *   - process.env.ALLOW_DEBUG_FORCE === 'true', OR
 *   - process.env.VERCEL_ENV !== 'production' (preview / development / local)
 * Forcing only picks a solver-first problemType; no security surface expansion.
 */
function isDebugForceAllowed() {
  if (String(process.env.ALLOW_DEBUG_FORCE || '').toLowerCase() === 'true') return true
  const env = String(process.env.VERCEL_ENV || '').toLowerCase()
  return env !== 'production'
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
                // Circle labeling: center + points on circumference + optional chord
                center: { type: ['string', 'null'], description: 'Label for the circle center (usually "O"). Set whenever the question mentions 中心/圏心O or the center is referenced at all.' },
                pointsOnCircle: {
                  type: ['array', 'null'],
                  description: 'Labelled points lying on the circumference (e.g. A, B, C). Use this when the question mentions 点A, 点B on the circle.',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      angle: { type: ['number', 'null'], description: 'Angle in degrees (0-360, CCW from +x). null → auto-distribute' },
                    },
                    required: ['label', 'angle'],
                    additionalProperties: false,
                  },
                },
                chord: {
                  type: ['object', 'null'],
                  description: 'Optional chord connecting two labelled points on the circle. Set from and to to the point labels.',
                  properties: {
                    from: { type: 'string' },
                    to: { type: 'string' },
                  },
                  required: ['from', 'to'],
                  additionalProperties: false,
                },
                // Coordinate-plane polygon (e.g. parallelogram plotted at (0,0)(3,0)(5,2)(2,2))
                polygons: {
                  type: ['array', 'null'],
                  description: 'Closed polygons drawn on the coordinate plane. Use this when the question defines a shape by vertex coordinates (e.g. "A(0,0), B(3,0), C(5,2), D(2,2)"). Do NOT use for polygons without explicit coordinates — those go under shape.',
                  items: {
                    type: 'object',
                    properties: {
                      vertices: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            x: { type: 'number' },
                            y: { type: 'number' },
                            label: { type: ['string', 'null'] },
                          },
                          required: ['x', 'y', 'label'],
                          additionalProperties: false,
                        },
                      },
                      label: { type: ['string', 'null'], description: 'Optional overall label like "平行四辺形ABCD"' },
                    },
                    required: ['vertices', 'label'],
                    additionalProperties: false,
                  },
                },
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
                curves: { type: ['array', 'null'], description: 'Quadratic curves y = ax² + bx + c', items: { type: 'object', properties: { a: { type: 'number' }, b: { type: 'number' }, c: { type: 'number' }, label: { type: 'string' } }, required: ['a', 'b', 'c', 'label'], additionalProperties: false } },
                points: { type: ['array', 'null'], items: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, label: { type: 'string' } }, required: ['x', 'y', 'label'], additionalProperties: false } },
                // Numberline properties
                min: { type: ['number', 'null'] },
                max: { type: ['number', 'null'] },
                nlPoints: { type: ['array', 'null'], items: { type: 'object', properties: { value: { type: 'number' }, label: { type: 'string' } }, required: ['value', 'label'], additionalProperties: false } },
              },
              required: [
                'type', 'shape', 'labels', 'sides', 'angles', 'diagonals',
                'width', 'height', 'radius', 'secondShape',
                'center', 'pointsOnCircle', 'chord',
                'range', 'lines', 'curves', 'points', 'polygons',
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
- 座標・一次関数グラフ（y = ax + b）→ needsGraph=true, type:"coordinate", lines配列を使用
- 二次関数グラフ（y = ax²、y = ax² + bx + c）→ needsGraph=true, type:"coordinate", curves配列を使用（linesではない）
- 数直線 → needsGraph=true
- 角度だけ与えられている三角形でも needsGraph=true（sidesをnullにしてもOK）
- 純粋な計算問題（方程式を解く等）のみ needsGraph=false, graphData=null

ルール:
- 【重要】問題で「求めなさい」「何cm？」「いくつ？」「何度？」と聞かれている辺・角度・半径は、sides/angles/radiusに null を入れること（答えを見せてしまうため）
- 三角形のsides順序: [AB, BC, CA]（頂点ラベルの隣接辺順）
- 三角形のangles順序: [∠A, ∠B, ∠C]（各頂点の内角、順序厳守）
- 四角形のsides順序: [AB, BC, CD, DA]
- 座標グラフのrangeは5を基本とする（切片が大きい場合のみ増やす、最大8）
- 【二次関数の扱い】y = ax² + bx + c → curves配列に {a, b, c, label} を設定。linesは使わないこと。
  例: y = 2x² → curves: [{a: 2, b: 0, c: 0, label: "y=2x²"}]
  例: y = -3x² + 1 → curves: [{a: -3, b: 0, c: 1, label: "y=-3x²+1"}]
  例: y = x² - 4x + 3 → curves: [{a: 1, b: -4, c: 3, label: "y=x²-4x+3"}]
- 【一次関数と二次関数を混同しない】x²（xの2乗）が含まれていたら curves を使う。含まれていなければ lines を使う。
- 「AB = AC = 8cm」のような共有値も正しく各辺に展開すること
- 「二等辺三角形ABC、AB = AC = 8cm」→ sides: ["8cm", null, "8cm"] (ABが8cm、BCは不明or問われている、CAが8cm)

【直角三角形（必ず可視化）】
- 「直角三角形ABC、∠C=90°、∠A=35°」→ labels:["A","B","C"], angles:["35°",null,"90°"], sides:null でOK
- 直角三角形は sidesがなくても necessarily needsGraph=true にすること

【円のラベル付け（必ず可視化）】
- 円の問題で中心が登場するときは center: "O"（または問題文のラベル）を設定すること
- 円周上の点（A, B, C など）が登場する場合は pointsOnCircle に { label, angle: null } で列挙（angle は null のままで良い。自動配置される）
- 弦が問われる問題（AB弦、∠AOB等）では chord: { from: "A", to: "B" } を設定
- 例: 「中心Oの円で、円周上の点A, Bが…」→ center:"O", pointsOnCircle:[{label:"A",angle:null},{label:"B",angle:null}]

【座標平面上の多角形（必ず可視化）】
- 問題文が頂点を座標で与える場合（例: 「A(0,0), B(3,0), C(5,2), D(2,2)を頂点とする平行四辺形」）→ type:"coordinate", polygons:[{vertices:[{x:0,y:0,label:"A"},...], label:"平行四辺形ABCD"}]
- 座標が与えられていない図形は polygons ではなく type:"shape" を使うこと（これまで通り）

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

  const { unitTitle, subUnitTitle, subject, grade, count = 5, debug_force_problem_type } = req.body

  if (!unitTitle || !subUnitTitle || !subject) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const gradeLabel = { j1: '中学1年', j2: '中学2年', j3: '中学3年' }[grade] || '中学1年'
  const subjectLabel = subject === 'english' ? '英語' : '数学'

  // ── Debug-force branch (non-prod / opt-in) ──
  // Testers can force a specific solver problemType to verify coverage.
  // Accepted via (in priority order):
  //   1. request body: debug_force_problem_type
  //   2. request body: forceProblemType (camel-case alias — easier from frontend)
  //   3. query string: ?forceProblemType=...
  //      — parsed even when the URL contains no explicit `req.query` handling
  function parseQueryForceType(url) {
    try {
      if (!url) return null
      const idx = url.indexOf('?')
      if (idx === -1) return null
      const qs = new URLSearchParams(url.slice(idx + 1))
      return qs.get('forceProblemType') || qs.get('debug_force_problem_type')
    } catch { return null }
  }
  const forcedType =
    debug_force_problem_type ||
    req.body?.forceProblemType ||
    (req.query && (req.query.forceProblemType || req.query.debug_force_problem_type)) ||
    parseQueryForceType(req.url)

  if (forcedType) {
    if (!isDebugForceAllowed()) {
      return res.status(403).json({ error: 'debug_force_disabled_in_production' })
    }
    if (!GENERATORS[forcedType]) {
      return res.status(400).json({
        error: 'unknown_problem_type',
        availableTypes: Object.keys(GENERATORS),
      })
    }
    // Debug force bypasses unit_problem_type_mismatch (testers are intentionally
    // requesting a specific type regardless of unit).
    const forcedQuestions = generateSolverQuestions([forcedType], count)
    console.log('[Solver] DEBUG FORCE path:', { forcedType, count: forcedQuestions.length })
    return res.status(200).json({
      questions: forcedQuestions,
      _meta: {
        stage1: 'solver',
        stage2: 'not_applicable',
        classification: 'debug_force',
        generators: [forcedType],
        problemTypes: forcedQuestions.map(q => q._solverSpec?.problemType),
        forced_problem_type: forcedType,
        extractionApplied: 0,
        extractionTotal: forcedQuestions.length,
      },
    })
  }

  // ── Solver-first branch for high-risk math units ──
  // Classify every math request and, if it matches a solver-required pattern,
  // bypass the LLM entirely. Each question is generated independently so there
  // is no shared buffer across questions (physical contamination prevention).
  const classification = classifyUnit(unitTitle, subUnitTitle, subject)
  const killSwitchOn = String(process.env.SOLVER_REQUIRED_UNITS_ONLY || '').toLowerCase() === 'true'

  if (subject === 'math' && classification.category === 'solver_required') {
    try {
      const solverQuestions = generateSolverQuestions(classification.generators, count, {
        unitTitle, subUnitTitle,
      })
      if (solverQuestions.length >= count) {
        console.log('[Solver] solver-first path used:', {
          unitTitle, subUnitTitle, generators: classification.generators, count: solverQuestions.length,
        })
        return res.status(200).json({
          questions: solverQuestions,
          _meta: {
            stage1: 'solver',
            stage2: 'not_applicable',
            classification: classification.category,
            generators: classification.generators,
            problemTypes: solverQuestions.map(q => q._solverSpec?.problemType),
            forced_problem_type: null,
            extractionApplied: 0,
            extractionTotal: solverQuestions.length,
          },
        })
      }
      console.warn('[Solver] generator produced', solverQuestions.length, '/', count, '— falling back')
    } catch (err) {
      console.error('[Solver] generation error:', err.message)
    }
    // If kill-switch is ON and solver failed to meet count, refuse to ship.
    if (killSwitchOn) {
      return res.status(503).json({
        error: 'solver_required_unit_unavailable',
        message: 'この単元は現在 solver-first モードでのみ配信されます。しばらく時間をおいて再試行してください。',
      })
    }
  } else if (killSwitchOn && subject === 'math' && classification.category !== 'solver_required') {
    // In kill-switch mode, we only serve solver-required math units.
    return res.status(503).json({
      error: 'only_solver_required_units_enabled',
      message: 'SOLVER_REQUIRED_UNITS_ONLY モードでは solver 対応単元のみ配信されます。',
    })
  }

  const mathGraphInstruction = subject === 'math' ? `
- 図形やグラフの問題では、問題文に具体的な数値（辺の長さ、半径、座標、傾き、切片など）を必ず明記すること。
- 図形問題では頂点名（A, B, C, D等）を問題文に含めること。例: 「三角形ABCで、AB = 5cm、BC = 7cm…」
- 辺の長さを記述する際は「AB = 5cm」の形式を使うこと（図は自動生成されます）。
- 描画できる図形: 三角形、長方形、平行四辺形、ひし形、円、一次関数グラフ(y = ax + b)、二次関数グラフ(y = ax²、y = ax² + bx + c)、数直線
- 描画できない図形（展開図、立体、回転体、おうぎ形等）の問題は出題しないこと。
- 【絶対禁止】以下の円関連の問題は絶対に生成してはいけません（専用システムで別途扱います。あなたがこれらを作るとユーザーに間違った図形が表示されます）：
  ・円周角の定理を使う問題
  ・円に内接する四角形に関する問題（対角の和=180°など）
  ・円の直径に関する問題（タレスの定理、直径上の点から伸びる線の問題など）
  ・円周角と中心角の関係を問う問題
  これらは一切作らず、代わりに円の面積・周の長さ・半径と直径の関係など、図形が単純な円のみで成立する計算問題に置き換えてください。
- 【出題バランスの必須ルール】${count}問中、必ず以下の内訳を守ること（単元内容と関係があれば優先、関係なくても無理に出す）：
  ・三角形の問題を1問以上
  ・四角形（長方形/平行四辺形/ひし形のいずれか）の問題を1問以上（ただし単元が三角形専用の場合は除外）
  ・円の問題を1問以上（${count} >= 4 の場合、または単元が円・関数・図形系の場合）
  ・座標グラフ(y = ax + b または y = ax²)または数直線の問題を1問以上
  ・純粋な計算問題を1-2問
- 全角マイナス記号「−」は使わず、半角「-」を使用すること（例: y = -3x + 6）。` : ''

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
- 各問題は question（問題文）、choices（4つの選択肢配列）、correctIndex（正解のインデックス0-3）、correctAnswer（正解の選択肢テキスト）、explanation（解説）を含む
- 【重要】correctAnswer は choices[correctIndex] と完全一致する文字列にすること。解説で導かれる正解がcorrectAnswerと一致することを必ず確認。
- 【選択肢の相互排他性】4つの選択肢のうち、数学的に正しいものは必ず1つだけに限定すること。2つ以上の選択肢が同時に成り立つ問題を作ってはならない。
  ・悪い例: 平行四辺形ABCDの性質を問う問題で「∠A=∠C」と「∠B=∠D」を同時に選択肢に含める（どちらも平行四辺形では常に真）。どちらか片方のみを選択肢に入れること。
  ・悪い例: 「AB=CD」と「AD=BC」を同時に含める（平行四辺形ではどちらも真）。
  ・この手の問題は「正しい組み合わせはどれか」ではなく「次のうち誤っているものはどれか」にするか、偽の選択肢を3つ混ぜて真の選択肢を1つだけにすること。
- correctIndexは0-3でランダムに分散させること（毎回同じ位置にしない）
- 問題は基本〜標準レベル
- 問題文は簡潔に（中学生が理解できる日本語）
- 【重要】対象学年の範囲を厳守すること。上の学年で習う内容は絶対に使わない。例: 中学1年・2年の問題に√（平方根）や三平方の定理を出さない。中学1年の問題に連立方程式や一次関数を出さない。
- ${subject === 'english' ? '英語の問題は日本語で出題し、選択肢に英語を含める。文法や語彙を問う形式で。英語の問題は出題形式を多様にすること：穴埋め問題、並べ替え問題、和訳問題、英訳問題、文法選択問題などを混ぜる。短縮形（I\'m / don\'t）と非短縮形（I am / do not）がどちらも文法的に正しい場合は、解説でその旨を必ず言及すること。' : '数学の問題は計算問題や文章題を混ぜて出す。選択肢は数値や式で。数学の問題も出題形式を多様にすること：計算問題、文章題、図形問題、応用問題を混ぜる。'}
- 解説は2-3文で、以下の構成にすること：①正解の理由 ②よくある間違いの指摘 ③関連するポイント（英語なら許容表現、数学なら公式など）
- 【解説一貫性の絶対ルール】解説内で一度示した数値（角度・辺の長さ・比の値）を後で別の値に変えないこと。途中計算の結論と最終答えは必ず一致させること。
- 【解説汚染禁止】解説は必ずその問題固有の数値のみを使うこと。他の問題の数値・変数名（EF、AB等の辺名など）を混入させないこと。各問題の解説は完全に独立して生成すること。${hintInstruction}${mathGraphInstruction}

以下のJSON形式で返してください（JSON以外は一切出力しないでください）:
[
  {
    "question": "問題文",
    "choices": ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
    "correctIndex": 0,
    "correctAnswer": "正解の選択肢テキスト（choices[correctIndex]と完全一致）",
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

    let questions = JSON.parse(jsonMatch[0])

    // === Post-Stage-1 sanitisation ===
    // Text normalisation, contaminated-sentence removal, and correctIndex
    // repair live in lib/sanitizeQuestion.js. This is pure fix-up; it never
    // drops questions — the validator below is the single CRITICAL gate.
    sanitizeQuestions(questions)

    // === Final validator pass (math only): drop questions with critical errors ===
    if (subject === 'math') {
      const before = questions.length
      const kept = []
      for (const q of questions) {
        const v = validateQuestionObject(q)
        // Critical errors that must never ship
        const CRITICAL = new Set([
          'correct_answer_not_in_choices',
          'correct_index_does_not_point_at_correct_answer',
          'correct_index_out_of_range',
          'explanation_final_mismatch',
          // Ambiguous: multiple correct answers — would punish a student
          // who picked a mathematically-valid choice.
          'multiple_valid_opposite_angles',
          // LLM invented a 円周角 / 内接四角形 / 直径AB question but the
          // figure builder can only draw a rectangle. Reject the whole
          // question rather than ship a mismatched diagram.
          'circle_figure_required_but_missing',
        ])
        const hasCritical = v.errors.some(e => CRITICAL.has(e))
        // Alien-label errors are already mitigated by removeContaminatedSentences,
        // but if any slip through we also drop them.
        const hasAlien = v.errors.some(e => e.startsWith('alien_labels:'))
        if (hasCritical || hasAlien) {
          console.warn('[Validator] dropped question:', v.errors, '→', q.question?.slice(0, 50))
          continue
        }
        kept.push(q)
      }
      if (kept.length < before) {
        console.warn(`[Validator] kept ${kept.length}/${before} questions`)
      }
      questions = kept
    }

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
      } else if (!questions.some(q => q.needsGraph === true)) {
        meta.stage2 = 'skipped_no_graph_questions'
        console.log('[Stage2] skipped — 0 questions with needsGraph=true')
      } else {
        const graphResults = await extractGraphData(questions, openaiKey)

        if (graphResults) {
          // Stage-2 post-processing: merge extraction results into questions
          // with defensive cleanup (nlPoints→points, null strip, secondShape
          // drop, side-order fix, range clamp). See lib/stage2GraphMerge.js.
          const { appliedCount } = mergeStage2GraphData(questions, graphResults)
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
