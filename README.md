# Chronicle

Chronicleは、ソフトウェア開発における意思決定の背景をイベントソーシングで記録し、グラフとしてたどれるWebアプリケーションです。

Gitが「コードの何を変更したか」を管理するのに対して、Chronicleは「なぜその判断をしたか」「どの選択肢を検討したか」「その後どのように変化したか」を管理します。

## 主な機能

- メールアドレスとパスワードによる登録・ログイン
- プロジェクトごとの意思決定、選択肢、判断理由、状態の記録
- 依存・競合・置換・関連といった意思決定間の関係管理
- すべての変更を上書きせず、イベントとして追記保存
- 指定したバージョン時点の状態復元と、現在との比較
- React Flowによる意思決定グラフの可視化

## 技術構成

- Next.js / TypeScript / Tailwind CSS
- Hono
- Better Auth
- Prisma / Neon PostgreSQL
- React Flow
- Vitest
- Vercel

## ローカル開発

必要なものは Node.js 22以上、npm、Neon PostgreSQLのデータベースです。

1. `npm ci` で依存関係をインストールします。
2. `.env.example` を参照して `.env.local` に環境変数を設定します。接続文字列や秘密情報はGitへ追加しません。
3. `npm run prisma:deploy` で初期スキーマを適用します。
4. `npm run dev` で開発サーバーを起動します。

`http://localhost:3000` を開き、新しいアカウントを登録できます。

## 環境変数

| 変数名 | 必須 | 用途 |
| --- | --- | --- |
| `DATABASE_URL` | はい | Neon PostgreSQLの接続文字列 |
| `BETTER_AUTH_SECRET` | はい | 認証データの署名に使う十分に長いランダム値 |
| `BETTER_AUTH_URL` | はい | アプリケーションの正規URL |
| `NEXT_PUBLIC_APP_URL` | はい | ブラウザ側Better Authクライアントが使う公開URL |
| `SHADOW_DATABASE_URL` | 開発時 | Prismaの開発用ワークフローで使う別DBまたはNeonブランチ |

## コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバーを起動 |
| `npm run prisma:deploy` | コミット済みマイグレーションを適用 |
| `npm run prisma:migrate` | 開発用マイグレーションを作成 |
| `npm test` | 単体テストを実行 |
| `npm run typecheck` | TypeScript strictモードの型検査 |
| `npm run lint` | ESLintを実行 |
| `npm run build` | 本番ビルドを作成 |

## 設計

認証情報はBetter Authが通常のリレーショナルデータとして管理します。一方、プロジェクトの意思決定は上書きしません。`event`テーブルへ追記したイベントをバージョン順に適用し、現在または過去の状態を再構築します。

書き込み側はコマンドとして入力値・認可・楽観ロックを検証してからイベントを追加します。読み取り側はイベントをリプレイして状態・比較結果・グラフを返します。

## Dockerによるセルフホスト

Vercelを使えない場合でも、Docker Composeが動く環境なら起動できます。DBマイグレーションを適用してから、アプリコンテナを起動します。

```sh
docker compose --profile migration run --rm migrate
docker compose up --build -d app
```

詳しくは[アーキテクチャ](docs/architecture.md)、[データベース設定](docs/database.md)、[Vercel配備](docs/deployment.md)、[Dockerセルフホスト](docs/self-hosting.md)を参照してください。

## Renderへの配備

Vercelを使わず公開する場合は、RenderのDocker Web Serviceとして配備できます。リポジトリに含まれる`render.yaml`を使ってBlueprintを作成し、Neon接続文字列と公開URLをRenderの環境変数へ設定します。

具体的な設定は[Render配備](docs/render-deployment.md)を参照してください。
