#!/bin/sh

# Docker用エントリーポイントスクリプト
# MCPサーバーの起動前処理とヘルスチェックを行います

set -e

echo "Starting Conflux MCP Server..."

# 環境変数の確認
if [ -z "$DEFAULT_LLM_PROVIDER" ]; then
  echo "Warning: DEFAULT_LLM_PROVIDER not set, using default: openai"
  export DEFAULT_LLM_PROVIDER=openai
fi

# ログディレクトリの作成
mkdir -p /app/logs

# 権限の設定
chown -R conflux:nodejs /app/logs

# ビルド済みファイルの確認
if [ ! -f "/app/dist/mcp/server.js" ]; then
  echo "Error: MCP server not found at /app/dist/mcp/server.js"
  echo "Please ensure the application is built before running the container"
  exit 1
fi

# ヘルスチェックの実行
echo "Running health check..."
node /app/scripts/docker-healthcheck.js

if [ $? -eq 0 ]; then
  echo "Health check passed. Starting MCP server..."
  exec node /app/dist/mcp/server.js
else
  echo "Health check failed. Exiting..."
  exit 1
fi
