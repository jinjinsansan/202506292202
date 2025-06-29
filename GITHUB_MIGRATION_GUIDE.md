# GitHubリポジトリ作成手順

## 1. GitHubでリポジトリを作成

1. GitHubにログインします
2. 右上の「+」ボタンをクリックし、「New repository」を選択します
3. 以下の情報を入力します：
   - Repository name: `kanjou-nikki`（または希望の名前）
   - Description: `感情日記アプリ - 自己肯定感を育てるテープ式心理学アプリ`
   - Visibility: Private（推奨）またはPublic
4. 「Create repository」ボタンをクリックします

## 2. ローカルリポジトリをGitHubにプッシュ

以下のコマンドを実行してリポジトリをGitHubにプッシュします：

```bash
# すべてのファイルをステージング
git add .

# 初回コミット
git commit -m "初回コミット: 感情日記アプリ - 完全版"

# リモートリポジトリを追加（URLを自分のリポジトリに置き換え）
git remote add origin https://github.com/YOUR_USERNAME/kanjou-nikki.git

# メインブランチにプッシュ
git branch -M main
git push -u origin main
```

## 3. 環境変数の設定

GitHubリポジトリには`.env`ファイルは含まれていません。以下の手順で環境変数を設定してください：

1. `.env.example`をコピーして`.env`を作成
2. Supabaseの設定値を入力
3. 必要に応じてローカルモードやメンテナンスモードの設定を追加

```env
# Supabase設定
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# ローカルモード設定（オプション）
VITE_LOCAL_MODE=false

# メンテナンスモード設定（オプション）
VITE_MAINTENANCE_MODE=false
VITE_MAINTENANCE_MESSAGE=システムメンテナンス中です
VITE_MAINTENANCE_END_TIME=2025-01-22T10:00:00Z
```

## 4. README.mdの更新

リポジトリのREADME.mdを以下の内容で更新することをお勧めします：

```markdown
# かんじょうにっき - 感情日記アプリ

一般社団法人NAMIDAサポート協会が提唱するテープ式心理学に基づいた、自己肯定感を育てる感情日記アプリです。

## 🌟 主な機能

- 8種類のネガティブ感情と4種類のポジティブ感情の記録・分析
- 無価値感推移のグラフ表示
- 高度な検索機能
- カウンセラー管理画面
- 自動同期機能
- 同意履歴管理
- デバイス認証システム
- カウンセラーコメント機能
- データバックアップ・復元機能
- SNSシェア機能（X/Twitter対応）

## 🚀 技術スタック

- React + TypeScript
- Tailwind CSS
- Supabase
- Vite

## 📦 セットアップ

```bash
npm install
cp .env.example .env
# .env ファイルを編集
npm run dev
```

## 📄 ライセンス

一般社団法人NAMIDAサポート協会
```

## 5. GitHub Actionsの設定（オプション）

自動デプロイを設定する場合は、`.github/workflows/deploy.yml`を作成：

```yaml
name: Deploy to Netlify

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm install
    - name: Build
      run: npm run build
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
    - name: Deploy to Netlify
      uses: nwtgck/actions-netlify@v1.2
      with:
        publish-dir: './dist'
        production-branch: main
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 6. 協力者の招待

チーム開発の場合：
1. GitHub リポジトリの「Settings」→「Manage access」
2. 「Invite a collaborator」で協力者を招待
3. 適切な権限を設定

## 7. ブランチ戦略

推奨ブランチ戦略：
- `main`: 本番環境用
- `develop`: 開発環境用
- `feature/*`: 機能開発用

## 8. Issue テンプレートの作成

`.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: バグレポート
about: バグを報告する
title: '[BUG] '
labels: bug
assignees: ''
---

## バグの説明
バグの内容を簡潔に説明してください。

## 再現手順
1. '...' に移動
2. '...' をクリック
3. '...' まで下にスクロール
4. エラーを確認

## 期待される動作
何が起こるべきだったかを説明してください。

## スクリーンショット
可能であれば、問題を説明するスクリーンショットを追加してください。

## 環境
- OS: [例: iOS]
- ブラウザ: [例: chrome, safari]
- バージョン: [例: 22]
```

## 9. プルリクエストテンプレート

`.github/pull_request_template.md`:

```markdown
## 変更内容
この PR で何を変更したかを説明してください。

## 変更の種類
- [ ] バグ修正
- [ ] 新機能
- [ ] 破壊的変更
- [ ] ドキュメント更新

## テスト
- [ ] 既存のテストが通ることを確認
- [ ] 新しいテストを追加（該当する場合）

## チェックリスト
- [ ] コードレビューの準備ができている
- [ ] 自己レビューを実施済み
- [ ] 関連するドキュメントを更新済み
```

## 10. 移行後の確認事項

1. **環境確認**: `npm run dev`でローカル環境が正常に動作することを確認
2. **Supabase接続**: 環境変数を設定してSupabase接続を確認
3. **自動同期テスト**: 新しいユーザーでアプリを開いて自動同期をテスト
4. **機能テスト**: 日記作成、検索、管理画面の動作確認
5. **カウンセラーログイン**: 管理画面へのアクセス確認
6. **デバイス認証**: 管理画面の「デバイス認証」「セキュリティ」タブの確認
7. **カウンセラーコメント**: コメント表示機能の確認
8. **データバックアップ**: バックアップ作成と復元機能の確認
9. **シェア機能**: プレビュー表示とX/Twitterシェア機能の確認
10. **日記削除機能**: 管理画面からの日記削除機能の確認

これでGitHubへの移行が完了します！