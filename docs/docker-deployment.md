# Docker Deployment Guide

Conflux MCPサーバーをDockerコンテナとしてデプロイする方法を説明します。

## 前提条件

- Docker 20.10以上
- Docker Compose 2.0以上

## 環境変数の設定

### 1. 環境変数ファイルの作成

```bash
# .env.docker ファイルを作成
cp .env.docker.example .env.docker
```

### 2. 必要な環境変数を設定

```bash
# .env.docker ファイルを編集
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
DEFAULT_LLM_PROVIDER=openai
```

## デプロイメント方法

### 方法1: Docker Composeを使用（推奨）

```bash
# 環境変数ファイルを指定して起動
docker-compose --env-file .env.docker up --build

# バックグラウンドで実行
docker-compose --env-file .env.docker up -d --build
```

### 方法2: Dockerコマンドを直接使用

```bash
# イメージをビルド
docker build -t conflux-mcp .

# 環境変数を指定して実行
docker run -it --rm \
  -e OPENAI_API_KEY=your_api_key \
  -e DEFAULT_LLM_PROVIDER=openai \
  conflux-mcp
```

## 設定オプション

### 環境変数

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `OPENAI_API_KEY` | OpenAI APIキー | - |
| `ANTHROPIC_API_KEY` | Anthropic APIキー | - |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google APIキー | - |
| `DEFAULT_LLM_PROVIDER` | デフォルトLLMプロバイダー | `openai` |
| `NODE_ENV` | 実行環境 | `production` |

### Docker Compose設定

- **stdin_open**: MCPサーバーのstdio通信を有効化
- **tty**: ターミナル割り当てを有効化
- **restart**: 自動再起動ポリシー

## トラブルシューティング

### 1. ビルドエラー

```bash
# キャッシュをクリアしてビルド
docker-compose build --no-cache
```

### 2. 環境変数が読み込まれない

```bash
# 環境変数ファイルのパスを確認
docker-compose --env-file .env.docker config
```

### 3. ログの確認

```bash
# コンテナのログを確認
docker-compose logs -f mcp-server
```

## 本番環境での使用

### 1. セキュリティ設定

- 非rootユーザーで実行
- 最小限の依存関係のみインストール
- マルチステージビルドでイメージサイズを最適化

### 2. リソース制限

```yaml
# docker-compose.yml に追加
services:
  mcp-server:
    # ... 既存の設定
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

### 3. ヘルスチェック

```yaml
# docker-compose.yml に追加
services:
  mcp-server:
    # ... 既存の設定
    healthcheck:
      test: ["CMD", "node", "-e", "process.exit(0)"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 開発環境での使用

### 1. ホットリロード

```bash
# 開発用のdocker-compose.override.yml を作成
version: '3.8'
services:
  mcp-server:
    volumes:
      - .:/app
    command: ["pnpm", "run", "mcp-server"]
```

### 2. デバッグ

```bash
# デバッグモードで実行
docker-compose run --rm mcp-server pnpm run dev
```
