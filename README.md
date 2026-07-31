# Chronicle

Chronicleは、ソフトウェア開発における意思決定の背景を記録するアプリケーションです。

Gitがコードの「何を変更したか」を管理するのに対して、Chronicleは「なぜその判断をしたか」「どの選択肢を検討したか」「あとから何が変わったか」を残します。

## 公開URL

[https://chronicle-v2i4.onrender.com/](https://chronicle-v2i4.onrender.com/)

## できること

- メールアドレスとパスワードによるアカウント登録・ログイン
- プロジェクトごとの意思決定、選択肢、判断理由、状態の記録
- 依存、競合、置換、関連といった意思決定同士の関係管理
- React Flowによる意思決定グラフの可視化
- すべての変更をイベントとして追記保存
- 過去バージョンの状態復元と、現在との差分比較

## 設計の考え方

プロジェクトの状態は上書きしません。変更はすべて`event`テーブルへ追記し、プロジェクトごとに連続した`version`を付与します。

書き込み側はコマンドとして入力・認可・楽観ロックを検証してイベントを追加します。読み取り側はイベントを順番に適用して、現在または指定時点の状態、比較結果、グラフを再構築します。

認証データはBetter Authが通常のリレーショナルデータとして管理し、イベントソーシングの対象には含めません。

## 技術構成

- Next.js / TypeScript / Tailwind CSS
- Hono
- Better Auth
- Prisma / Neon PostgreSQL
- React Flow
- Vitest
- Render / Docker

## ローカルで起動する

Node.js 22以上、npm、Neon PostgreSQLのデータベースが必要です。

```sh
npm ci
npm run prisma:deploy
npm run dev
```

環境変数は`.env.example`を参照して`.env.local`へ設定してください。接続文字列や認証シークレットはGitへ追加しません。

起動後は`http://localhost:3000`を開き、新しいアカウントを登録できます。

## 必要な環境変数

| 変数名 | 用途 |
| --- | --- |
| `DATABASE_URL` | Neon PostgreSQLの接続文字列 |
| `BETTER_AUTH_SECRET` | 認証データの署名に使う十分に長いランダム値 |
| `BETTER_AUTH_URL` | アプリケーションの正規URL |
| `NEXT_PUBLIC_APP_URL` | ブラウザ側Better Authクライアントが使う公開URL |
| `SHADOW_DATABASE_URL` | Prismaの開発用ワークフローで使う別DBまたはNeonブランチ（任意） |

## よく使うコマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバーを起動 |
| `npm run prisma:deploy` | コミット済みマイグレーションを適用 |
| `npm run prisma:migrate` | 開発用マイグレーションを作成 |
| `npm test` | 単体テストを実行 |
| `npm run typecheck` | TypeScriptの型検査を実行 |
| `npm run lint` | ESLintを実行 |
| `npm run build` | 本番ビルドを作成 |

## Renderへ配備する

このリポジトリにはRender Blueprintの`render.yaml`が含まれています。

1. Renderで**New > Blueprint**を選び、このGitHubリポジトリを接続します。
2. `DATABASE_URL`、`BETTER_AUTH_URL`、`NEXT_PUBLIC_APP_URL`をRenderのEnvironment Variablesへ設定します。
3. Renderの公開URLを、URL系の2つの環境変数へ設定して再デプロイします。
4. `https://<your-service>.onrender.com/api/health`が200を返すことを確認します。

詳細は[Render配備ガイド](docs/render-deployment.md)を参照してください。

## ドキュメント

- [アーキテクチャ](docs/architecture.md)
- [データベース設定](docs/database.md)
- [Render配備](docs/render-deployment.md)
- [Dockerセルフホスト](docs/self-hosting.md)


