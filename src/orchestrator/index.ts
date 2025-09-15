// ============================================================================
// バレルファイル - オーケストレーター全体のエクスポート
// ============================================================================

// 局面別処理
export {
  processPhase,
  processPhaseTaskEither,
  processPhaseCustomSequence
} from './phase-processor.js';

// 黄金パターン処理
export {
  processGoldenPattern,
  processGoldenPatternTaskEither
} from './golden-pattern.js';

// カスタム戦略処理
export {
  processCustomStrategy
} from './custom-strategy.js';

// 実行ロジック
export {
  executeStrategyTaskEither,
  executeGoldenPatternTaskEither,
  executeSequentialSequenceTaskEither,
  processSingleMethodTaskEither
} from './execution.js';

// 戦略関連
export {
  PHASE_THINKING_MAP,
  type OrchestrationStrategy
} from './strategy.js';

// 定数
export { GOLDEN_PATTERN_SEQUENCE } from '../core/constants.js';

// 結果統合・分析
export {
  synthesizeResults,
  createFailureResult,
  createSchemaGuidanceResult
} from './synthesis.js';

// ユーティリティ
export {
  convertInputForMethod
} from './utils.js';

// 後方互換性のためのエイリアス（削除済み）
// processPhaseFunctional は processPhaseTaskEither と同じ機能のため削除
