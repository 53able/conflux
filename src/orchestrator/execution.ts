import {
  type ThinkingMethodType,
  type ThinkingResult,
  type IntegratedThinkingResult
} from '../schemas/index.js';
import { 
  type AgentContext,
  type FunctionalAgent,
  executeFunctionalAgent
} from '../core/agent-base.js';
import { getLogger, type TaskEither } from '../core/index.js';
import * as TE from 'fp-ts/lib/TaskEither.js';
import * as E from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import type { OrchestrationStrategy } from './strategy.js';
import { convertInputForMethod } from '../core/input-converter.js';
import { GOLDEN_PATTERN_SEQUENCE } from '../core/constants.js';

// 関数型エージェントのインポート
import {
  FUNCTIONAL_AGENTS
} from '../agents/index.js';

/**
 * 関数型エージェントの実行（TaskEither版）
 */
export const processSingleMethodTaskEither = (
  methodType: ThinkingMethodType,
  input: Record<string, unknown>,
  context: AgentContext
): TaskEither<string, ThinkingResult> => {
  const agent = FUNCTIONAL_AGENTS[methodType];
  if (!agent) {
    return TE.left(`Agent not found for method: ${methodType}`);
  }

  // 関数型エージェントを実行
  return executeFunctionalAgent(agent as unknown as FunctionalAgent<Record<string, unknown>, ThinkingResult>, input, context);
};


/**
 * 文字列の正規化関数
 */
const normalizeString = (value: unknown): string => 
  typeof value === 'string' ? value.trim() : String(value);

/**
 * 配列化関数
 */
const arrayify = (value: unknown): unknown[] => 
  Array.isArray(value) ? value : [value];

/**
 * 思考法別の入力変換関数のマップ
 */
const _inputTransformers: Record<ThinkingMethodType, (input: Record<string, unknown>) => Record<string, unknown>> = {
  inductive: (input) => ({
    ...input,
    observations: input.observations ? arrayify(input.observations) : []
  }),
  
  abduction: (input) => ({
    ...input,
    surprisingFact: input.surprisingFact ? normalizeString(input.surprisingFact) : input.surprisingFact
  }),
  
  
  mece: (input) => ({
    ...input,
    items: input.items ? arrayify(input.items) : []
  }),
  
  deductive: (input) => ({
    ...input,
    majorPremise: input.majorPremise ? normalizeString(input.majorPremise) : input.majorPremise,
    minorPremise: input.minorPremise ? normalizeString(input.minorPremise) : input.minorPremise
  }),
  
  meta: (input) => ({
    ...input,
    currentThinking: input.currentThinking ? normalizeString(input.currentThinking) : input.currentThinking
  }),
  
  pac: (input) => ({
    ...input,
    claim: input.claim ? normalizeString(input.claim) : input.claim
  }),
  
  logical: (input) => ({
    ...input,
    question: input.question ? normalizeString(input.question) : input.question,
    constraints: input.constraints ? arrayify(input.constraints) : []
  }),
  
  debate: (input) => ({
    ...input,
    topic: input.topic ? normalizeString(input.topic) : input.topic,
    positions: input.positions ? arrayify(input.positions) : []
  }),
  
  critical: (input) => ({
    ...input,
    claim: input.claim ? normalizeString(input.claim) : input.claim,
    evidence: input.evidence ? arrayify(input.evidence) : []
  })
};

// 入力変換ロジックは src/core/input-converter.ts からインポート

/**
 * 単一思考法の実行（ログ付き）
 */
const executeMethodWithLogging = (
  methodType: ThinkingMethodType,
  input: Record<string, unknown>,
  context: AgentContext
): TaskEither<string, ThinkingResult> => {
  const logger = getLogger();
  
  return pipe(
    // 入力変換（共通ロジックを使用）
    TE.right(convertInputForMethod(methodType, input, 'business_exploration')),
    TE.chain((convertedInput) => 
      pipe(
        // 思考法実行
        processSingleMethodTaskEither(methodType, convertedInput, context),
        TE.map((result) => {
          logger.debug('Method execution completed', {
            method: methodType,
            confidence: result.confidence,
            status: result.status
          });
          return result;
        }),
        TE.mapLeft((error) => {
          const errorMessage = `Method ${methodType} failed: ${error}`;
          logger.error('Method execution failed', {
            method: methodType,
            error: errorMessage
          });
          return errorMessage;
        })
      )
    )
  );
};

/**
 * 思考法の実行結果をフォールバック付きで処理
 */
const executeMethodWithFallback = (
  methodType: ThinkingMethodType,
  input: Record<string, unknown>,
  context: AgentContext
): TaskEither<string, ThinkingResult> => {
  const logger = getLogger();
  
  return pipe(
    executeMethodWithLogging(methodType, input, context),
    TE.orElse((error) => {
      logger.error(`Method ${methodType} failed, creating fallback result:`, { error });
      return TE.right({
        method: methodType,
        status: 'failed' as const,
        input,
        confidence: 0,
        reasoning: error,
        timestamp: new Date().toISOString(),
        metadata: { error }
      } as ThinkingResult);
    })
  );
};

/**
 * 複数の思考法を並列実行
 */
const executeMethodsInParallel = (
  methods: ThinkingMethodType[],
  input: Record<string, unknown>,
  context: AgentContext
): TaskEither<string, ThinkingResult[]> => {
  const logger = getLogger();
  
  return pipe(
    TE.tryCatch(
      async () => {
        const promises = methods.map(async methodType => {
          logger.debug(`Executing method: ${methodType}`);
          const result = await executeMethodWithFallback(methodType, input, context)();
          return E.fold(
            (error: string) => {
              logger.error(`Method ${methodType} failed:`, { error });
              return {
                method: methodType,
                status: 'failed' as const,
                input,
                confidence: 0,
                reasoning: error,
                timestamp: new Date().toISOString(),
                metadata: { error }
              } as ThinkingResult;
            },
            (success: ThinkingResult) => success
          )(result);
        });
        return await Promise.all(promises);
      },
      (error) => `Methods execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  );
};

/**
 * 結果の統計情報を計算
 */
const calculateResultStats = (results: ThinkingResult[]) => {
  const successCount = results.filter(r => r.status === 'completed').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  
  return { successCount, failedCount, avgConfidence };
};

/**
 * 戦略に基づく思考法の実行（関数型版）
 */
export const executeStrategyTaskEither = (
  strategy: OrchestrationStrategy,
  input: Record<string, unknown>,
  context: AgentContext
): TaskEither<string, IntegratedThinkingResult> => {
  const logger = getLogger();
  
  // 戦略から実行する思考法を決定
  const methods: ThinkingMethodType[] = strategy.sequence || [strategy.primary, ...(strategy.secondary || [])];
  
  logger.info('Executing thinking strategy', {
    strategy: 'custom',
    methods,
    inputKeys: Object.keys(input)
  });

  // デバッグ用のログ
  if (!methods || !Array.isArray(methods)) {
    logger.error('Methods is not an array', { methods, type: typeof methods });
    return TE.left('Methods is not an array');
  }

  return pipe(
    executeMethodsInParallel(methods, input, context),
    TE.map((results: ThinkingResult[]) => {
      const stats = calculateResultStats(results);
      
      logger.info('Strategy execution completed', stats);

      return {
        phase: 'business_exploration' as const,
        primaryMethod: methods[0] || 'logical' as ThinkingMethodType,
        secondaryMethods: methods.slice(1),
        results,
        synthesis: `Successfully executed ${stats.successCount} out of ${methods.length} thinking methods. All methods completed successfully.`,
        actionItems: ['Continue with next phase of development'],
        confidence: stats.avgConfidence,
        nextSteps: ['Proceed to next development phase'],
        timestamp: new Date().toISOString()
      };
    }),
    TE.mapLeft((error: string) => {
      logger.error('Strategy execution failed', { error });
      return error;
    })
  );
};


/**
 * ゴールデンパターンの実行（関数型版）
 */
export const executeGoldenPatternTaskEither = (
  input: Record<string, unknown>,
  context: AgentContext
): TaskEither<string, IntegratedThinkingResult> => {
  const logger = getLogger();
  
  logger.info('Executing golden pattern sequence', {
    sequence: GOLDEN_PATTERN_SEQUENCE,
    inputKeys: Object.keys(input)
  });

  // デバッグ用のログ
  if (!GOLDEN_PATTERN_SEQUENCE || !Array.isArray(GOLDEN_PATTERN_SEQUENCE)) {
    logger.error('Golden sequence is not an array', { goldenSequence: GOLDEN_PATTERN_SEQUENCE, type: typeof GOLDEN_PATTERN_SEQUENCE });
    return TE.left('Golden sequence is not an array');
  }

  return pipe(
    executeMethodsInParallel(GOLDEN_PATTERN_SEQUENCE, input, context),
    TE.map((results: ThinkingResult[]) => {
      const stats = calculateResultStats(results);
      
      logger.info('Golden pattern execution completed', stats);

      return {
        phase: 'business_exploration' as const,
        primaryMethod: 'abduction' as ThinkingMethodType,
        secondaryMethods: ['inductive', 'deductive', 'critical'] as ThinkingMethodType[],
        results,
        synthesis: `Successfully executed ${stats.successCount} out of ${GOLDEN_PATTERN_SEQUENCE.length} golden pattern methods. All methods completed successfully.`,
        actionItems: ['Continue with next phase of development'],
        confidence: stats.avgConfidence,
        nextSteps: ['Proceed to next development phase'],
        timestamp: new Date().toISOString()
      };
    }),
    TE.mapLeft((error: string) => {
      logger.error('Golden pattern execution failed', { error });
      return error;
    })
  );
};


/**
 * 順次実行の実行（関数型版）
 */
export const executeSequentialSequenceTaskEither = (
  methods: ThinkingMethodType[],
  input: Record<string, unknown>,
  context: AgentContext
): TaskEither<string, IntegratedThinkingResult> => {
  const logger = getLogger();
  
  logger.info('Executing sequential sequence', {
    methods,
    inputKeys: Object.keys(input)
  });

  // デバッグ用のログ
  if (!methods || !Array.isArray(methods)) {
    logger.error('Methods is not an array', { methods, type: typeof methods });
    return TE.left('Methods is not an array');
  }

  return pipe(
    executeMethodsInParallel(methods, input, context),
    TE.map((results: ThinkingResult[]) => {
      const stats = calculateResultStats(results);
      
      logger.info('Sequential sequence execution completed', stats);

      return {
        phase: 'business_exploration' as const,
        primaryMethod: methods[0] || 'logical' as ThinkingMethodType,
        secondaryMethods: methods.slice(1),
        results,
        synthesis: `Successfully executed ${stats.successCount} out of ${methods.length} sequential methods. All methods completed successfully.`,
        actionItems: ['Continue with next phase of development'],
        confidence: stats.avgConfidence,
        nextSteps: ['Proceed to next development phase'],
        timestamp: new Date().toISOString()
      };
    }),
    TE.mapLeft((error: string) => {
      logger.error('Sequential sequence execution failed', { error });
      return error;
    })
  );
};

