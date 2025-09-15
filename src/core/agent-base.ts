import { z } from 'zod';
import {
  type ThinkingMethodType,
  type DevelopmentPhase,
  type ThinkingResult,
  type ThinkingProcessStatus
} from '../schemas/index.js';
import { 
  getLogger, 
  type TaskEither 
} from './index.js';
import * as E from 'fp-ts/lib/Either.js';
import * as TE from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { generateObject } from 'ai';
import type { LanguageModel } from './llm-provider.js';

/**
 * エージェント実行コンテキスト
 */
export interface AgentContext {
  readonly llmProvider: LanguageModel;
  readonly llmIntegration?: {
    generateStructuredOutput: <T>(
      schema: z.ZodSchema<unknown>,
      systemPrompt: string,
      userPrompt: string,
      providerName?: string,
      options?: {
        temperature?: number;
        maxTokens?: number;
        maxRetries?: number;
        enableAutoRecovery?: boolean;
        mode?: 'auto' | 'json' | 'tool';
        schemaName?: string;
        schemaDescription?: string;
      }
    ) => Promise<T>;
    generateStructuredOutputTaskEither?: <T>(
      schema: z.ZodSchema<unknown>,
      systemPrompt: string,
      userPrompt: string,
      providerName?: string,
      options?: {
        temperature?: number;
        maxTokens?: number;
        maxRetries?: number;
        enableAutoRecovery?: boolean;
        mode?: 'auto' | 'json' | 'tool';
        schemaName?: string;
        schemaDescription?: string;
      }
    ) => TE.TaskEither<Error, T>;
  };
  readonly userId: string;
  readonly sessionId?: string;
  readonly previousResults?: ThinkingResult[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * エージェント能力定義
 */
export interface AgentCapability {
  readonly methodType: ThinkingMethodType;
  readonly description: string;
  readonly applicablePhases: DevelopmentPhase[];
  readonly requiredInputSchema: z.ZodSchema<unknown>;
  readonly outputSchema: z.ZodSchema<unknown>;
  readonly combinationSynergies: ThinkingMethodType[]; // 相性の良い思考法
}

/**
 * エージェント設定
 */
export interface AgentConfig {
  readonly temperature?: number;
  readonly maxRetries?: number;
  readonly enableAutoRecovery?: boolean;
  readonly schemaName?: string;
  readonly schemaDescription?: string;
  readonly mode?: 'auto' | 'json' | 'tool';
}

/**
 * プロンプト生成関数の型定義
 */
export type PromptGenerator<Input> = (
  input: Input,
  capability: AgentCapability
) => E.Either<string, { system: string; user: string }>;

/**
 * 信頼度計算関数の型定義
 */
export type ConfidenceCalculator<Output> = (
  output: Output,
  context: AgentContext
) => number;

/**
 * 推論説明生成関数の型定義
 */
export type ReasoningGenerator<Input, Output> = (
  input: Input,
  output: Output,
  context: AgentContext
) => string;

/**
 * 次ステップ推奨関数の型定義
 */
export type NextStepRecommender = (
  result: ThinkingResult,
  phase: DevelopmentPhase
) => ThinkingMethodType[];

/**
 * 関数型エージェントのインターフェース
 */
export interface FunctionalAgent<Input, Output> {
  readonly capability: AgentCapability;
  readonly config: AgentConfig;
  readonly generatePrompts: PromptGenerator<Input>;
  readonly calculateConfidence: ConfidenceCalculator<Output>;
  readonly generateReasoning: ReasoningGenerator<Input, Output>;
  readonly recommendNextSteps: NextStepRecommender;
}

/**
 * 関数型エージェントの実行関数
 */
export const executeFunctionalAgent = <Input, Output>(
  agent: FunctionalAgent<Input, Output>,
  input: Input,
  context: AgentContext
): TaskEither<string, ThinkingResult> => {
  const logger = getLogger();

  return pipe(
    // 1. プロンプト生成
    agent.generatePrompts(input, agent.capability),
    E.mapLeft(error => `Prompt generation failed: ${error}`),
    TE.fromEither,

    // 2. LLM実行
    TE.chain((prompts) => {
      const { system, user } = prompts as unknown as { system: string; user: string };
      return pipe(
        executeLLMWithFallback(agent, system, user, context, logger),
        TE.map((output: unknown) => {
          const confidence = agent.calculateConfidence(output as Output, context);
          const reasoning = agent.generateReasoning(input, output as Output, context);

          return {
            method: agent.capability.methodType,
            input: input as unknown,
            output: output as unknown,
            confidence,
            reasoning,
            status: 'success' as ThinkingProcessStatus,
            timestamp: new Date().toISOString(),
            metadata: {
              agentConfig: agent.config,
              sessionId: context.sessionId,
              userId: context.userId
            }
          } as ThinkingResult;
        })
      );
    })
  );
};

/**
 * LLM実行のヘルパー関数（関数型パターン）
 */
const executeLLMWithFallback = <Input, Output>(
  agent: FunctionalAgent<Input, Output>,
  system: string,
  user: string,
  context: AgentContext,
  logger: ReturnType<typeof getLogger>
): TaskEither<string, Output> => {
  const outputSchema = agent.capability.outputSchema;
  
  return pipe(
    tryLLMIntegration(agent, system, user, context, outputSchema),
    TE.orElse(() => tryDirectAISDK(agent, system, user, context, outputSchema, logger))
  );
};

/**
 * LLMIntegrationを使用した実行
 */
const tryLLMIntegration = <Input, Output>(
  agent: FunctionalAgent<Input, Output>,
  system: string,
  user: string,
  context: AgentContext,
  outputSchema: z.ZodSchema<unknown>,
): TaskEither<string, Output> => {
  if (!context.llmIntegration || agent.config.enableAutoRecovery === false) {
    return TE.left('LLMIntegration not available');
  }

  const options = {
    temperature: agent.config.temperature ?? 0.7,
    maxRetries: agent.config.maxRetries ?? 3,
    enableAutoRecovery: agent.config.enableAutoRecovery ?? true,
    mode: agent.config.mode ?? 'auto',
    ...(agent.config.schemaName && { schemaName: agent.config.schemaName }),
    ...(agent.config.schemaDescription && { schemaDescription: agent.config.schemaDescription })
  };

  if (context.llmIntegration.generateStructuredOutputTaskEither) {
    return pipe(
      context.llmIntegration.generateStructuredOutputTaskEither(
        outputSchema,
        system,
        user,
        undefined,
        options
      ),
      TE.mapLeft(error => `LLMIntegration TaskEither failed: ${error.message}`),
      TE.map(result => result as Output)
    );
  } else {
    return pipe(
      TE.tryCatch(
        () => context.llmIntegration!.generateStructuredOutput(
          outputSchema,
          system,
          user,
          undefined,
          options
        ),
        (error) => error instanceof Error ? error : new Error('Unknown LLMIntegration error')
      ),
      TE.mapLeft(error => `LLMIntegration Promise failed: ${error.message}`),
      TE.map(result => result as Output)
    );
  }
};

/**
 * 直接AI SDKを使用した実行
 */
const tryDirectAISDK = <Input, Output>(
  agent: FunctionalAgent<Input, Output>,
  system: string,
  user: string,
  context: AgentContext,
  outputSchema: z.ZodSchema<unknown>,
  logger: ReturnType<typeof getLogger>
): TaskEither<string, Output> => {
  logger.warn('Falling back to direct AI SDK call');
  
  return pipe(
    TE.tryCatch(
      () => generateObject({
        model: context.llmProvider,
        schema: outputSchema,
        system,
        prompt: user,
        temperature: agent.config.temperature ?? 0.7,
      }),
      (error) => error instanceof Error ? error : new Error('Unknown AI SDK error')
    ),
    TE.map(result => result.object as Output),
    TE.mapLeft(error => `Direct AI SDK failed: ${error.message}`)
  );
};
