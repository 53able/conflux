/**
 * Conflux - 思考エージェント統合フレームワーク
 * 
 * このファイルは、Confluxの主要な機能を一箇所からエクスポートします。
 * 外部からのインポートを簡潔にし、フレームワークの構造を明確にします。
 */

// スキーマ（共通スキーマを優先）
export * from './schemas/index.js';

// コア機能（重複を避けるため個別エクスポート）
export type {
  // 型定義
  GenerationOptions,
  ZodSchema,
  Schema,
  ValidationError,
  ValidationResult,
  AgentContext,
  AgentCapability,
  AgentConfig,
  PromptGenerator,
  ConfidenceCalculator,
  ReasoningGenerator,
  NextStepRecommender,
  LLMProvider,
  LanguageModel,
  LLMProviderConfig,
  LLMProviderType,
} from './core/index.js';

export {
  // 定数
  APP_CONFIG,
  LLM_DEFAULT_CONFIG,
  SUPPORTED_PROVIDERS,
  LLM_PROVIDER_CONFIGS,
  THINKING_METHODS,
  DEVELOPMENT_PHASES,
  GOLDEN_PATTERN_SEQUENCE,
  MCP_SERVER_CONFIG,
  MCP_TOOL_NAMES,
  SESSION_PREFIXES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  FILE_PATHS,
  NUMERIC_LIMITS,
  ARRAY_LIMITS,
  // 関数
  convertInputForMethod,
  convertInputForMethods,
  normalizeInput,
  validateInput,
  convertAndValidateInput,
  // LLM統合
  generateStructuredOutput,
  generateStructuredOutputEither,
  generateText,
  generateTextEither,
  generateWithFallback,
  generateWithFallbackEither,
  healthCheck,
  healthCheckEither,
  // LLMプロバイダー
  registerProvider,
  getProvider,
  setDefaultProvider,
  listProviders,
  getConfig,
  toLanguageModel,
  initializeDefaultProviders,
  globalLLMManager,
  // ロガー
  getLogger,
  setLogLevel,
  resetLogger,
  infoColored,
  warnColored,
  errorColored,
  debugColored,
  infoMultiColored,
  warnMultiColored,
  errorMultiColored,
  // スキーマユーティリティ
  isZodSchema,
  validateSchema,
  getZodSchemaTypeName,
  generateSchemaExample,
  generateSchemaInstructions,
  extractSchemaRequirements,
  // エラーハンドリング
  enhancePromptForSchemaCompliance,
  handleAutoRecovery,
  handleGenerationError,
  // フォールバック
  tryFallbackProvidersTaskEither,
  generateWithFallbackTaskEither,
  // 生成コア
  generateStructuredOutputTaskEither,
  generateTextTaskEither,
  healthCheckTaskEither
} from './core/index.js';

// 関数型エージェント
export {
  FUNCTIONAL_AGENTS,
  inductiveAgent,
  abductionAgent,
  criticalAgent,
  meceAgent,
  deductiveAgent,
  metaAgent,
  pacAgent,
  logicalAgent,
  debateAgent,
  type FunctionalAgent,
  // エージェントの型定義
  type AbductionInput,
  type AbductionOutput,
  type CriticalInput,
  type CriticalOutput,
  type DebateInput,
  type DebateOutput,
  type DeductiveInput,
  type DeductiveOutput,
  type InductiveInput,
  type InductiveOutput,
  type LogicalInput,
  type LogicalOutput,
  type MECEInput,
  type MECEOutput,
  type MetaInput,
  type MetaOutput,
  type PACInput,
  type PACOutput
} from './agents/index.js';

// オーケストレーター（重複を避けるため個別エクスポート）
export {
  processPhase,
  processPhaseTaskEither,
  processPhaseCustomSequence,
  processGoldenPattern,
  processGoldenPatternTaskEither,
  processCustomStrategy,
  executeStrategyTaskEither,
  executeGoldenPatternTaskEither,
  executeSequentialSequenceTaskEither,
  processSingleMethodTaskEither,
  synthesizeResults,
  createSchemaGuidanceResult,
  createFailureResult,
  // 戦略関連
  PHASE_THINKING_MAP,
  type OrchestrationStrategy
} from './orchestrator/index.js';

// MCPサーバー
export * from './mcp/index.js';

// CLI
export { 
  getPhaseRecommendations as getCLIPhaseRecommendations,
  getThinkingMethodsList as getCLIThinkingMethodsList,
  // CLI型定義
  type CLICommand,
  type CLIOptions,
  type ParsedArguments,
  type PhaseArguments,
  type MethodArguments,
  type StrategyArguments,
  type ThinkingMethodInfo,
  // CLI関数
  runCLITaskEither,
  runCLI,
  createProgram,
  parseArguments,
  parsePhaseArguments,
  parseGoldenArguments,
  parseMethodArguments,
  parseStrategyArguments,
  parseRecommendArguments,
  routeCommand,
  handlePhaseCommand,
  handleGoldenCommand,
  handleMethodCommand,
  handleStrategyCommand,
  handleListCommand,
  handleRecommendCommand,
  handleServerCommand,
  displayResult,
  displayThinkingMethods,
  displayRecommendations,
  displayError,
  getThinkingMethodsList,
  getPhaseRecommendations
} from './cli/index.js';
