# StudyMate PR Review Criteria

Claude・人間レビュアー共通のチェックリストです。
PR レビューを行う際は、このファイルの観点に沿って確認してください。

## 必須チェック（1つでも NG なら approve 禁止）

### 正確性
- [ ] 正解 choices[correctIndex] === correctAnswer が成立している
- [ ] explanation の結論数値が correctAnswer と一致している
- [ ] 数学的に間違った問題が生成されるパスが追加されていない

### テスト
- [ ] `node tests/run.mjs` がすべて pass している
- [ ] 変更した動作に対応するテストが追加または更新されている
- [ ] テストを削除して pass させていない

### 後退なし
- [ ] lib/questionValidator.js の CRITICAL 判定ルールが弱体化していない
- [ ] solver-first 経路が LLM 経路に差し替えられていない
- [ ] frontend/ が「render only」の原則を破っていない

### セキュリティ・secrets
- [ ] API キーや環境変数がコードにハードコードされていない
- [ ] frontend/dist/ がコミットに含まれていない

---

## 推奨チェック（issue スコープ次第で適用）

### 数学図形
- [ ] 問われている辺・角度が図に表示されていない（答えを見せていない）
- [ ] graphData が無効な場合にテキストのみに degradeする
- [ ] circle 問題が validator Rule 9 で保護されている

### リファクタ
- [ ] api/generate.js が肥大化していない（新ロジックは lib/ に分離）
- [ ] 移動した関数が verbatim コピーであり、ロジック変更がない

### パフォーマンス
- [ ] Vercel Serverless の maxDuration を超える同期処理を追加していない

---

## レビュアーへの注意

- "LGTM" だけのコメントは避ける。具体的な確認点を1つ以上書く
- 数学的正確性の確認は、テストだけでなく問題例を1つ手動で確認するのが望ましい
- 迷ったら approve せず Request Changes + 質問コメントを残す
