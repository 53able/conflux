/**
 * 共通定数定義（Single Source of Truth）
 * 
 * このファイルは、プロジェクト全体で使用される定数を一元管理します。
 * 環境変数、デフォルト値、設定値など、すべての定数はここから参照してください。
 */

// ============================================================================
// アプリケーション設定
// ============================================================================

/**
 * アプリケーション情報
 */
export const APP_CONFIG = {
  NAME: 'Conflux',
  VERSION: '1.0.0',
  DESCRIPTION: 'Multi-agent thinking methodology framework',
} as const;

/**
 * デフォルトのログレベル
 */
export const DEFAULT_LOG_LEVEL = 'info' as const;

/**
 * デフォルトのセッション設定
 */
export const SESSION_CONFIG = {
  DEFAULT_TIMEOUT: 30000, // 30秒
  MAX_RETRIES: 3,
  DEFAULT_USER_ID: 'anonymous',
} as const;

// ============================================================================
// LLM関連の定数
// ============================================================================

/**
 * デフォルトのLLM設定
 */
export const LLM_DEFAULT_CONFIG = {
  TEMPERATURE: 0.3,
  MAX_TOKENS: 2000,
  MAX_RETRIES: 3,
  ENABLE_AUTO_RECOVERY: true,
  MODE: 'auto' as const,
} as const;

/**
 * サポートするLLMプロバイダー
 */
export const SUPPORTED_PROVIDERS = [
  'openai',
  'anthropic', 
  'google',
  'openai-compatible',
  'mock'
] as const;

/**
 * LLMプロバイダー型（SUPPORTED_PROVIDERSから生成）
 */
export type LLMProviderType = typeof SUPPORTED_PROVIDERS[number];

/**
 * デフォルトのLLMプロバイダー設定
 */
export const LLM_PROVIDER_CONFIGS = {
  openai: {
    model: process.env.OPENAI_MODEL || 'gpt-5-nano',
    defaultParams: {
      temperature: LLM_DEFAULT_CONFIG.TEMPERATURE,
      maxTokens: LLM_DEFAULT_CONFIG.MAX_TOKENS,
    },
  },
  anthropic: {
    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest',
    defaultParams: {
      temperature: LLM_DEFAULT_CONFIG.TEMPERATURE,
      maxTokens: LLM_DEFAULT_CONFIG.MAX_TOKENS,
    },
  },
  google: {
    model: process.env.GOOGLE_MODEL || 'gemini-2.5-flash',
    defaultParams: {
      temperature: LLM_DEFAULT_CONFIG.TEMPERATURE,
      maxTokens: LLM_DEFAULT_CONFIG.MAX_TOKENS,
    },
  },
  'openai-compatible': {
    model: 'gpt-3.5-turbo',
    defaultParams: {
      temperature: LLM_DEFAULT_CONFIG.TEMPERATURE,
      maxTokens: LLM_DEFAULT_CONFIG.MAX_TOKENS,
    },
  },
  mock: {
    model: 'mock-model',
    defaultParams: {
      temperature: LLM_DEFAULT_CONFIG.TEMPERATURE,
      maxTokens: LLM_DEFAULT_CONFIG.MAX_TOKENS,
    },
  },
} as const;

// ============================================================================
// 思考法関連の定数
// ============================================================================

/**
 * サポートする思考法
 */
export const THINKING_METHODS = [
  'abduction',
  'critical',
  'debate',
  'deductive',
  'inductive',
  'logical',
  'mece',
  'meta',
  'pac'
] as const;

/**
 * サポートする開発局面
 */
export const DEVELOPMENT_PHASES = [
  'business_exploration',
  'requirement_definition',
  'value_hypothesis',
  'architecture_design',
  'prioritization',
  'estimation_planning',
  'implementation',
  'debugging',
  'refactoring',
  'code_review',
  'test_design',
  'experimentation',
  'decision_making',
  'retrospective',
  'hypothesis_breakdown'
] as const;

/**
 * 黄金パターン（探索→実装）のシーケンス
 * 思考法の使い方.mdの「併用の黄金パターン」を基に実装
 * 
 * 1. アブダクションで仮説を立てる
 * 2. 演繹で帰結を設計
 * 3. 帰納でデータ検証
 * 4. クリティカルで前提/飛躍を潰す
 * 5. MECE/ロジカルで成果物に構造を与える
 * 6. メタでプロセス自体を更新
 * 7. 必要ならディベートで意思決定を締める
 */
export const GOLDEN_PATTERN_SEQUENCE = [
  'abduction',  // 仮説を立てる
  'deductive',  // 帰結を設計
  'inductive',  // データ検証
  'critical',   // 前提/飛躍を潰す
  'mece',       // 漏れなく重複なく構造化
  'logical',    // 論理的道筋を構築
  'meta',       // プロセス自体を更新
  'debate',     // 必要なら意思決定を締める
] as const;

// ============================================================================
// MCP関連の定数
// ============================================================================

/**
 * MCPサーバー設定
 */
export const MCP_SERVER_CONFIG = {
  NAME: 'thinking-methods-mcp',
  VERSION: '0.1.7',
  TOOLS_COUNT: 6,
  DEFAULT_PORT: 3000,
} as const;

/**
 * MCPツール名
 */
export const MCP_TOOL_NAMES = {
  PROCESS_PHASE: 'process-phase',
  PROCESS_GOLDEN_PATTERN: 'process-golden-pattern',
  PROCESS_SINGLE_METHOD: 'process-single-method',
  PROCESS_CUSTOM_STRATEGY: 'process-custom-strategy',
  LIST_THINKING_METHODS: 'list-thinking-methods',
  GET_PHASE_RECOMMENDATIONS: 'get-phase-recommendations',
} as const;

/**
 * セッションIDプレフィックス
 */
export const SESSION_PREFIXES = {
  PHASE: 'phase',
  GOLDEN: 'golden',
  METHOD: 'method',
  STRATEGY: 'strategy',
  MCP: 'mcp',
} as const;

// ============================================================================
// エラーメッセージ定数
// ============================================================================

/**
 * 共通エラーメッセージ
 */
export const ERROR_MESSAGES = {
  INVALID_INPUT: 'Invalid input provided',
  VALIDATION_FAILED: 'Validation failed',
  LLM_EXECUTION_FAILED: 'LLM execution failed',
  AGENT_EXECUTION_FAILED: 'Agent execution failed',
  SCHEMA_VALIDATION_FAILED: 'Schema validation failed',
  UNKNOWN_ERROR: 'Unknown error occurred',
} as const;

/**
 * 成功メッセージ
 */
export const SUCCESS_MESSAGES = {
  EXECUTION_COMPLETED: 'Execution completed successfully',
  VALIDATION_PASSED: 'Validation passed',
  AGENT_EXECUTED: 'Agent executed successfully',
} as const;

// ============================================================================
// ファイルパス定数
// ============================================================================

/**
 * 重要なファイルパス
 */
export const FILE_PATHS = {
  CONFIG: '.env',
  LOGS: 'logs/',
  SCHEMAS: 'src/schemas/',
  AGENTS: 'src/agents/',
  CORE: 'src/core/',
} as const;

// ============================================================================
// 数値定数
// ============================================================================

/**
 * 数値制限
 */
export const NUMERIC_LIMITS = {
  MAX_CONFIDENCE: 1.0,
  MIN_CONFIDENCE: 0.0,
  MAX_RETRIES: 5,
  MIN_RETRIES: 1,
  MAX_TIMEOUT: 60000, // 60秒
  MIN_TIMEOUT: 1000,  // 1秒
} as const;

/**
 * 配列制限
 */
export const ARRAY_LIMITS = {
  MAX_THINKING_METHODS: 10,
  MAX_DEVELOPMENT_PHASES: 15,
  MAX_AGENTS: 20,
} as const;
