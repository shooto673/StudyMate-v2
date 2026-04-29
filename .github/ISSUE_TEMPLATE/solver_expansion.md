---
name: Solver拡張（図形ユニット追加）
about: LLM経路からsolver-firstに切り替えるユニット追加
title: "feat: solver追加 - "
labels: solver-expansion
assignees: ""
---

## 対象ユニット

- **学年**: 中1 / 中2 / 中3
- **分野**: 
- **サブユニット名**（classifier.jsのキー）: 

## 現状の経路

現在このユニットは **LLM経路**（Claude Haiku → sanitize → validate → Stage 2）で生成されている。

**リスク**: LLMが誤った図形ラベル・不正な答えを生成する可能性がある。

## solver実装方針

**生成すべき問題パターン**（具体的に列挙）
1. 
2. 
3. 

**必要なgraphData構造**
```javascript
{
  type: "",
  points: [],
  // ...
}
```

**参考にする既存solver**
- `lib/mathSolvers.js` の `GENERATORS.thales_theorem`
- `lib/buildGraphFromSpec.js` の対応関数

## 実装チェックリスト

### lib/mathSolvers.js
- [ ] `GENERATORS['新ユニット名']` を追加
- [ ] 決定論的な問題生成（ランダムシードで再現可能）
- [ ] 答えが数値的に正しいことを確認

### lib/buildGraphFromSpec.js
- [ ] solver specからgraphDataへの変換関数を追加
- [ ] 座標計算が正確か確認

### lib/classifier.js
- [ ] `SUBUNIT_MATRIX` に新ユニットを追加
- [ ] `solver_required: true` を設定

### tests/
- [ ] `solverAndValidator` にテストケースを追加
- [ ] `figureFixes` にリグレッションテストを追加
- [ ] `npm test` 全パス確認

## 完了条件

- [ ] 上記チェックリスト全完了
- [ ] `npm run prepush` パス
- [ ] 本番スモークテスト実施（対象ユニットを実際に解いて確認）
