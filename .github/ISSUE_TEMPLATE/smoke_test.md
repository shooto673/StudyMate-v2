---
name: 本番スモークテスト（Phase 1+2B後）
about: 989af53以降の本番動作確認チェックリスト
title: "test: 本番スモークテスト Phase1+2B"
labels: smoke-test
assignees: ""
---

## 目的

Phase 1（sanitize分離）・Phase 2B（stage2GraphMerge分離）以降、
本番（Vercel）での実機動作確認がゼロの状態を解消する。

コードとテストは正常（207件全パス）だが、
実際のLLM出力に対する検証が未完了。

## チェックリスト

### 経路① solver-first経路
- [ ] 中3 → 円 → 円周角の定理 で問題が生成される
- [ ] 図が正しく表示される
- [ ] 正解・不正解が正しく判定される
- [ ] Vercel Functionsログにエラーなし

### 経路② LLM経路（Stage 1 + Stage 2）
- [ ] 中2 → 1次関数 で問題が生成される
- [ ] graphData（グラフ）が正しく表示される
- [ ] 正解・不正解が正しく判定される
- [ ] Vercel Functionsログにエラーなし

### 経路③ 非数学経路
- [ ] 中1 → 英語 → be動詞 で問題が生成される
- [ ] 選択肢4つが正しく表示される
- [ ] 正解・不正解が正しく判定される

### インフラ確認
- [ ] Vercel Dashboard → Functions → `ERR_MODULE_NOT_FOUND` がない
- [ ] Vercel Dashboard → Functions → `Error:` が出ていない
- [ ] レスポンスタイムが異常に遅くない（目安: 5秒以内）

## 確認手順

```
1. 本番URL を開く
2. 上記3経路を順番に試す
3. Vercel Dashboard → プロジェクト → Functions タブでログ確認
4. 問題があればVercel Logsのエラーをコピーして別Issueに報告
```

## 結果記録欄

| 経路 | 結果 | 確認日時 | 備考 |
|---|---|---|---|
| solver-first（円周角） | ✅/❌ | | |
| LLM（1次関数） | ✅/❌ | | |
| 非数学（英語） | ✅/❌ | | |
| Functionsログ | ✅/❌ | | |

## 完了条件

全項目✅ → このIssueをClose → CLAUDE.mdの「本番スモークテスト未実施」リスクを🟢に更新
