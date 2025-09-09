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
- **🎨 美しいCLI**: Optiqueベースの直感的なコマンドライン
- **🔗 LLM統合**: Vercel AI SDKで複数のLLMプロバイダーをサポート
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
pnpm install @53able/conflux
# or
npm install @53able/conflux
```

> **推奨**: このプロジェクトは`pnpm`での使用を推奨しています。

## 🔧 環境設定

### API キーの設定

実際の思考分析を行うには、LLMプロバイダーのAPIキーが必要です。

#### 1. 環境設定ファイルの準備

```bash
# .env.exampleを.envにコピー
cp .env.example .env
```

#### 2. APIキーの取得と設定

**OpenAI API Key**（推奨：gpt-4o）
- [OpenAI Platform](https://platform.openai.com/api-keys)でAPIキーを取得
- `.env`ファイルに設定:
  ```bash
  OPENAI_API_KEY=sk-proj-your-openai-api-key-here
  OPENAI_MODEL=gpt-4o
  ```

**Anthropic API Key**（推奨：Claude 3.5 Sonnet）
- [Anthropic Console](https://console.anthropic.com/)でAPIキーを取得
- `.env`ファイルに設定:
  ```bash
  ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
  ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
  ```

#### 3. デフォルトプロバイダーの選択

```bash
# .envファイルで設定
DEFAULT_LLM_PROVIDER=anthropic  # or openai
```

#### 4. 設定例（完全版）

```bash
# LLM Provider API Keys
OPENAI_API_KEY=sk-proj-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Model Configuration  
OPENAI_MODEL=gpt-4o
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Default Provider
DEFAULT_LLM_PROVIDER=anthropic

# AI SDK v5 Settings (required for proper functioning)
AI_SDK_DISABLE_TELEMETRY=true
AI_SDK_VERCEL_AI_GATEWAY_DISABLED=true
```

### CLIでの動作確認

```bash
# 思考法一覧の確認（API KEYなしでも動作）
pnpm start list

# 局面別推奨思考法（API KEYなしでも動作）
pnpm start recommend debugging

# 実際の思考分析（API KEYが必要）
pnpm start single abduction '{"surprisingFact": "APIが遅い"}'
```

## 📋 基本的な使用方法

#### 1. 局面別思考プロセス

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

#### 2. 黄金パターン（探索→実装）

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

#### 3. 単一思考法の使用

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

### コマンドライン使用

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
npx @53able/conflux server

# 開発時：npm scriptsで起動
npm run mcp-server

# 開発時：tsxで直接実行
npx tsx src/mcp/server.ts
```

### MCP設定例（Claude Desktop）

```json
{
  "mcpServers": {
    "thinking-agents": {
      "command": "npx",
      "args": ["@53able/conflux", "server"],
      "env": {
        "OPENAI_API_KEY": "your-api-key",
        "ANTHROPIC_API_KEY": "your-anthropic-key"
      }
    }
  }
}
```

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
        "OPENAI_API_KEY": "your-api-key",
        "ANTHROPIC_API_KEY": "your-anthropic-key"
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
        "OPENAI_API_KEY": "your-api-key",
        "ANTHROPIC_API_KEY": "your-anthropic-key"
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

# 型チェック
pnpm run type-check

# 開発サーバー起動
pnpm run dev

# MCPサーバーとして起動
pnpm run mcp-server
# または
npx @53able/conflux server
```

### 利用可能なMCPツール

- `process-phase` - 局面に応じた統合思考プロセス
- `process-golden-pattern` - 黄金パターンの実行
- `process-single-method` - 単一思考法の実行  
- `list-thinking-methods` - 思考法一覧の取得
- `get-phase-recommendations` - 局面別推奨の取得

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

# カスタムプロバイダー
CUSTOM_LLM_BASE_URL=https://your-llm-endpoint.com/v1
CUSTOM_LLM_API_KEY=your-custom-key
```

### LLMプロバイダー設定

```typescript
import { globalLLMManager } from '@53able/conflux';

// OpenAI GPT-4
globalLLMManager.registerProvider('gpt4', {
  type: 'openai',
  model: 'gpt-4-turbo-preview',
  apiKey: process.env.OPENAI_API_KEY,
});

// Anthropic Claude
globalLLMManager.registerProvider('claude', {
  type: 'anthropic', 
  model: 'claude-3-sonnet-20240229',
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// OpenAI互換API
globalLLMManager.registerProvider('custom', {
  type: 'openai-compatible',
  baseURL: 'https://api.your-provider.com/v1',
  model: 'your-model',
  apiKey: 'your-key',
});
```

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
- [Optique](https://github.com/dahlia/optique) - 型安全なCLIパーサー
- [Vercel AI SDK](https://sdk.vercel.ai/) - LLM統合ライブラリ
- [Model Context Protocol](https://modelcontextprotocol.io/) - AI統合標準
- [Anthropic](https://www.anthropic.com/engineering/building-effective-agents) - エージェント設計指針

---

**構造化された思考で、より良い意思決定を。**
