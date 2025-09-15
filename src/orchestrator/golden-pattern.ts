import {
  type IntegratedThinkingResult,
  type ThinkingMethodType
} from '../schemas/index.js';
import { type TaskEither, type AgentContext } from '../core/index.js';
import * as TE from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';

// 分割されたモジュールのインポート
import { GOLDEN_PATTERN_SEQUENCE } from '../core/constants.js';
import { 
  executeGoldenPatternTaskEither
} from './execution.js';
import { 
  synthesizeResults, 
  createFailureResult, 
} from './synthesis.js';

/**
 * 黄金パターン（探索→実装）を実行
 */
export async function processGoldenPattern(
  initialInput: Record<string, unknown>,
  context: AgentContext
): Promise<IntegratedThinkingResult> {
  const result = await processGoldenPatternTaskEither(initialInput, context)();
  return result._tag === 'Left' 
    ? createFailureResult('business_exploration', {
        primary: 'abduction',
        secondary: GOLDEN_PATTERN_SEQUENCE.slice(1) as unknown as ThinkingMethodType[],
        sequence: GOLDEN_PATTERN_SEQUENCE as unknown as ThinkingMethodType[]
      }, result.left)
    : result.right;
}

/**
 * 黄金パターン（探索→実装）を実行（TaskEither型でエラーハンドリング）
 */
export function processGoldenPatternTaskEither(
  initialInput: Record<string, unknown>,
  context: AgentContext
): TaskEither<string, IntegratedThinkingResult> {
  
  return pipe(
    executeGoldenPatternTaskEither(initialInput, context),
    TE.chain(results => 
      TE.fromEither(
        synthesizeResults('business_exploration', {
          primary: 'abduction',
          secondary: GOLDEN_PATTERN_SEQUENCE.slice(1) as unknown as ThinkingMethodType[],
          sequence: GOLDEN_PATTERN_SEQUENCE as unknown as ThinkingMethodType[]
        }, results.results, initialInput)
      )
    )
  );
}
