# Docker 使用方法

Conflux MCP ServerをDockerで実行する方法を説明します。

## 概要

Confluxは9つの思考法を組み合わせたマルチエージェントシステムです。Dockerコンテナとして実行することで、本番環境での使用に最適化された環境を提供します。

## 関連ドキュメント

- [アーキテクチャ設計](architecture.md) - システムのアーキテクチャ概要
- [MCP Server Setup](mcp-server-setup.md) - MCPサーバーのセットアップ方法
- [思考法の使い方](思考法の使い方.md) - 思考法の詳細説明

## 前提条件

- Docker 20.10以上
- Docker Compose 2.0以上

## 環境変数の設定

`.env`ファイルを作成し、必要なAPIキーを設定してください：

```bash
# .env
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
DEFAULT_LLM_PROVIDER=openai
LOG_LEVEL=info
```

## 基本的な使用方法

### 1. Docker Composeを使用（推奨）

```bash
# ビルドして起動
pnpm run docker:compose

# ログを確認
pnpm run docker:logs

# 停止
pnpm run docker:compose:down
```

### 2. Dockerコマンドを直接使用

```bash
# イメージをビルド
pnpm run docker:build

# コンテナを実行
pnpm run docker:run
```

## 高度な設定

### リソース制限

`docker-compose.yml`でメモリ制限を設定できます：

```yaml
deploy:
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 256M
```

### ログの永続化

ログは`./logs`ディレクトリに保存されます：

```bash
# ログディレクトリを確認
ls -la logs/
```

### ヘルスチェック

コンテナの健全性は自動的にチェックされます：

```bash
# ヘルスステータスを確認
docker ps
```

## トラブルシューティング

### よくある問題

1. **APIキーが設定されていない**
   - `.env`ファイルが正しく設定されているか確認
   - 環境変数がコンテナに渡されているか確認

2. **ビルドエラー**
   - `pnpm run build`が正常に完了しているか確認
   - TypeScriptのコンパイルエラーがないか確認

3. **起動エラー**
   - ログを確認：`pnpm run docker:logs`
   - ヘルスチェックの結果を確認

### デバッグ方法

```bash
# コンテナ内でシェルを実行
docker exec -it <container_name> sh

# ログをリアルタイムで確認
docker logs -f <container_name>

# 環境変数を確認
docker exec <container_name> env
```

## セキュリティ考慮事項

- 非rootユーザー（conflux）で実行
- 最小限の権限でコンテナを実行
- 機密情報は環境変数で管理
- ログファイルの適切な権限設定

## パフォーマンス最適化

- マルチステージビルドでイメージサイズを最小化
- 本番環境では不要なファイルを除外
- 適切なリソース制限を設定
- ヘルスチェックで異常を早期検出
