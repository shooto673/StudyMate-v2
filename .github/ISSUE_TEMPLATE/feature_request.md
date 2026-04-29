---
name: 機能追加
about: 新機能・改善の提案
title: "feat: "
labels: feature
assignees: ""
---

## 概要


## 背景・目的

なぜこの機能が必要か：

## 実装方針（わかる場合）

**影響するモジュール**（変更前にCLAUDE.mdの責任マップを確認）
- [ ] `api/generate.js`（オーケストレーター）
- [ ] `lib/classifier.js`（分類・routing）
- [ ] `lib/mathSolvers.js`（solver追加）
- [ ] `lib/questionValidator.js`（⚠️ ルール変更は要注意）
- [ ] `lib/sanitizeQuestion.js`
- [ ] `lib/stage2GraphMerge.js`
- [ ] `frontend/`（フロントエンド）
- [ ] `.github/workflows/`（CI/CD）

**新規モジュールが必要か**
- [ ] はい（`lib/` に分離して追加）
- [ ] いいえ（既存モジュールの修正のみ）

## 完了条件

- [ ] 機能が動作する
- [ ] `npm test` が全パス（207件以上）
- [ ] 新規ロジックにテストを追加済み
- [ ] `npm run prepush` がパス
- [ ] Vercel Previewで動作確認済み

## Claude Codeへの実装指示

（このIssueをClaude Workflowで実装する場合、ここに詳細な指示を書く）

```
【現状】
【目的】
【実装方針】
【制約】ESM必須。api/generate.jsを肥大化させない。
【完了条件】
```
