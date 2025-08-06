# シフトスケジューラー v2

このプロジェクトは、従業員のシフト管理を行うWebアプリケーションです。

## 機能

- 従業員と管理者のログイン/登録
- シフトの作成・管理
- シフトリクエストの提出・承認
- 従業員管理
- 管理者ダッシュボード

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 環境変数の設定

`.env`ファイルを作成し、以下の環境変数を設定してください：

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/shift_scheduler"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Admin Registration
ADMIN_REGISTRATION_CODE="your-admin-registration-code"
```

### 3. データベースのセットアップ

```bash
# データベースマイグレーション
pnpm prisma migrate dev

# シードデータの投入
pnpm prisma db seed
```

### 4. 開発サーバーの起動

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000) でアプリケーションにアクセスできます。

## 管理者登録

管理者アカウントを作成するには：

1. `/admin/register` にアクセス
2. 必要な情報を入力
3. 環境変数で設定した `ADMIN_REGISTRATION_CODE` を入力
4. 登録完了後、ログインページでログイン

## デフォルトアカウント

シードデータにより、以下のデフォルトアカウントが作成されます：

- **管理者**: admin@example.com / password123
- **従業員**: 新規登録で作成可能

## 技術スタック

- **フレームワーク**: Next.js 15
- **データベース**: PostgreSQL + Prisma
- **認証**: NextAuth.js
- **スタイリング**: Tailwind CSS
- **UI**: React + TypeScript

## Vercelデプロイ

### 1. Vercel CLIのインストール

```bash
npm i -g vercel
```

### 2. プロジェクトのデプロイ

```bash
# Vercelにログイン
vercel login

# プロジェクトをデプロイ
vercel

# 本番環境にデプロイ
vercel --prod
```

### 3. 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定してください：

```env
# Database
DATABASE_URL="your-postgresql-connection-string"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="https://your-domain.vercel.app"

# Admin Registration
ADMIN_REGISTRATION_CODE="your-admin-registration-code"
```

### 4. データベースのセットアップ

1. Vercel Postgresまたは外部のPostgreSQLデータベースを設定
2. `DATABASE_URL`環境変数を設定
3. デプロイ時に自動的にマイグレーションが実行されます

### 5. カスタムドメインの設定（オプション）

Vercelダッシュボードでカスタムドメインを設定できます。
