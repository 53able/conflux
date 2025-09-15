import {
  type ThinkingMethodType,
  type IntegratedThinkingResult
} from '../schemas/index.js';
import { type AgentContext } from '../core/index.js';

// 分割されたモジュールのインポート
import { executeSequentialSequenceTaskEither } from './execution.js';

/**
 * カスタム戦略の実行（PHASE_THINKING_MAP形式）
 */
export async function processCustomStrategy(
  strategy: { primary: ThinkingMethodType; secondary: ThinkingMethodType[]; sequence: ThinkingMethodType[] },
  input: Record<string, unknown>,
  context: AgentContext
): Promise<IntegratedThinkingResult> {
  // 常に順次実行
  const result = await executeSequentialSequenceTaskEither(strategy.sequence, input, context)();
  
  if (result._tag === 'Left') {
    throw new Error(result.left);
  }
  
  // 戦略情報を正しく設定
  return {
    ...result.right,
    primaryMethod: strategy.primary,
    secondaryMethods: strategy.secondary,
  };
}
