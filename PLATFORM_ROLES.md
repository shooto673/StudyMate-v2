# StudyMate v2 — プラットフォーム役割定義

## 全体構成図

```
あなた（指揮者）
    │
    ├─ ChatGPT ──────────── 設計・整理・指示書作成
    ├─ Claude Code ────────── 実装・バグ修正・リファクタ
    ├─ Claude Workflow ─────── Issue → 自動実装 → PR（試験運用中）
    ├─ VSCode ─────────────── 作業台・差分確認・コミット操作
    ├─ GitHub ─────────────── コード管理・Issue・PR・CI
    └─ Vercel ─────────────── 自動デプロイ・ログ・ロールバック
```

---

## 各プラットフォームの役割

---

### 🧠 ChatGPT — 参謀・進行管理

**担当する仕事**
- 週次の進捗整理と次アクションの言語化
- GitHub Issueの文章作成（テンプレートを埋める）
- Claude Codeに渡すプロンプトの設計
- テスト項目リストの作成
- 技術的な選択肢の比較・壁打ち
- このドキュメントの更新内容の案出し

**渡す情報**
- 現状分析ドキュメント（StudyMate v2 現状全体分析）
- 直近のgit log（`git log --oneline -10`）
- 解決したい課題の概要

**渡さない情報**
- 実際のコード（コード操作はClaude Codeが担う）

---

### 🤖 Claude Code — 実装者（主力）

**担当する仕事**
- コードの実装・修正・リファクタリング
- バグの特定と修正
- テストの追加・修正
- CLAUDE.mdを参照した文脈理解
- コミットメッセージの生成

**起動方法**
```bash
cd ~/StudyMate-v2
claude   # VSCodeのターミナルから
```

**渡す情報のテンプレート（ChatGPTに作成依頼）**
```
【現状】CLAUDE.mdを読んで現状を把握してください。
【目的】〇〇を実装したい / 〇〇のバグを修正したい
【対象モジュール】lib/〇〇.js
【制約】
  - ESM必須（requireを使わない）
  - api/generate.jsに新ロジックを追加しない
  - questionValidator.jsのルールを弱体化しない
  - 修正後にnpm testが全パスすること
【完了条件】〇〇が動作し、npm run prepushがパスすること
```

**Claude Codeのリミット対策**
- 重い設計・方針判断はChatGPTに先にやらせる
- CLAUDE.mdを最新に保つことでコンテキスト説明を最小化
- セッション終了前に「今日の変更をCLAUDE.mdに反映すべき点は？」と聞く

---

### 🤖 Claude Workflow（GitHub Actions）— 自動実装者（試験運用中）

**担当する仕事**
- `claude-implement`ラベルが付いたIssueを自動で実装してPRを作成

**現状ステータス**：🟡 調整中（5回の修正後、実動作未確認）

**使い方**
1. GitHubでIssueを作成（テンプレートの「Claude Codeへの実装指示」欄を詳細に書く）
2. `claude-implement`ラベルを付ける
3. Claude WorkflowがPRを自動生成するのを待つ
4. PRのVercel PreviewURLで動作確認 → マージ

**⚠️ 今すぐやること**
```
テストIssueを1つ作成してclaude-implementラベルをつけ、
PRが出るか確認する（優先度2タスク）
```

---

### 🖥 VSCode — 作業台・確認場所

**担当する仕事**
- Claude Codeが変更したファイルの差分確認（ソース管理パネル）
- ターミナルの分割運用
- GitのGUI操作（commit・push）
- エラー確認（Error Lens拡張）

**推奨ターミナル分割**
```
ターミナル① → npm run dev（開発サーバー常時起動）
ターミナル② → claude（Claude Code起動）
ターミナル③ → git操作・npm test
```

**必須拡張機能**（入っていない場合は入れる）
- ESLint、Prettier、GitLens、GitHub Pull Requests、Tailwind CSS IntelliSense

---

### 🐙 GitHub — コード管理・タスク管理

**担当する仕事**
- コードの全履歴保管（main = 本番、feature/* = 作業用）
- Issue管理（3種類のテンプレートを使用）
- PRレビューとマージ
- CI自動実行（push/PRごとに207件のテストが走る）

**ブランチ運用ルール**
```
main          ← 本番。直接pushは禁止。PRからのみマージ。
feature/xxx   ← 作業ブランチ。Claude Codeで変更 → PR → マージ
```

**Issueテンプレート（.github/ISSUE_TEMPLATE/）**
- `bug_report.md` → バグ報告
- `feature_request.md` → 機能追加
- `solver_expansion.md` → solver-first拡張

**CI確認方法**
- GitHub → Actions タブ → 最新のワークフロー実行結果

---

### 🚀 Vercel — デプロイ・ログ・ロールバック

**担当する仕事**
- mainマージ → 本番自動デプロイ
- PR作成 → Previewデプロイ（テスト用URL自動発行）
- Vercel Functions ログ（バックエンドAPIのエラー確認）
- ロールバック（本番バグ時に前バージョンへ即時切り戻し）

**ログ確認方法（最重要）**
```
Vercel Dashboard → プロジェクト → Functions タブ
→ 「ERR_MODULE_NOT_FOUND」「Error:」がないか確認
```

**緊急ロールバック手順**
```
Vercel Dashboard → Deployments → 正常だったバージョンを選択
→ 「Promote to Production」→ 即時切り戻し完了
```

---

## 今週の最優先タスク

### 🔴 優先度1：本番スモークテスト（今日中）

| 確認項目 | 経路 | 確認方法 |
|---|---|---|
| 中3 → 円 → 円周角の定理 | solver-first経路 | 実際にアプリで解く |
| 中2 → 1次関数 | LLM → sanitize → Stage2 | 実際にアプリで解く |
| 中1 → 英語 → be動詞 | 非数学経路 | 実際にアプリで解く |
| Vercel Functionsログ | - | Vercel Dashboard確認 |

### 🟡 優先度2：Claude Workflow動作確認（今週中）

```
1. GitHubで軽いIssueを1つ作成
   例タイトル: "fix: frontend/dist/index.htmlをgit untrackedにする"
2. claude-implementラベルを付ける
3. claude.ymlが起動するか → Actionsタブで確認
4. PRが自動生成されるか確認
```

---

## ドキュメント更新ルール

| 状況 | 更新するドキュメント |
|---|---|
| 新モジュールを追加した | CLAUDE.md のモジュール責任マップ |
| solver-firstの対象ユニットを追加した | CLAUDE.md の solver_required ユニット欄 |
| リスクが解消した | CLAUDE.md の既知リスク欄 |
| 優先度タスクが完了した | CLAUDE.md の優先度付きタスク欄 |
| ブランチ運用を変更した | このドキュメントのGitHub欄 |
