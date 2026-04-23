# StudyMate Project Rules

## Project purpose
StudyMate is an AI learning app for junior high school students in Japan.
Current MVP target: J1-J3, English and Math.

## Non-negotiable priorities
1. Correctness is more important than variety.
2. In Math, a valid problem is more important than showing a figure.
3. Never return a math problem if the answer, choices, and explanation are inconsistent.
4. Frontend must render only. It must not fix mathematical meaning.
5. If graphData is invalid, degrade to text-only instead of returning broken figure data.

## Generation architecture rules
- Prefer solver-first for high-risk math units.
- Use LLM only for safer or non-figure-dependent generation.
- Do not infer important graph structure from natural language unless explicitly designed for that unit.
- Unit routing should use internal IDs, not display labels.

## Validation rules
- Final server-side validation is the source of truth.
- Check:
  - correctAnswer exists in choices
  - correctIndex points to correctAnswer
  - explanation is consistent with correctAnswer
  - graphData is renderable if present
- If validation fails, do not return the broken object.

## Fallback rules
- If solver-first fails, try safe fallback.
- If graphData fails, return text-only problem.
- If problem object fails, regenerate.
- If regeneration still fails, return a safe cached problem.

## Refactoring rules
- Avoid growing api/generate.js further.
- Split responsibilities into:
  - classify
  - generate
  - validate
  - graph build
  - fallback
- Prefer small files with one clear responsibility.

## How to work in this repo
When asked to fix generation bugs:
1. First inspect current flow.
2. Explain the failure point clearly.
3. Propose the smallest safe fix.
4. Add or update tests for the bug.
5. Avoid broad rewrites unless requested.

---

## AI Orchestration Rules
これ以降は Claude が Issue を実装する場合・PR をレビューする場合のルールです。

### 実装前チェック
- Issue を読んで「何を変えるか」「何を変えないか」をまず明示すること
- 数学生成ロジック・英語生成ロジック・課金ロジックには、Issue に明示されない限り触れない
- frontend/ は Issue に明示されない限り変更しない
- lib/questionValidator.js (Final Gate) は破壊的変更禁止

### 最小安全変更の原則
- 変更は要求されたスコープに閉じる
- 既存テストを壊さない（`node tests/run.mjs` で確認）
- 新しい動作には必ずテストを追加する
- `node scripts/preflight.mjs` を通してから PR を出す

### PR の出し方
- ブランチ名: `claude/<issue番号>-<short-slug>`（例: `claude/42-fix-parallel-angle`）
- PR タイトル: `fix:` / `feat:` / `refactor:` のプレフィックスをつける
- PR テンプレの全チェックボックスを埋めてから draft → ready に変更する

### してはいけないこと
- git push --force
- ANTHROPIC_API_KEY / OPENAI_API_KEY などの secrets をコードに書く
- frontend/dist/ をコミットに含める（ビルド成果物）
- 既存テストを削除してテストを通す
- TODO/FIXME のまま PR を出す
