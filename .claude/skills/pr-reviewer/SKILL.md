---
name: pr-reviewer
description: StudyMate の PR を REVIEW.md の基準に従ってレビューする。数学的正確性・テスト品質・リグレッションの3点を最重視する。
---

# PR Reviewer Skill

## Goal
PR の変更を REVIEW.md のチェックリストに沿って検査し、
approve / request_changes の判断とその根拠をコメントで示す。

## レビュー手順

### Step 1: 変更概要を把握する
- PR の diff を確認して「何が変わったか」をまず整理する
- 変更の種類（fix / feat / refactor）と影響ファイルを確認する

### Step 2: REVIEW.md の必須チェックを実行する
すべての項目を確認し、結果を明記する:
- 正確性チェック（correctAnswer / correctIndex / explanation の整合性）
- テストの有無と品質（追加された？削除されていない？）
- 後退なし（validator / solver-first / frontend が壊れていない）
- セキュリティ（secrets なし / dist なし）

### Step 3: 変更ファイルごとに確認する
- api/ の変更: LLM 呼び出しが増えていないか。エラーハンドリングが適切か
- lib/ の変更: 関数の責任が明確か。verbatim コピーか論理変更かを明示する
- tests/ の変更: テストが実際に動作を検証しているか（形式だけになっていないか）
- frontend/ の変更: render only ルールを守っているか

### Step 4: コメントを書く
以下の形式でコメントする:
Review Result: ✅ APPROVE / ❌ REQUEST CHANGES
確認した項目
完了
node tests/run.mjs: X passed, 0 failed（PR本文より）
完了
scripts/preflight.mjs: pass
完了
validator CRITICAL ルール: 弱体化なし
...
指摘事項（REQUEST CHANGES の場合）
[必須] ファイル名 L行: 問題点と修正案
...
確認できなかった項目
手動確認が必要な項目（〇〇を実機でテストしてください）

## 判断基準
- APPROVE: 必須チェックがすべてクリアで、テストが全 pass
- REQUEST CHANGES: 必須チェックが1つでも NG
- COMMENT のみ: 軽微な提案で blocking しない場合

## やってはいけないこと
- 必須チェックを省略して APPROVE する
- "LGTM" だけのコメントを残す
- 数学的正確性を確認せずに approve する
