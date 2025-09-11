# Conflux - プロダクト要件定義書

## プロジェクト概要

@思考法の使い方.md をマルチエージェンティブに挙動するMCPツールを実装します。

**プロジェクト名**: Conflux
**パッケージ名**: @53able/conflux
**リポジトリ**: https://github.com/53able/conflux
**最新バージョン**: [GitHub Releases](https://github.com/53able/conflux/releases)を参照

## 技術仕様

### 基盤技術
- **言語**: TypeScript 5.6+
- **実行環境**: @https://github.com/dahlia/optique と、@https://github.com/privatenumber/tsx
- **スキーマ定義**: Zodスキーマファーストで実装
- **LLM統合**: @https://github.com/vercel/ai (AI SDK v5)
- **MCP SDK**: @https://github.com/modelcontextprotocol/typescript-sdk

### エージェント設計
Agentの実装は、 @https://www.anthropic.com/engineering/building-effective-agents を大いに参考にしています。

### エラーハンドリング
- LLMからのレスポンスがスキーマとマッチしなかった場合等のエラー処理を実装
- 自動復旧機能を搭載
- 指数バックオフによる再試行
- フォールバックプロバイダー対応

## 配布・利用

### npmレジストリ
このMCPツールは、npmレジストリから利用可能です。

### 統合環境
- Cursor
- Claude Code
- その他のMCP対応AI開発環境

### パッケージ管理
パッケージ管理は、 pnpm を使用します。
https://github.com/pnpm/pnpm

## 思考法実装

9つの思考法を実装：

1. **アブダクション** - 驚きの事実から説明仮説を形成
2. **ロジカルシンキング** - 論点から結論への論理的道筋を構築
3. **クリティカルシンキング** - 前提・論点・根拠を体系的に疑う
4. **MECE** - 漏れなく重複なく分類・整理
5. **演繹的思考** - 一般原則から具体的結論を導出
6. **帰納的思考** - 個別事例から共通パターンを発見
7. **PAC思考** - 前提・仮定・結論に分解して検証
8. **メタ思考** - 思考プロセス自体を評価・改善
9. **ディベート思考** - 賛成・反対論点で意思決定支援
