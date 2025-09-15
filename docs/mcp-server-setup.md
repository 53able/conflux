# MCP Server Setup and Configuration

Conflux MCP Serverのセットアップと設定方法を説明します。

**パッケージ名**: @53able/conflux  
**現在のバージョン**: 0.3.1  
**最新バージョン**: [GitHub Releases](https://github.com/53able/conflux/releases)を参照

## 概要

Confluxは9つの思考法を組み合わせたマルチエージェントシステムです。MCPサーバーとして動作し、AI開発環境と統合して思考プロセスを支援します。

## Prerequisites

- Node.js 20+ and pnpm (for local development)
- TypeScript 5.6+ (for development)

**Dockerを使用する場合は、[Docker使用方法](docker-usage.md)を参照してください。**

## 関連ドキュメント

- [アーキテクチャ設計](architecture.md) - システムのアーキテクチャ概要
- [Docker使用方法](docker-usage.md) - Dockerでの実行方法
- [思考法の使い方](思考法の使い方.md) - 思考法の詳細説明

## Setup Methods

### Method 1: Local Development

#### Setup Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/53able/conflux.git
   cd conflux
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Build the Project**
   ```bash
   pnpm run build
   ```

4. **Set Environment Variables**
   
   `.env` ファイルを作成:
   ```bash
   # .env
   OPENAI_API_KEY=your_openai_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
   DEFAULT_LLM_PROVIDER=openai
   LOG_LEVEL=debug
   NODE_ENV=development
   AI_SDK_DISABLE_TELEMETRY=true
   AI_SDK_VERCEL_AI_GATEWAY_DISABLED=true
   ```
   
   **注意**: 最低1つのAPIキーは必須です。複数のプロバイダーを設定することで、フォールバック機能が利用できます。

5. **Run the MCP Server**
   ```bash
   # Using built version (推奨)
   node dist/mcp/server.js
   
   # Or using npm script
   pnpm run mcp-server
   
   # Or using tsx directly (開発時)
   npx tsx src/mcp/server.ts
   ```

6. **Verify Installation**
   ```bash
   # ヘルスチェック
   curl -X POST http://localhost:3000/health
   
   # ログを確認
   tail -f logs/mcp-server.log
   ```

### 開発用便利コマンド

```bash
# ビルドしてMCPサーバー起動
pnpm run build && node dist/mcp/server.js

# 開発サーバー起動（ホットリロード）
pnpm run dev

# MCPサーバー起動（tsx使用）
pnpm run mcp-server

# 型チェック
pnpm run type-check

# リント
pnpm run lint

# テスト実行
pnpm run test

# ビルド
pnpm run build

# クリーンアップ
pnpm run clean
```

### Method 2: NPM Package (Recommended for Production Use)

```bash
# Install globally
npm install -g @53able/conflux

# Or use npx (no installation required)
npx @53able/conflux server
```

## MCP Server Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key | Recommended | - |
| `ANTHROPIC_API_KEY` | Anthropic API key | Recommended | - |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google API key | Optional | - |
| `DEFAULT_LLM_PROVIDER` | Default LLM provider | Optional | `openai` |
| `NODE_ENV` | Environment | Optional | `production` |
| `AI_SDK_DISABLE_TELEMETRY` | Disable telemetry | Recommended | `true` |
| `AI_SDK_VERCEL_AI_GATEWAY_DISABLED` | Disable Vercel AI Gateway | Recommended | `true` |
| `LOG_LEVEL` | Log level | Optional | `info` |
| `OPENAI_MODEL` | OpenAI model name | Optional | `gpt-5-nano` |
| `ANTHROPIC_MODEL` | Anthropic model name | Optional | `claude-3-5-haiku-latest` |
| `GOOGLE_MODEL` | Google model name | Optional | `gemini-2.5-flash` |

### MCP Server Features

- **stdio通信**: MCPサーバーはstdioベースで動作（ポート不要）
- **自動復旧**: LLMレスポンスのスキーマ不一致時の自動修正
- **自己修復機能**: 入力データの自動修復とバリデーション
- **ログ機能**: Winstonによる構造化ログ出力
- **エラーハンドリング**: 包括的なエラー処理とログ記録
- **AI SDK v5統合**: 最新のAI SDKとの完全統合
- **型安全性**: TypeScript + Zodスキーマによる完全な型安全性
- **関数型アーキテクチャ**: fp-tsを使用した関数型プログラミング
- **複数LLMプロバイダー対応**: OpenAI、Anthropic、Google、OpenAI互換、Mock

## 利用可能なツール

このMCPサーバーは、9つの思考法エージェントを統合した思考プロセスを提供します。

### 1. process-phase
局面に応じた統合思考プロセスを実行します。

**パラメータ:**
- `phase`: 開発の局面（business_exploration, requirement_definition, など）
- `input`: 分析対象の入力データ
- `llmProvider`: LLMプロバイダー設定（オプション）
- `userId`: ユーザーID（オプション）

**例:**
```json
{
  "phase": "requirement_definition",
  "input": {
    "problem": "ユーザー認証システムの要件を定義したい",
    "context": "Webアプリケーションの開発"
  }
}
```

### 2. process-golden-pattern
黄金パターン（探索→実装）の統合思考プロセスを実行します。

**パラメータ:**
- `input`: 分析対象の入力データ
- `llmProvider`: LLMプロバイダー設定（オプション）
- `userId`: ユーザーID（オプション）

**黄金パターンのシーケンス:**
1. abduction（仮説を立てる）
2. deductive（帰結を設計）
3. inductive（データ検証）
4. critical（前提/飛躍を潰す）
5. mece（漏れなく重複なく構造化）
6. logical（論理的道筋を構築）
7. meta（プロセス自体を更新）
8. debate（必要なら意思決定を締める）

### 3. process-single-method
単一の思考法を実行します。

**パラメータ:**
- `method`: 実行する思考法（abduction, logical, deductive, など）
- `input`: 思考法への入力データ
- `llmProvider`: LLMプロバイダー設定（オプション）
- `userId`: ユーザーID（オプション）

### 4. list-thinking-methods
利用可能な思考法の一覧と詳細を取得します。

### 5. get-phase-recommendations
指定した局面に推奨される思考法を取得します。

**パラメータ:**
- `phase`: 開発の局面

### 6. process-custom-strategy
PHASE_THINKING_MAP形式で思考法戦略を指定して実行します。

**パラメータ:**
- `primary`: 主要思考法
- `secondary`: 併用思考法の配列
- `sequence`: 実行する思考法の順序
- `input`: 分析対象の入力データ
- `llmProvider`: LLMプロバイダー設定（オプション）
- `userId`: ユーザーID（オプション）

## 思考法の種類

1. **abduction** - 驚きの事実から説明仮説を形成
2. **logical** - 論点から結論への論理的道筋を構築
3. **critical** - 前提・論点・根拠を体系的に疑い
4. **mece** - 項目を漏れなく重複なく分類
5. **deductive** - 一般的な原則から具体的な結論を導出
6. **inductive** - 個別事例から共通パターンを発見
7. **pac** - 仮説を前提・仮定・結論に分解
8. **meta** - 思考プロセス自体を対象化
9. **debate** - 論題に対する賛成・反対の論点を検討

## Integration with AI Tools

### MCPクライアント設定

#### ローカル開発用設定

**Cursor設定例** (`mcp.json`):
```json
{
  "mcp.servers": {
    "thinking-agents": {
      "command": "node",
      "args": ["/path/to/your/conflux/dist/mcp/server.js"],
      "env": {
        "OPENAI_API_KEY": "your_openai_api_key_here",
        "ANTHROPIC_API_KEY": "your_anthropic_api_key_here",
        "GOOGLE_GENERATIVE_AI_API_KEY": "your_google_api_key_here",
        "DEFAULT_LLM_PROVIDER": "openai",
        "LOG_LEVEL": "debug",
        "NODE_ENV": "development"
      }
    }
  }
}
```

**本番用設定** (`mcp.json`):
```json
{
  "mcp.servers": {
    "thinking-agents": {
      "command": "npx",
      "args": ["@53able/conflux", "server"],
      "env": {
        "OPENAI_API_KEY": "your_openai_api_key_here",
        "ANTHROPIC_API_KEY": "your_anthropic_api_key_here",
        "GOOGLE_GENERATIVE_AI_API_KEY": "your_google_api_key_here",
        "DEFAULT_LLM_PROVIDER": "openai",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

#### Claude Desktop設定例

`claude_desktop_config.json` に追加:
```json
{
  "mcpServers": {
    "thinking-agents": {
      "command": "npx",
      "args": ["@53able/conflux", "server"],
      "env": {
        "OPENAI_API_KEY": "your_openai_api_key_here",
        "ANTHROPIC_API_KEY": "your_anthropic_api_key_here",
        "GOOGLE_GENERATIVE_AI_API_KEY": "your_google_api_key_here",
        "DEFAULT_LLM_PROVIDER": "openai",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

#### その他のMCPクライアント

標準的なMCPプロトコルに準拠しているため、任意のMCPクライアントで使用可能です。

## Troubleshooting

### Common Issues

1. **MCP Server Not Starting**
   ```bash
   # Check logs
   docker compose logs mcp-server
   
   # Check environment variables
   docker compose --env-file .env.docker config
   ```

2. **API Key Issues**
   ```bash
   # Verify environment variables are set
   echo $OPENAI_API_KEY
   
   # Test with a simple command
   npx @53able/conflux list
   ```

3. **Docker Build Issues**
   ```bash
   # Clear Docker cache and rebuild
   docker compose build --no-cache
   
   # Check Dockerfile syntax
   docker build -t conflux-mcp . --no-cache
   ```

4. **"No tools or prompts" エラー**
   - プロジェクトが正しくビルドされているか確認: `pnpm run build`
   - MCPサーバーが正常に起動しているか確認: `node dist/mcp/server.js`
   - 環境変数（LLM APIキーなど）が設定されているか確認
   - fp-tsのインポートパスが正しいか確認（ES modules対応）

5. **fp-ts関連エラー**
   ```bash
   # プロジェクトを再ビルド
   pnpm run build
   
   # 依存関係を再インストール
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   pnpm run build
   ```

6. **自己修復機能の確認**
   - 入力データの形式が正しくない場合、自動的に修復を試行します
   - ログで「Self-healing mechanism activated」メッセージを確認
   - 修復に失敗した場合は、入力データの形式を確認してください

7. **LLMプロバイダー関連エラー**
   ```bash
   # 利用可能なプロバイダーを確認
   echo $OPENAI_API_KEY
   echo $ANTHROPIC_API_KEY
   echo $GOOGLE_GENERATIVE_AI_API_KEY
   
   # デフォルトプロバイダーを明示的に設定
   export DEFAULT_LLM_PROVIDER=openai
   ```

### Logs and Debugging

```bash
# View real-time logs
docker compose logs -f mcp-server

# Check container status
docker ps

# Access container shell
docker exec -it conflux-mcp-server-1 sh
```

## Stopping the Server

```bash
# Stop Docker Compose
docker compose down

# Stop specific container
docker stop conflux-mcp-server-1

# Remove containers and volumes
docker compose down -v
```

## Advanced Configuration

### Custom Docker Compose

Create `docker-compose.override.yml` for custom settings:

```yaml
version: '3.8'
services:
  mcp-server:
    environment:
      - CUSTOM_SETTING=value
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
```

### Development Mode

For development with hot reload:

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  mcp-server:
    volumes:
      - .:/app
    command: ["pnpm", "run", "mcp-server"]
    environment:
      - NODE_ENV=development
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GOOGLE_GENERATIVE_AI_API_KEY=${GOOGLE_GENERATIVE_AI_API_KEY}
      - DEFAULT_LLM_PROVIDER=${DEFAULT_LLM_PROVIDER:-openai}
```

Run with: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up`

### CLI コマンド

MCPサーバー以外にも、CLIコマンドが利用できます：

```bash
# 思考法一覧を表示
npx @53able/conflux list

# 局面別推奨思考法を表示
npx @53able/conflux recommend requirement_definition

# 単一思考法を実行
npx @53able/conflux method logical '{"question": "プロジェクトの優先順位を決めたい"}'

# 局面別思考プロセスを実行
npx @53able/conflux phase requirement_definition '{"problem": "ユーザー認証システムの要件を定義したい"}'
```

