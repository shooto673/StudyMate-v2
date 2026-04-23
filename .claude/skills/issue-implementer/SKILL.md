---
name: issue-implementer
description: GitHub Issue を安全に実装する。バグ修正・機能追加のどちらにも使える。StudyMate 固有の制約（数学正確性・validation ルール・テスト必須）を守りながら最小スコープで実装する。
---

# Issue Implementer Skill

## Goal
GitHub Issue に記載された変更を、StudyMate の安全ルールを守りながら実装し、
テスト付きの PR を作成する。

## 作業手順

### Step 1: Issue を読んで作業範囲を確定する
- Issue の「影響範囲」「バグの種類」「提案内容」を確認
- 変更するファイルと変更しないファイルを明示する
- 数学生成・英語生成・課金ロジックへの影響がないか確認する

### Step 2: 現在のコードを調査する
- 変更前に関連ファイルを Read して現状を把握する
- テスト済みの動作をリグレッションしないか確認する
- lib/questionValidator.js の CRITICAL ルールを壊す変更でないことを確認する

### Step 3: 最小安全変更を実装する
- Issue スコープ外のコードには触れない
- 新しいロジックは lib/ に分離する（api/generate.js を肥大化させない）
- verbatim コピーで関数を移動する場合はロジックを変えない

### Step 4: テストを追加・更新する
- 変更した動作に対応するテストを tests/ に追加する
- node tests/run.mjs を実行して全 pass を確認する
- node scripts/preflight.mjs を実行して import の整合性を確認する

### Step 5: PR を作成する
- ブランチ名: claude/<issue番号>-<slug>
- .github/PULL_REQUEST_TEMPLATE.md の全チェックボックスを埋める
- テスト結果（X passed, 0 failed）をPR本文に記載する

## やってはいけないこと
- \`git push --force\`
- frontend/dist/ をコミットに含める
- API キー・secrets をコードに書く
- 既存テストを削除してテストを通す
- lib/questionValidator.js の CRITICAL ルールを弱体化する
- Issue スコープ外の「ついで修正」を含める（別 Issue にする）

## 出力の確認方法
1. \`node tests/run.mjs\` が全 pass
2. \`node scripts/preflight.mjs\` が pass
3. PR の安全チェックリストが全チェック済み
