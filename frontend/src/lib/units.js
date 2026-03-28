// StudyMate v2 - Unit Data
// All units parsed from curriculum CSV

export const UNITS = [
  // ============ 中学1年 英語 ============
  {
    grade: 'j1',
    subject: 'english',
    slug: 'j1-alphabet',
    title: 'アルファベット',
    order: 1,
    subUnits: [
      { slug: 'j1-alphabet-1', title: '大文字・小文字', number: 1 },
      { slug: 'j1-alphabet-2', title: 'ローマ字', number: 2 },
      { slug: 'j1-alphabet-3', title: '英語の語順', number: 3 },
      { slug: 'j1-alphabet-4', title: 'あいさつ・自己紹介', number: 4 },
    ],
  },
  {
    grade: 'j1',
    subject: 'english',
    slug: 'j1-be-verbs',
    title: 'be動詞',
    order: 2,
    subUnits: [
      { slug: 'j1-be-verbs-1', title: 'am, is, are', number: 1 },
      { slug: 'j1-be-verbs-2', title: '肯定文', number: 2 },
      { slug: 'j1-be-verbs-3', title: '疑問文', number: 3 },
      { slug: 'j1-be-verbs-4', title: '否定文', number: 4 },
    ],
  },
  {
    grade: 'j1',
    subject: 'english',
    slug: 'j1-general-verbs',
    title: '一般動詞',
    order: 3,
    subUnits: [
      { slug: 'j1-general-verbs-1', title: '基本動詞', number: 1 },
      { slug: 'j1-general-verbs-2', title: '肯定文', number: 2 },
      { slug: 'j1-general-verbs-3', title: '疑問文', number: 3 },
      { slug: 'j1-general-verbs-4', title: '否定文', number: 4 },
    ],
  },
  {
    grade: 'j1',
    subject: 'english',
    slug: 'j1-question-words',
    title: '疑問詞',
    order: 4,
    subUnits: [
      { slug: 'j1-question-words-1', title: 'what', number: 1 },
      { slug: 'j1-question-words-2', title: 'who', number: 2 },
      { slug: 'j1-question-words-3', title: 'when', number: 3 },
      { slug: 'j1-question-words-4', title: 'where', number: 4 },
      { slug: 'j1-question-words-5', title: 'why', number: 5 },
      { slug: 'j1-question-words-6', title: 'how', number: 6 },
    ],
  },
  {
    grade: 'j1',
    subject: 'english',
    slug: 'j1-nouns-plural',
    title: '名詞・複数形',
    order: 5,
    subUnits: [
      { slug: 'j1-nouns-plural-1', title: '単数名詞', number: 1 },
      { slug: 'j1-nouns-plural-2', title: '複数名詞', number: 2 },
      { slug: 'j1-nouns-plural-3', title: 'this/that', number: 3 },
      { slug: 'j1-nouns-plural-4', title: 'these/those', number: 4 },
    ],
  },
  {
    grade: 'j1',
    subject: 'english',
    slug: 'j1-can',
    title: '助動詞can',
    order: 6,
    subUnits: [
      { slug: 'j1-can-1', title: 'canの意味', number: 1 },
      { slug: 'j1-can-2', title: 'canの肯定文', number: 2 },
      { slug: 'j1-can-3', title: 'canの疑問文', number: 3 },
      { slug: 'j1-can-4', title: 'canの否定文', number: 4 },
    ],
  },
  {
    grade: 'j1',
    subject: 'english',
    slug: 'j1-third-person',
    title: '三人称単数現在',
    order: 7,
    subUnits: [
      { slug: 'j1-third-person-1', title: 'he/she/it', number: 1 },
      { slug: 'j1-third-person-2', title: '動詞にs/esをつける形', number: 2 },
      { slug: 'j1-third-person-3', title: '否定文・疑問文', number: 3 },
    ],
  },
  {
    grade: 'j1',
    subject: 'english',
    slug: 'j1-imperative',
    title: '命令文',
    order: 8,
    subUnits: [
      { slug: 'j1-imperative-1', title: '動詞の原形ではじめる文', number: 1 },
      { slug: 'j1-imperative-2', title: 'Pleaseを使う文', number: 2 },
      { slug: 'j1-imperative-3', title: "Don'tを使う禁止", number: 3 },
    ],
  },
  {
    grade: 'j1',
    subject: 'english',
    slug: 'j1-there-is-are',
    title: 'there is/there are',
    order: 9,
    subUnits: [
      { slug: 'j1-there-is-are-1', title: 'there is', number: 1 },
      { slug: 'j1-there-is-are-2', title: 'there are', number: 2 },
      { slug: 'j1-there-is-are-3', title: '疑問文・否定文', number: 3 },
    ],
  },
  {
    grade: 'j1',
    subject: 'english',
    slug: 'j1-present-progressive',
    title: '現在進行形',
    order: 10,
    subUnits: [
      { slug: 'j1-present-progressive-1', title: 'be動詞+～ing', number: 1 },
      { slug: 'j1-present-progressive-2', title: '今していること', number: 2 },
      { slug: 'j1-present-progressive-3', title: '疑問文・否定文', number: 3 },
    ],
  },
  {
    grade: 'j1',
    subject: 'english',
    slug: 'j1-past-tense',
    title: '過去形',
    order: 11,
    subUnits: [
      { slug: 'j1-past-tense-1', title: 'be動詞の過去形', number: 1 },
      { slug: 'j1-past-tense-2', title: '一般動詞の過去形', number: 2 },
      { slug: 'j1-past-tense-3', title: '規則変化', number: 3 },
      { slug: 'j1-past-tense-4', title: '不規則変化', number: 4 },
    ],
  },
  {
    grade: 'j1',
    subject: 'english',
    slug: 'j1-past-progressive',
    title: '過去進行形',
    order: 12,
    subUnits: [
      { slug: 'j1-past-progressive-1', title: 'was/were+～ing', number: 1 },
      { slug: 'j1-past-progressive-2', title: '過去のある時点でしていたこと', number: 2 },
    ],
  },

  // ============ 中学1年 数学 ============
  {
    grade: 'j1',
    subject: 'math',
    slug: 'j1-positive-negative',
    title: '正負の数',
    order: 1,
    subUnits: [
      { slug: 'j1-positive-negative-1', title: '正の数・負の数', number: 1 },
      { slug: 'j1-positive-negative-2', title: '絶対値', number: 2 },
      { slug: 'j1-positive-negative-3', title: '加法・減法', number: 3 },
      { slug: 'j1-positive-negative-4', title: '乗法・除法', number: 4 },
    ],
  },
  {
    grade: 'j1',
    subject: 'math',
    slug: 'j1-expressions',
    title: '文字と式',
    order: 2,
    subUnits: [
      { slug: 'j1-expressions-1', title: '文字式の表し方', number: 1 },
      { slug: 'j1-expressions-2', title: '式の値', number: 2 },
      { slug: 'j1-expressions-3', title: '1次式の計算', number: 3 },
      { slug: 'j1-expressions-4', title: '数量の関係を式にする', number: 4 },
    ],
  },
  {
    grade: 'j1',
    subject: 'math',
    slug: 'j1-linear-equations',
    title: '1次方程式',
    order: 3,
    subUnits: [
      { slug: 'j1-linear-equations-1', title: '方程式の意味', number: 1 },
      { slug: 'j1-linear-equations-2', title: '方程式の解き方', number: 2 },
      { slug: 'j1-linear-equations-3', title: '移項', number: 3 },
      { slug: 'j1-linear-equations-4', title: '文章題', number: 4 },
    ],
  },
  {
    grade: 'j1',
    subject: 'math',
    slug: 'j1-proportion',
    title: '比例・反比例',
    order: 4,
    subUnits: [
      { slug: 'j1-proportion-1', title: '比例', number: 1 },
      { slug: 'j1-proportion-2', title: '反比例', number: 2 },
      { slug: 'j1-proportion-3', title: '座標', number: 3 },
      { slug: 'j1-proportion-4', title: 'グラフ', number: 4 },
    ],
  },
  {
    grade: 'j1',
    subject: 'math',
    slug: 'j1-plane-geometry',
    title: '平面図形',
    order: 5,
    subUnits: [
      { slug: 'j1-plane-geometry-1', title: '直線と角', number: 1 },
      { slug: 'j1-plane-geometry-2', title: '作図', number: 2 },
      { slug: 'j1-plane-geometry-3', title: 'おうぎ形', number: 3 },
    ],
  },
  {
    grade: 'j1',
    subject: 'math',
    slug: 'j1-solid-geometry',
    title: '空間図形',
    order: 6,
    subUnits: [
      { slug: 'j1-solid-geometry-1', title: '立体の見方', number: 1 },
      { slug: 'j1-solid-geometry-2', title: '展開図', number: 2 },
      { slug: 'j1-solid-geometry-3', title: '表面積', number: 3 },
      { slug: 'j1-solid-geometry-4', title: '体積', number: 4 },
    ],
  },
  {
    grade: 'j1',
    subject: 'math',
    slug: 'j1-data-analysis',
    title: 'データの分析と活用',
    order: 7,
    subUnits: [
      { slug: 'j1-data-analysis-1', title: '資料の整理', number: 1 },
      { slug: 'j1-data-analysis-2', title: '度数分布表', number: 2 },
      { slug: 'j1-data-analysis-3', title: '代表値', number: 3 },
      { slug: 'j1-data-analysis-4', title: '確率の基礎', number: 4 },
    ],
  },

  // ============ 中学2年 英語 ============
  {
    grade: 'j2',
    subject: 'english',
    slug: 'j2-future',
    title: '未来表現',
    order: 1,
    subUnits: [
      { slug: 'j2-future-1', title: 'will', number: 1 },
      { slug: 'j2-future-2', title: 'be going to', number: 2 },
      { slug: 'j2-future-3', title: 'willとbe going toの使い分け', number: 3 },
    ],
  },
  {
    grade: 'j2',
    subject: 'english',
    slug: 'j2-gerund',
    title: '動名詞',
    order: 2,
    subUnits: [
      { slug: 'j2-gerund-1', title: '～ingを名詞として使う', number: 1 },
      { slug: 'j2-gerund-2', title: '主語になる動名詞', number: 2 },
      { slug: 'j2-gerund-3', title: '目的語になる動名詞', number: 3 },
    ],
  },
  {
    grade: 'j2',
    subject: 'english',
    slug: 'j2-conjunctions',
    title: '接続詞',
    order: 3,
    subUnits: [
      { slug: 'j2-conjunctions-1', title: 'when', number: 1 },
      { slug: 'j2-conjunctions-2', title: 'if', number: 2 },
      { slug: 'j2-conjunctions-3', title: 'that', number: 3 },
      { slug: 'j2-conjunctions-4', title: 'because', number: 4 },
    ],
  },
  {
    grade: 'j2',
    subject: 'english',
    slug: 'j2-infinitive',
    title: '不定詞',
    order: 4,
    subUnits: [
      { slug: 'j2-infinitive-1', title: '名詞的用法', number: 1 },
      { slug: 'j2-infinitive-2', title: '副詞的用法', number: 2 },
      { slug: 'j2-infinitive-3', title: '形容詞的用法', number: 3 },
    ],
  },
  {
    grade: 'j2',
    subject: 'english',
    slug: 'j2-modal-verbs',
    title: '助動詞',
    order: 5,
    subUnits: [
      { slug: 'j2-modal-verbs-1', title: 'must', number: 1 },
      { slug: 'j2-modal-verbs-2', title: 'have to', number: 2 },
      { slug: 'j2-modal-verbs-3', title: 'should', number: 3 },
      { slug: 'j2-modal-verbs-4', title: 'may', number: 4 },
    ],
  },
  {
    grade: 'j2',
    subject: 'english',
    slug: 'j2-comparison',
    title: '比較',
    order: 6,
    subUnits: [
      { slug: 'j2-comparison-1', title: '比較級', number: 1 },
      { slug: 'j2-comparison-2', title: '最上級', number: 2 },
      { slug: 'j2-comparison-3', title: 'as...as～', number: 3 },
    ],
  },
  {
    grade: 'j2',
    subject: 'english',
    slug: 'j2-give-show',
    title: 'give/showなど',
    order: 7,
    subUnits: [
      { slug: 'j2-give-show-1', title: 'give A B', number: 1 },
      { slug: 'j2-give-show-2', title: 'show A B', number: 2 },
      { slug: 'j2-give-show-3', title: 'buy/makeなどの第4文型', number: 3 },
    ],
  },
  {
    grade: 'j2',
    subject: 'english',
    slug: 'j2-how-to',
    title: 'how to～',
    order: 8,
    subUnits: [
      { slug: 'j2-how-to-1', title: 'how to+動詞の原形', number: 1 },
      { slug: 'j2-how-to-2', title: 'what to/where toなど', number: 2 },
    ],
  },
  {
    grade: 'j2',
    subject: 'english',
    slug: 'j2-passive',
    title: '受け身',
    order: 9,
    subUnits: [
      { slug: 'j2-passive-1', title: 'be+過去分詞', number: 1 },
      { slug: 'j2-passive-2', title: '肯定文', number: 2 },
      { slug: 'j2-passive-3', title: '疑問文・否定文', number: 3 },
      { slug: 'j2-passive-4', title: 'byを使う表現', number: 4 },
    ],
  },

  // ============ 中学2年 数学 ============
  {
    grade: 'j2',
    subject: 'math',
    slug: 'j2-expression-calc',
    title: '式の計算',
    order: 1,
    subUnits: [
      { slug: 'j2-expression-calc-1', title: '単項式と多項式', number: 1 },
      { slug: 'j2-expression-calc-2', title: '同類項の整理', number: 2 },
      { slug: 'j2-expression-calc-3', title: '加法・減法', number: 3 },
      { slug: 'j2-expression-calc-4', title: '乗法・除法', number: 4 },
    ],
  },
  {
    grade: 'j2',
    subject: 'math',
    slug: 'j2-simultaneous-equations',
    title: '連立方程式',
    order: 2,
    subUnits: [
      { slug: 'j2-simultaneous-equations-1', title: '2元1次方程式', number: 1 },
      { slug: 'j2-simultaneous-equations-2', title: '加減法', number: 2 },
      { slug: 'j2-simultaneous-equations-3', title: '代入法', number: 3 },
      { slug: 'j2-simultaneous-equations-4', title: '文章題', number: 4 },
    ],
  },
  {
    grade: 'j2',
    subject: 'math',
    slug: 'j2-linear-function',
    title: '1次関数',
    order: 3,
    subUnits: [
      { slug: 'j2-linear-function-1', title: '変化の割合', number: 1 },
      { slug: 'j2-linear-function-2', title: 'グラフ', number: 2 },
      { slug: 'j2-linear-function-3', title: '式を求める', number: 3 },
      { slug: 'j2-linear-function-4', title: '交点・利用', number: 4 },
    ],
  },
  {
    grade: 'j2',
    subject: 'math',
    slug: 'j2-parallel-congruent',
    title: '平行と合同',
    order: 4,
    subUnits: [
      { slug: 'j2-parallel-congruent-1', title: '平行線と角', number: 1 },
      { slug: 'j2-parallel-congruent-2', title: '合同条件', number: 2 },
      { slug: 'j2-parallel-congruent-3', title: '証明の基本', number: 3 },
    ],
  },
  {
    grade: 'j2',
    subject: 'math',
    slug: 'j2-triangles-quadrilaterals',
    title: '三角形と四角形',
    order: 5,
    subUnits: [
      { slug: 'j2-triangles-quadrilaterals-1', title: '三角形の性質', number: 1 },
      { slug: 'j2-triangles-quadrilaterals-2', title: '平行四辺形', number: 2 },
      { slug: 'j2-triangles-quadrilaterals-3', title: '特別な四角形', number: 3 },
      { slug: 'j2-triangles-quadrilaterals-4', title: '性質と証明', number: 4 },
    ],
  },
  {
    grade: 'j2',
    subject: 'math',
    slug: 'j2-probability',
    title: '確率',
    order: 6,
    subUnits: [
      { slug: 'j2-probability-1', title: '起こりやすさ', number: 1 },
      { slug: 'j2-probability-2', title: '場合の数', number: 2 },
      { slug: 'j2-probability-3', title: '樹形図', number: 3 },
      { slug: 'j2-probability-4', title: '確率の求め方', number: 4 },
    ],
  },
  {
    grade: 'j2',
    subject: 'math',
    slug: 'j2-data-comparison',
    title: 'データの比較',
    order: 7,
    subUnits: [
      { slug: 'j2-data-comparison-1', title: '四分位数', number: 1 },
      { slug: 'j2-data-comparison-2', title: '四分位範囲', number: 2 },
      { slug: 'j2-data-comparison-3', title: '箱ひげ図', number: 3 },
      { slug: 'j2-data-comparison-4', title: 'データの散らばり', number: 4 },
    ],
  },

  // ============ 中学3年 英語 ============
  {
    grade: 'j3',
    subject: 'english',
    slug: 'j3-present-perfect',
    title: '現在完了',
    order: 1,
    subUnits: [
      { slug: 'j3-present-perfect-1', title: '継続', number: 1 },
      { slug: 'j3-present-perfect-2', title: '完了', number: 2 },
      { slug: 'j3-present-perfect-3', title: '経験', number: 3 },
    ],
  },
  {
    grade: 'j3',
    subject: 'english',
    slug: 'j3-present-perfect-progressive',
    title: '現在完了進行形',
    order: 2,
    subUnits: [
      { slug: 'j3-present-perfect-progressive-1', title: 'have been～ing', number: 1 },
      { slug: 'j3-present-perfect-progressive-2', title: '継続している動作', number: 2 },
    ],
  },
  {
    grade: 'j3',
    subject: 'english',
    slug: 'j3-ask-tell',
    title: 'ask人to～/tell人に～',
    order: 3,
    subUnits: [
      { slug: 'j3-ask-tell-1', title: 'ask人to～', number: 1 },
      { slug: 'j3-ask-tell-2', title: 'tell人to～', number: 2 },
      { slug: 'j3-ask-tell-3', title: 'want人to～', number: 3 },
    ],
  },
  {
    grade: 'j3',
    subject: 'english',
    slug: 'j3-it-is-for',
    title: 'It is...for人to～',
    order: 4,
    subUnits: [
      { slug: 'j3-it-is-for-1', title: 'It is+形容詞+for人+to～', number: 1 },
      { slug: 'j3-it-is-for-2', title: '「人にとって～することは…だ」', number: 2 },
    ],
  },
  {
    grade: 'j3',
    subject: 'english',
    slug: 'j3-svoc',
    title: 'SVOC型',
    order: 5,
    subUnits: [
      { slug: 'j3-svoc-1', title: 'make+A+B', number: 1 },
      { slug: 'j3-svoc-2', title: 'call+A+B', number: 2 },
      { slug: 'j3-svoc-3', title: 'name+A+B', number: 3 },
    ],
  },
  {
    grade: 'j3',
    subject: 'english',
    slug: 'j3-participle-modifier',
    title: '分詞の後置修飾',
    order: 6,
    subUnits: [
      { slug: 'j3-participle-modifier-1', title: '現在分詞', number: 1 },
      { slug: 'j3-participle-modifier-2', title: '過去分詞', number: 2 },
      { slug: 'j3-participle-modifier-3', title: 'something interestingなど', number: 3 },
    ],
  },
  {
    grade: 'j3',
    subject: 'english',
    slug: 'j3-indirect-question',
    title: '間接疑問文',
    order: 7,
    subUnits: [
      { slug: 'j3-indirect-question-1', title: 'I know what...', number: 1 },
      { slug: 'j3-indirect-question-2', title: 'I know who/where/when...', number: 2 },
    ],
  },
  {
    grade: 'j3',
    subject: 'english',
    slug: 'j3-relative-pronoun',
    title: '関係代名詞',
    order: 8,
    subUnits: [
      { slug: 'j3-relative-pronoun-1', title: 'who', number: 1 },
      { slug: 'j3-relative-pronoun-2', title: 'which', number: 2 },
      { slug: 'j3-relative-pronoun-3', title: 'that', number: 3 },
      { slug: 'j3-relative-pronoun-4', title: '主格・目的格', number: 4 },
    ],
  },
  {
    grade: 'j3',
    subject: 'english',
    slug: 'j3-subjunctive',
    title: '仮定法過去',
    order: 9,
    subUnits: [
      { slug: 'j3-subjunctive-1', title: 'If I were...', number: 1 },
      { slug: 'j3-subjunctive-2', title: '現実と反対の仮定', number: 2 },
    ],
  },

  // ============ 中学3年 数学 ============
  {
    grade: 'j3',
    subject: 'math',
    slug: 'j3-polynomials',
    title: '多項式',
    order: 1,
    subUnits: [
      { slug: 'j3-polynomials-1', title: '展開', number: 1 },
      { slug: 'j3-polynomials-2', title: '因数分解', number: 2 },
    ],
  },
  {
    grade: 'j3',
    subject: 'math',
    slug: 'j3-square-root',
    title: '平方根',
    order: 2,
    subUnits: [
      { slug: 'j3-square-root-1', title: '√の意味', number: 1 },
      { slug: 'j3-square-root-2', title: '根号を含む計算', number: 2 },
      { slug: 'j3-square-root-3', title: '有理化', number: 3 },
    ],
  },
  {
    grade: 'j3',
    subject: 'math',
    slug: 'j3-quadratic-equations',
    title: '2次方程式',
    order: 3,
    subUnits: [
      { slug: 'j3-quadratic-equations-1', title: '解の公式', number: 1 },
      { slug: 'j3-quadratic-equations-2', title: '因数分解による解法', number: 2 },
      { slug: 'j3-quadratic-equations-3', title: '平方完成', number: 3 },
      { slug: 'j3-quadratic-equations-4', title: '文章題', number: 4 },
    ],
  },
  {
    grade: 'j3',
    subject: 'math',
    slug: 'j3-quadratic-function',
    title: '関数y=ax²',
    order: 4,
    subUnits: [
      { slug: 'j3-quadratic-function-1', title: '放物線', number: 1 },
      { slug: 'j3-quadratic-function-2', title: '変化の割合', number: 2 },
      { slug: 'j3-quadratic-function-3', title: 'グラフの特徴', number: 3 },
    ],
  },
  {
    grade: 'j3',
    subject: 'math',
    slug: 'j3-similarity',
    title: '相似な図形',
    order: 5,
    subUnits: [
      { slug: 'j3-similarity-1', title: '相似条件', number: 1 },
      { slug: 'j3-similarity-2', title: '相似比', number: 2 },
      { slug: 'j3-similarity-3', title: '面積比・体積比', number: 3 },
    ],
  },
  {
    grade: 'j3',
    subject: 'math',
    slug: 'j3-circle',
    title: '円',
    order: 6,
    subUnits: [
      { slug: 'j3-circle-1', title: '円周角の定理', number: 1 },
      { slug: 'j3-circle-2', title: '接線と弦', number: 2 },
      { slug: 'j3-circle-3', title: '円と角の性質', number: 3 },
    ],
  },
  {
    grade: 'j3',
    subject: 'math',
    slug: 'j3-pythagorean',
    title: '三平方の定理',
    order: 7,
    subUnits: [
      { slug: 'j3-pythagorean-1', title: '直角三角形の辺の関係', number: 1 },
      { slug: 'j3-pythagorean-2', title: '定理の利用', number: 2 },
      { slug: 'j3-pythagorean-3', title: '空間図形への応用', number: 3 },
    ],
  },
  {
    grade: 'j3',
    subject: 'math',
    slug: 'j3-sampling',
    title: '標本調査',
    order: 8,
    subUnits: [
      { slug: 'j3-sampling-1', title: '母集団と標本', number: 1 },
      { slug: 'j3-sampling-2', title: '無作為抽出', number: 2 },
      { slug: 'j3-sampling-3', title: '標本から全体を推測', number: 3 },
    ],
  },
];

// Helper: get units filtered by grade and subject
export function getUnitsByGradeAndSubject(grade, subject) {
  return UNITS.filter((u) => u.grade === grade && u.subject === subject);
}

// Helper: get sub-units for a parent unit slug
export function getSubUnits(parentSlug) {
  const unit = UNITS.find((u) => u.slug === parentSlug);
  return unit ? unit.subUnits : [];
}

// Helper: find a unit by its slug
export function getUnitBySlug(slug) {
  return UNITS.find((u) => u.slug === slug) || null;
}
