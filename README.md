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
3. Renderの公開URLを、BETTER_AUTH_URLへ設定して再デプロイします。
4. `https://<your-service>.onrender.com/api/health`が200を返すことを確認します。

詳細は[Render配備ガイド](docs/render-deployment.md)を参照してください。

## ドキュメント

- [アーキテクチャ](docs/architecture.md)
- [データベース設定](docs/database.md)
- [Render配備](docs/render-deployment.md)
- [Dockerセルフホスト](docs/self-hosting.md)




## 認証・DB接続の運用

`src/lib/env.ts`で設定を検証し、未設定・不正な設定は起動時に停止します。開発環境も`DATABASE_URL`、`BETTER_AUTH_URL`、32文字以上のランダムな`BETTER_AUTH_SECRET`が必須です。本番の認証URLは公開HTTPSオリジンを指定してください。固定シークレットやダミーDBへの実行時フォールバックはありません。ブラウザの認証クライアントは現在のオリジンを利用します。

RenderではEnvironmentにNeonから取得した`DATABASE_URL`（`sslmode=require`を保持）と公開URLの`BETTER_AUTH_URL`を設定します。Blueprintは`BETTER_AUTH_SECRET`を生成します。既存サービスでは3変数が実際に設定されていることを確認してください。URLやシークレットの実値はログ・Git・Dockerビルド引数へ出さないでください。

Prisma Clientは`@prisma/adapter-pg`経由でTCP接続します。ランタイムにはNeonのpooler URLを利用でき、Prisma CLIには任意の`DIRECT_URL`で直接接続を指定できます。接続待ちは10秒、プールは最大10接続です。接続不能の場合はNeonの稼働状態、URL、認証情報、Renderからのネットワーク接続を確認してください。

本番配備は`npm ci` → `npm run prisma:generate` → `npm run prisma:deploy` → アプリ起動の順で行います。`npm run build`のprebuildでもClientを生成しますが、マイグレーションは実行しません。RenderのDockerランタイムにはPrisma CLIを含めないため、リリース前にCIまたは管理端末から対象DBへ`prisma:deploy`を実行してください。Dockerのビルド専用値はRUN内だけで使われ、実行時の設定にはなりません。

`/api/health`は`SELECT 1`でDB疎通を確認し、正常時200、DB障害時503を返します（テーブルやマイグレーションの検証は別途必要）。認証の内部500・DB障害は利用者向けの503に変換し、入力・認証情報のエラーはBetter Authの応答を保持します。内部ログは処理名とエラー分類のみで、SQL・接続文字列・パスワード・メール・スタックを記録しません。
