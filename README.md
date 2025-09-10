# 🧠 Thinking Agents MCP

**Type-safe multi-agent thinking methodology tools for strategic analysis and decision-making**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io/)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

9つの構造化された思考法を組み合わせたマルチエージェントシステムで、開発の各局面に最適な意思決定と分析を支援します。

## ✨ 特徴

- **🎯 局面特化**: 開発の15の局面それぞれに最適化された思考法の組み合わせ
- **🤖 マルチエージェント**: 9つの専門思考法エージェントが連携して動作
- **📊 型安全**: Zodスキーマベースの完全な型安全性
- **🌐 MCP準拠**: Model Context Protocolで他のAIツールと統合可能
- **⚡ 高性能**: TypeScript + tsx による高速実行
- **🎨 美しいCLI**: Commander.jsベースの直感的なコマンドライン
- **🔗 LLM統合**: AI SDK v5で複数のLLMプロバイダーをサポート
- **🛠 自動復旧**: スキーマ不一致やエラー時の自動復旧機能搭載
- **🏢 エンタープライズ対応**: Cursor、Claude Codeなどの開発環境で使用可能

## 🧠 思考法エージェント

| 思考法 | 機能 | 適用場面 |
|--------|------|----------|
| **アブダクション** | 驚きの事実から説明仮説を形成 | 事業探索、デバッグ |
| **ロジカルシンキング** | 論点から結論への論理的道筋を構築 | 要件定義、計画 |
| **クリティカルシンキング** | 前提・論点・根拠を体系的に疑う | リファクタリング、レビュー |
| **MECE** | 漏れなく重複なく分類・整理 | 優先順位付け、設計 |
| **演繹的思考** | 一般原則から具体的結論を導出 | アーキ設計、実装 |
| **帰納的思考** | 個別事例から共通パターンを発見 | 価値検証、実験 |
| **PAC思考** | 前提・仮定・結論に分解して検証 | 仮説分解 |
| **メタ思考** | 思考プロセス自体を評価・改善 | ふりかえり |
| **ディベート思考** | 賛成・反対論点で意思決定支援 | 重要な意思決定 |

## 🚀 クイックスタート

### インストール

```bash
# ライブラリとしてインストール
pnpm install @53able/conflux
# or
npm install @53able/conflux

# MCPサーバーとして使用
npx @53able/conflux server

# CLIツールとして使用
npx @53able/conflux list
```

### 初回セットアップ

```bash
# 1. 思考法一覧を確認（API KEY不要）
npx @53able/conflux list

# 2. API KEYを設定して思考分析を試す
OPENAI_API_KEY=sk-proj-your-key-here npx @53able/conflux single critical '{"claim": "この実装で十分"}'
```

> **推奨**: このプロジェクトは`pnpm`での使用を推奨しています。

## 🔧 環境設定

### API キーの設定

実際の思考分析を行うには、LLMプロバイダーのAPIキーが必要です。

#### 方法1: 環境変数で設定（推奨）

**CLIで使用する場合**:
```bash
# 一時的に環境変数を設定して実行
OPENAI_API_KEY=sk-proj-your-key-here npx @53able/conflux single critical '{"claim": "この実装で十分"}'

# または Anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here npx @53able/conflux single critical '{"claim": "この実装で十分"}'

# または Google Gemini
GOOGLE_GENERATIVE_AI_API_KEY=your-google-key npx @53able/conflux single critical '{"claim": "この実装で十分"}'
```

**永続的に設定する場合**:
```bash
# .bashrc または .zshrc に追加
export OPENAI_API_KEY=sk-proj-your-key-here
export ANTHROPIC_API_KEY=sk-ant-your-key-here
export GOOGLE_GENERATIVE_AI_API_KEY=your-google-key-here
export DEFAULT_LLM_PROVIDER=openai  # or anthropic or google

# 設定を反映
source ~/.bashrc  # または source ~/.zshrc
```

#### 方法2: .envファイルで設定

**プロジェクトで使用する場合**:
```bash
# プロジェクトルートに.envファイルを作成
echo "OPENAI_API_KEY=sk-proj-your-key-here" > .env
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" >> .env
echo "GOOGLE_GENERATIVE_AI_API_KEY=your-google-key-here" >> .env
echo "DEFAULT_LLM_PROVIDER=openai" >> .env
```

**設定例（完全版）**:
```bash
# LLM Provider API Keys
OPENAI_API_KEY=sk-proj-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key-here

# Model Configuration  
OPENAI_MODEL=gpt-5
ANTHROPIC_MODEL=claude-sonnet-4-latest
GOOGLE_MODEL=gemini-2.0-flash-exp

# Default Provider
DEFAULT_LLM_PROVIDER=openai

# AI SDK v5 Settings (required for proper functioning)
AI_SDK_DISABLE_TELEMETRY=true
AI_SDK_VERCEL_AI_GATEWAY_DISABLED=true
```

#### APIキーの取得方法

**OpenAI API Key**（推奨：gpt-5）
- [OpenAI Platform](https://platform.openai.com/api-keys)でAPIキーを取得

**Anthropic API Key**（推奨：Claude Sonnet 4）
- [Anthropic Console](https://console.anthropic.com/)でAPIキーを取得

**Google Generative AI API Key**（推奨：Gemini 1.5 Pro）
- [Google AI Studio](https://aistudio.google.com/app/apikey)でAPIキーを取得

### CLIでの動作確認

```bash
# 1. 思考法一覧の確認（API KEYなしでも動作）
npx @53able/conflux list

# 2. 局面別推奨思考法（API KEYなしでも動作）
npx @53able/conflux recommend debugging

# 3. 実際の思考分析（API KEYが必要）
# 環境変数を設定して実行
OPENAI_API_KEY=sk-proj-your-key-here npx @53able/conflux single abduction '{"surprisingFact": "APIが遅い"}'

# Google Geminiを使用する場合
GOOGLE_GENERATIVE_AI_API_KEY=your-google-key npx @53able/conflux single abduction '{"surprisingFact": "APIが遅い"}'

# または永続的に設定済みの場合
npx @53able/conflux single abduction '{"surprisingFact": "APIが遅い"}'
```

> **💡 ヒント**: 初回使用時は、まず`list`コマンドで思考法一覧を確認し、`recommend`コマンドで局面別推奨を確認してから、実際の思考分析を試してみてください。

## 📋 基本的な使用方法

### 1. ライブラリとして使用

#### 局面別思考プロセス

```typescript
import { ThinkingOrchestrator } from '@53able/conflux';

const orchestrator = new ThinkingOrchestrator();

// デバッグ場面での思考プロセス
const result = await orchestrator.processPhase(
  'debugging',
  {
    issue: 'APIが500エラーを返す',
    context: 'DB接続エラーが発生している様子',
    observations: ['他のAPIは正常', 'ログにタイムアウト']
  },
  { llmProvider: 'openai' }
);

console.log(result.synthesis); // 統合分析結果
console.log(result.actionItems); // 具体的なアクションアイテム
```

#### 黄金パターン（探索→実装）

```typescript
// アブダクション→演繹→帰納→クリティカル→ロジカル→メタ→ディベートの統合フロー
const result = await orchestrator.processGoldenPattern(
  {
    problem: '新機能の設計方針',
    context: 'パフォーマンスとメンテナンス性のバランス',
  },
  { llmProvider: 'anthropic' }
);
```

#### 単一思考法の使用

```typescript
// クリティカルシンキングで前提を疑う
const result = await orchestrator.processSingleMethod(
  'critical',
  {
    claim: 'マイクロサービス化で開発速度向上',
    evidence: ['独立デプロイ可能', '技術選択の自由']
  },
  { llmProvider: 'openai' }
);
```

### 2. コマンドライン使用

```bash
# 局面別思考プロセス
npx @53able/conflux phase debugging '{"issue": "APIエラー", "context": "DB問題"}'

# 黄金パターン実行
npx @53able/conflux golden '{"problem": "アーキテクチャ設計"}'

# 単一思考法
npx @53able/conflux single critical '{"claim": "この実装で十分"}'

# 思考法一覧
npx @53able/conflux list

# 局面別推奨思考法
npx @53able/conflux recommend debugging

# バージョン確認
npx @53able/conflux version

# ヘルプ表示
npx @53able/conflux --help
```

## 🛠 MCPサーバーとして使用

Model Context Protocol準拠のサーバーとして他のAIツールと統合できます。

### サーバー起動

```bash
# npx経由で起動（推奨）
# API KEYは環境変数で設定
OPENAI_API_KEY=sk-proj-your-key-here npx @53able/conflux server

# 開発時：npm scriptsで起動
npm run mcp-server

# 開発時：tsxで直接実行
npx tsx src/mcp/server.ts
```

> **💡 注意**: MCPサーバーを起動する前に、環境変数でAPI KEYを設定してください。

### MCP設定例（Claude Desktop）

```json
{
  "mcpServers": {
    "thinking-agents": {
      "command": "npx",
      "args": ["@53able/conflux", "server"],
      "env": {
        "OPENAI_API_KEY": "sk-proj-your-openai-api-key-here",
        "OPENAI_MODEL": "gpt-5",
        "ANTHROPIC_API_KEY": "sk-ant-your-anthropic-api-key-here",
        "ANTHROPIC_MODEL": "claude-sonnet-4-latest",
        "GOOGLE_GENERATIVE_AI_API_KEY": "your-google-api-key-here",
        "GOOGLE_MODEL": "gemini-2.0-flash-exp",
        "DEFAULT_LLM_PROVIDER": "openai",
        "AI_SDK_DISABLE_TELEMETRY": "true",
        "AI_SDK_VERCEL_AI_GATEWAY_DISABLED": "true"
      }
    }
  }
}
```

#### 環境変数の説明

| 環境変数 | 説明 | 必須 | デフォルト |
|---------|------|------|-----------|
| `OPENAI_API_KEY` | OpenAI APIキー | 推奨 | - |
| `OPENAI_MODEL` | 使用するOpenAIモデル | 任意 | `gpt-5` |
| `ANTHROPIC_API_KEY` | Anthropic APIキー | 推奨 | - |
| `ANTHROPIC_MODEL` | 使用するAnthropicモデル | 任意 | `claude-sonnet-4-latest` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Generative AI APIキー | 任意 | - |
| `GOOGLE_MODEL` | 使用するGoogleモデル | 任意 | `gemini-2.0-flash-exp` |
| `DEFAULT_LLM_PROVIDER` | デフォルトのLLMプロバイダー | 任意 | `openai` |
| `AI_SDK_DISABLE_TELEMETRY` | テレメトリを無効化 | 推奨 | `true` |
| `AI_SDK_VERCEL_AI_GATEWAY_DISABLED` | Vercel AI Gatewayを無効化 | 推奨 | `true` |

> **💡 ヒント**: 最低限、`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、または`GOOGLE_GENERATIVE_AI_API_KEY`のいずれかを設定すれば動作します。複数設定すると、`DEFAULT_LLM_PROVIDER`で選択できます。

#### 利用可能なモデル

AI SDK v5でサポートされている最新のモデル一覧は、[AI SDK v5公式ドキュメント](https://ai-sdk.dev/docs/foundations/providers-and-models)で確認できます。

**利用可能なプロバイダーとモデル**:
- **OpenAI**: `gpt-5`, `gpt-5-mini`, `gpt-5-nano`, `gpt-5-chat-latest`, `gpt-4o`, `gpt-4o-mini`
- **Anthropic**: `claude-sonnet-4-latest`, `claude-3-5-sonnet-20241022`, `claude-3-5-sonnet-latest`
- **Google**: `gemini-2.0-flash-exp`, `gemini-1.5-flash`, `gemini-1.5-pro`
- **OpenAI互換**: カスタムエンドポイント（`openai-compatible`タイプ）
- **Mock**: 開発・テスト用（`mock`タイプ）

> **📚 詳細**: 各プロバイダーの最新モデル一覧と機能比較は[AI SDK v5公式ドキュメント](https://ai-sdk.dev/docs/foundations/providers-and-models)を参照してください。

### Cursor / Claude Codeでの使用

#### Cursor設定

**方法1: npx経由でnpmレジストリから実行（推奨）**
```json
{
  "mcp.servers": {
    "thinking-agents": {
      "command": "npx",
      "args": ["@53able/conflux", "server"],
      "env": {
        "OPENAI_API_KEY": "sk-proj-your-openai-api-key-here",
        "OPENAI_MODEL": "gpt-5",
        "ANTHROPIC_API_KEY": "sk-ant-your-anthropic-api-key-here",
        "ANTHROPIC_MODEL": "claude-sonnet-4-latest",
        "GOOGLE_GENERATIVE_AI_API_KEY": "your-google-api-key-here",
        "GOOGLE_MODEL": "gemini-2.0-flash-exp",
        "DEFAULT_LLM_PROVIDER": "openai",
        "AI_SDK_DISABLE_TELEMETRY": "true",
        "AI_SDK_VERCEL_AI_GATEWAY_DISABLED": "true"
      }
    }
  }
}
```

**方法2: pnpm dlx経由**
```json
{
  "mcp.servers": {
    "thinking-agents": {
      "command": "pnpm",
      "args": ["dlx", "@53able/conflux", "server"],
      "env": {
        "OPENAI_API_KEY": "sk-proj-your-openai-api-key-here",
        "OPENAI_MODEL": "gpt-5",
        "ANTHROPIC_API_KEY": "sk-ant-your-anthropic-api-key-here",
        "ANTHROPIC_MODEL": "claude-sonnet-4-latest",
        "GOOGLE_GENERATIVE_AI_API_KEY": "your-google-api-key-here",
        "GOOGLE_MODEL": "gemini-2.0-flash-exp",
        "DEFAULT_LLM_PROVIDER": "openai",
        "AI_SDK_DISABLE_TELEMETRY": "true",
        "AI_SDK_VERCEL_AI_GATEWAY_DISABLED": "true"
      }
    }
  }
}
```

#### プロジェクトセットアップ（開発者向け）

```bash
# リポジトリのクローン
git clone https://github.com/53able/conflux.git
cd conflux

# 依存関係のインストール（pnpm推奨）
pnpm install

# ビルド
pnpm run build

# MCPサーバーとして起動
pnpm run mcp-server
# または
npx @53able/conflux server

# CLIツールとして使用
npx @53able/conflux list
```

## 📋 開発局面と推奨思考法

| 局面 | 主要思考法 | 併用思考法 | 目的 |
|------|------------|------------|------|
| 事業/課題探索 | アブダクション | 帰納→演繹→メタ | 驚きから仮説形成 |
| 要件定義 | ロジカルシンキング | MECE→クリティカル | 論点→結論の道筋 |
| 価値仮説検証 | 帰納的思考 | クリティカル | データから一般化 |
| アーキ設計 | 演繹的思考 | ディベート | 原則→設計結論 |
| 優先順位付け | MECE | ロジカル | 粒度揃え・重複排除 |
| 見積もり/計画 | ロジカルシンキング | メタ | 前提→分解→見積 |
| 実装 | 演繹的思考 | クリティカル | 原則→具体コード |
| デバッグ | アブダクション | 演繹→帰納 | 兆候→原因仮説 |
| リファクタリング | クリティカルシンキング | MECE→ロジカル | 前提・依存を疑う |
| コードレビュー | クリティカルシンキング | 演繹→MECE | 結論↔根拠の検証 |
| テスト設計 | 演繹的思考 | MECE→帰納 | 仕様→条件導出 |
| 実験/ABテスト | 帰納的思考 | クリティカル | データ→効果一般化 |
| 意思決定 | ディベート思考 | メタ | 賛否論点の顕在化 |
| ふりかえり | メタ思考 | ロジカル→PAC | 思考プロセス見直し |
| 仮説分解 | PAC思考 | クリティカル | 前提・仮定・結論分解 |

## ⚙️ 設定

### 環境変数

```bash
# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Anthropic  
ANTHROPIC_API_KEY=your-anthropic-api-key

# Google
GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key

# カスタムプロバイダー
CUSTOM_LLM_BASE_URL=https://your-llm-endpoint.com/v1
CUSTOM_LLM_API_KEY=your-custom-key
```

### LLMプロバイダー設定

#### 環境変数での設定（推奨）

```bash
# 環境変数で設定（自動認識）
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_GENERATIVE_AI_API_KEY=your-google-key
DEFAULT_LLM_PROVIDER=openai  # or anthropic or google
```

#### プログラムでの設定

```typescript
import { globalLLMManager } from '@53able/conflux';

// OpenAI GPT-5（最新）
globalLLMManager.registerProvider('gpt5', {
  type: 'openai',
  model: 'gpt-5',
  apiKey: process.env.OPENAI_API_KEY,
});

// Anthropic Claude Sonnet 4（最新）
globalLLMManager.registerProvider('claude', {
  type: 'anthropic', 
  model: 'claude-sonnet-4-latest',
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Google Gemini（最新）
globalLLMManager.registerProvider('gemini', {
  type: 'google', 
  model: 'gemini-2.0-flash-exp',
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// OpenAI互換API
globalLLMManager.registerProvider('custom', {
  type: 'openai-compatible',
  baseURL: 'https://api.your-provider.com/v1',
  model: 'your-model',
  apiKey: 'your-key',
});
```

> **📚 利用可能なモデル**: 本システムでサポートされているプロバイダーとモデル一覧は上記の通りです。各プロバイダーの最新モデル情報は[AI SDK v5公式ドキュメント](https://ai-sdk.dev/docs/foundations/providers-and-models)で確認できます。

## 📚 高度な使用方法

### カスタム思考法エージェント

```typescript
import { BaseThinkingAgent, AgentCapability } from '@53able/conflux';

class CustomThinkingAgent extends BaseThinkingAgent {
  readonly capability: AgentCapability = {
    methodType: 'custom',
    description: 'カスタム思考法',
    applicablePhases: ['implementation'],
    requiredInputSchema: z.object({ /* スキーマ定義 */ }),
    outputSchema: z.object({ /* 出力スキーマ */ }),
    combinationSynergies: ['critical', 'logical'],
  };

  protected async executeLLMThinking(input: unknown, context: AgentContext) {
    // カスタムロジック実装
  }
}
```

### 思考プロセスの連鎖

```typescript
const orchestrator = new ThinkingOrchestrator();

// 要件定義 → 設計 → 実装の連鎖
const requirements = await orchestrator.processPhase('requirement_definition', input);
const architecture = await orchestrator.processPhase('architecture_design', {
  ...input,
  requirements: requirements.results,
});
const implementation = await orchestrator.processPhase('implementation', {
  ...input,
  architecture: architecture.results,
});
```

### MCPツールの活用

MCPサーバーとして起動することで、他のAIツールと統合して高度な思考分析が可能です。

#### 利用可能なMCPツール

- `process-phase` - 局面に応じた統合思考プロセス
- `process-golden-pattern` - 黄金パターンの実行
- `process-single-method` - 単一思考法の実行  
- `list-thinking-methods` - 思考法一覧の取得
- `get-phase-recommendations` - 局面別推奨の取得

#### 思考プロセスの連鎖

MCPツールを組み合わせることで、複数の思考法を連鎖させた高度な分析が可能です。

```bash
# 1. 局面別推奨を取得
npx @53able/conflux recommend debugging

# 2. 推奨された思考法で分析
npx @53able/conflux single abduction '{"surprisingFact": "APIが遅い"}'

# 3. 黄金パターンで統合分析
npx @53able/conflux golden '{"problem": "パフォーマンス問題の根本解決"}'
```

## 🤝 貢献

このプロジェクトへの貢献を歓迎します！

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🙏 謝辞

- [思考法の使い方](docs/思考法の使い方.md) - 本プロジェクトの思考法理論的基盤
- [Commander.js](https://github.com/tj/commander.js) - 型安全なCLIパーサー
- [AI SDK v5](https://sdk.vercel.ai/) - LLM統合ライブラリ
- [Model Context Protocol](https://modelcontextprotocol.io/) - AI統合標準
- [Anthropic](https://www.anthropic.com/engineering/building-effective-agents) - エージェント設計指針

---

**構造化された思考で、より良い意思決定を。**
