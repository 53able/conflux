import {
  type DevelopmentPhase,
  type IntegratedThinkingResult
} from '../schemas/index.js';
import { getLogger, type TaskEither, type AgentContext } from '../core/index.js';
import * as TE from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';

// 分割されたモジュールのインポート
import { PHASE_THINKING_MAP } from './strategy.js';
import { 
  executeStrategyTaskEither,
  executeSequentialSequenceTaskEither
} from './execution.js';
import { 
  synthesizeResults, 
  createFailureResult, 
} from './synthesis.js';

const _logger = getLogger();

/**
 * 局面に応じた統合思考プロセスを実行
 */
export async function processPhase(
  phase: DevelopmentPhase,
  initialInput: Record<string, unknown>,
  context: AgentContext
): Promise<IntegratedThinkingResult> {
  const result = await processPhaseTaskEither(phase, initialInput, context)();
  return result._tag === 'Left' 
    ? createFailureResult(phase, PHASE_THINKING_MAP[phase], result.left)
    : result.right;
}

/**
 * 局面に応じた統合思考プロセスを実行（TaskEither型でエラーハンドリング）
 */
export function processPhaseTaskEither(
  phase: DevelopmentPhase,
  initialInput: Record<string, unknown>,
  context: AgentContext
): TaskEither<string, IntegratedThinkingResult> {
  const strategy = PHASE_THINKING_MAP[phase];
  
  return pipe(
    executeStrategyTaskEither(strategy, initialInput, context),
    TE.chain(results => 
      TE.fromEither(
        synthesizeResults(phase, strategy, results.results, initialInput)
      )
    )
  );
}

/**
 * 局面に基づくカスタムシーケンスの実行（PHASE_THINKING_MAPとの互換性）
 */
export async function processPhaseCustomSequence(
  phase: DevelopmentPhase,
  input: Record<string, unknown>,
  context: AgentContext
): Promise<IntegratedThinkingResult> {
  const strategy = PHASE_THINKING_MAP[phase];
  if (!strategy.sequence) {
    throw new Error(`No sequence defined for phase: ${phase}`);
  }
  
  const result = await executeSequentialSequenceTaskEither(strategy.sequence, input, context)();
  
  if (result._tag === 'Left') {
    throw new Error(result.left);
  }
  
  return result.right;
}

