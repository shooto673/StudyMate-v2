# CLAUDE.md — StudyMate v2

## プロジェクト概要
中学生向け数学・学習クイズアプリ。LLMとdeterministic solverを組み合わせたハイブリッド問題生成パイプラインを持つ。

- **リポジトリ形式**: モノレポ（root = バックエンドAPI / frontend/ = Reactフロントエンド）
- **本番URL**: Vercel（mainブランチ自動デプロイ）
- **CI**: GitHub Actions（push/PRごとにテスト自動実行）

---

## アーキテクチャ全体図

```
POST /api/generate
    │
    ▼
api/generate.js（オーケストレーター・609行）
    │
    ├─ classifyUnit()          → lib/classifier.js
    │       solver_required?
    │       ├─ YES → generateSolverQuestions()
    │       │          └ GENERATORS[key]()     → lib/mathSolvers.js
    │       │          └ buildGraphFromSpec()  → lib/buildGraphFromSpec.js
    │       │          └ validateQuestionObject() → lib/questionValidator.js
    │       └─ NO  → Claude Haiku（Stage 1 LLM）
    │
    ├─ sanitizeQuestions()     → lib/sanitizeQuestion.js
    ├─ validateQuestionObject() → lib/questionValidator.js（CRITICAL Gate）
    ├─ extractGraphData()      → GPT-4o-mini（Stage 2 LLM）
    └─ mergeStage2GraphData()  → lib/stage2GraphMerge.js
            │
            ▼
frontend/src/lib/quizApi.js → validateGraphData()（防御ガード・Phase 3まで温存）
frontend/src/components/MathGraph.jsx → SUPPORTED_SHAPES/TYPESチェック
```

---

## モジュール責任マップ（変更前に必ず確認）

| モジュール | 行数 | 責任 | ⚠️ 変更禁止事項 |
|---|---|---|---|
| `lib/classifier.js` | 101 | ユニット分類・solver routing | ロジック変更は全経路に影響 |
| `lib/mathSolvers.js` | 521 | 決定論的問題生成（GENERATORS） | 答えの正確性を絶対に壊さない |
| `lib/buildGraphFromSpec.js` | 150 | solver spec → graphData変換 | 座標計算の正確性 |
| `lib/questionValidator.js` | 195 | **Final Gate（CRITICAL drop）** | ルール削除・弱体化は絶対禁止 |
| `lib/sanitizeQuestion.js` | 366 | テキスト修正・correctIndex修正 | drop権限なし（修正のみ） |
| `lib/stage2GraphMerge.js` | 102 | Stage 2結果をquestionに統合 | drop権限なし |
| `api/generate.js` | 609 | オーケストレーターのみ | これ以上肥大化させない |

---

## 技術スタック

### バックエンド（root/）
- **Runtime**: Node.js（ES Modules、`"type": "module"`）
- **LLM Stage 1**: Claude Haiku（非solver経路の問題生成）
- **LLM Stage 2**: GPT-4o-mini（graphData抽出）
- **テスト**: `node tests/run.mjs`（207件、カスタムランナー）
- **preflight**: `node scripts/preflight.mjs`（import追跡）

### フロントエンド（frontend/）
- **確認コマンド**: `cat frontend/package.json` で詳細確認
- **ビルド**: `npm --prefix frontend run build`
- **開発サーバー**: `npm --prefix frontend run dev`

### インフラ
- **デプロイ**: Vercel（mainブランチ → 本番自動デプロイ）
- **CI**: GitHub Actions（`.github/workflows/`）
- **Claude Workflow**: `.github/workflows/claude.yml`（Issue → 自動実装 → PR）

---

## solver_required ユニット（現在の範囲）

```javascript
// lib/classifier.js SUBUNIT_MATRIX（現在）
'円周角の定理'  → [thales_theorem, cyclic_quadrilateral]
'円と角の性質'  → [thales_theorem, cyclic_quadrilateral]
// それ以外の図形 → LLM経路（三角形・平行四辺形・相似など）
```

---

## テストスイート構成（207件）

```
figureFixes         55件  ← 図形バグリグレッション（最重要）
solverAndValidator  23件
stage2GraphMerge    18件
validator           17件
unitMatrix          16件
sanitizeQuestion    13件
graphDataShape      12件
geometry            11件
coverageAndForce    10件
handlerForce         8件
criticalImports      8件
explanationIntegrity  9件
schema               5件
parabolaLabels        3件
```

---

## 既知リスク・温存事項（変更前に確認）

### 🔴 HIGH
- **本番スモークテスト未実施**: Phase 1+2B（989af53）以降の本番動作未確認
- **Claude Workflow未検証**: `claude.yml`が実際にIssue→PR動作するか未確認

### 🟡 MEDIUM（意図的温存）
- **フロント二重防御**: `quizApi.js` + `MathGraph.jsx`の検証はバックエンドと重複。Phase 3まで意図的に残存。触らない。
- **solver fallback未実装**: `generateSolverQuestions()`の上限到達時に空配列を返す。
- **Classifierカバレッジギャップ**: 三角形・平行四辺形・相似はLLM経路のまま。

### 🟢 LOW
- `frontend/dist/index.html`がgit追跡されたまま（`git rm --cached frontend/dist/index.html`で解消可能）

---

## 優先度付きタスク（現時点）

```
優先度 1（今すぐ）: 本番スモークテスト
  □ 中3 → 円 → 円周角（solver-first経路）
  □ 中2 → 1次関数（LLM → sanitize → Stage2）
  □ 中1 → 英語 → be動詞（非数学経路）
  □ Vercel Functionsログにエラーなし確認

優先度 2（今週中）: Claude Workflow動作確認
  □ テストIssueを作成してclaude-implementラベルを付ける
  □ PRが自動生成されるか確認
  □ CLAUDE_CODE_OAUTH_TOKENの有効性確認

優先度 3（安定確認後）: Phase 3 フロント防御ガード整理
優先度 4（中期）: solver-first拡張（平行四辺形・相似三角形）
優先度 5（長期）: フォールバック強化
```

---

## コーディング規則

- **ESM必須**: `require()`禁止、`import/export`のみ
- **オーケストレーター肥大化禁止**: `api/generate.js`に新ロジックを追加しない。新機能は必ずlib/に分離。
- **drop権限**: `questionValidator.js`のみがdrop可能。sanitize/mergeはdrop禁止。
- **テスト必須**: 新規モジュール追加時は対応テストをtests/に追加すること
- **prepush必須**: `npm run prepush`（preflight + テスト）がパスしてからpush

---

## よく使うコマンド

```bash
# 開発
npm run dev          # フロントエンド開発サーバー
npm test             # テスト実行（207件）
npm run prepush      # push前チェック（preflight + test）

# Git
git status           # 現在の状態確認
git log --oneline -6 # 最近6件のcommit確認
git diff             # 変更差分確認

# Vercel
vercel logs          # 本番ログ確認（Vercel CLI）
```
