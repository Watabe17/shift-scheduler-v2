#!/bin/bash

# Vercelデプロイスクリプト

echo "🚀 Vercelデプロイを開始します..."

# 依存関係のインストール
echo "📦 依存関係をインストール中..."
pnpm install

# Prismaクライアントの生成
echo "🔧 Prismaクライアントを生成中..."
pnpm prisma generate

# ビルド
echo "🏗️ プロジェクトをビルド中..."
pnpm build

# Vercelにデプロイ
echo "🚀 Vercelにデプロイ中..."
vercel --prod

echo "✅ デプロイが完了しました！" 